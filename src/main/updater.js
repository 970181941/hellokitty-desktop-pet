const { app, shell } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const GITHUB_REPO = '970181941/hellokitty-desktop-pet';
const GITHUB_API_LATEST = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

class Updater {
  constructor() {
    this.statusCallback = null;
    this.isDev = !app.isPackaged;
    this._latestVersion = null;
    this._dmgUrl = null;
    this._releaseNotes = null;
    this._updateReady = false;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  _pushStatus(data) {
    if (this.statusCallback) {
      this.statusCallback(data);
    }
  }

  // --- HTTP helpers ---

  _httpGetJson(url, redirectCount = 0) {
    if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'hellokitty-desktop-pet-updater',
          'Accept': 'application/vnd.github.v3+json'
        }
      };
      https.get(url, options, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          res.resume();
          return this._httpGetJson(res.headers.location, redirectCount + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`GitHub API 返回 ${res.statusCode}`));
        }
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('解析 GitHub API 响应失败')); }
        });
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  _downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
      const doRequest = (reqUrl, redirects) => {
        if (redirects > 10) return reject(new Error('Too many redirects'));
        const client = reqUrl.startsWith('https') ? https : http;
        const options = {
          headers: {
            'User-Agent': 'hellokitty-desktop-pet-updater',
            'Accept': 'application/octet-stream'
          }
        };
        client.get(reqUrl, options, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            res.resume();
            return doRequest(res.headers.location, redirects + 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const total = parseInt(res.headers['content-length'] || '0', 10);
          let downloaded = 0;
          const stream = fs.createWriteStream(destPath);
          res.on('data', (chunk) => {
            downloaded += chunk.length;
            if (onProgress && total > 0) {
              onProgress(downloaded, total);
            }
          });
          res.pipe(stream);
          stream.on('finish', () => stream.close(() => resolve()));
          stream.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
          res.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
        }).on('error', reject);
      };
      doRequest(url, 0);
    });
  }

  _exec(cmd, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { stdio: 'pipe' });
      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd} 退出码 ${code}: ${stderr.slice(0, 200)}`));
      });
      proc.on('error', reject);
    });
  }

  _isNewerVersion(remote, current) {
    const r = remote.replace(/^v/, '').split('.').map(Number);
    const c = current.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((r[i] || 0) > (c[i] || 0)) return true;
      if ((r[i] || 0) < (c[i] || 0)) return false;
    }
    return false;
  }

  // --- Public API ---

  async checkForUpdates() {
    if (this.isDev) {
      this._pushStatus({ status: 'error', message: '开发模式下无法检查更新' });
      return { available: false, reason: 'dev_mode' };
    }

    this._pushStatus({ status: 'checking' });

    try {
      const release = await this._httpGetJson(GITHUB_API_LATEST);

      const tagName = release.tag_name || '';
      const latestVersion = tagName.replace(/^v/, '');

      if (!latestVersion) {
        this._pushStatus({ status: 'error', message: '无法获取版本信息' });
        return { available: false };
      }

      this._latestVersion = latestVersion;
      this._releaseNotes = release.body || '';

      // 查找 DMG 资源
      const dmgAsset = (release.assets || []).find(a =>
        a.name.endsWith('.dmg') && !a.name.endsWith('.blockmap')
      );

      if (dmgAsset) {
        this._dmgUrl = dmgAsset.browser_download_url;
      }

      const currentVersion = app.getVersion();

      if (this._isNewerVersion(latestVersion, currentVersion)) {
        this._pushStatus({
          status: 'available',
          version: latestVersion,
          notes: this._releaseNotes,
          hasDownload: !!this._dmgUrl
        });
        return { available: true, version: latestVersion };
      }

      this._pushStatus({ status: 'not-available', version: latestVersion });
      return { available: false, version: latestVersion };
    } catch (error) {
      console.error('[Updater] 检查更新失败:', error.message);
      this._pushStatus({ status: 'error', message: `检查失败: ${error.message}` });
      return { available: false, error: error.message };
    }
  }

  async downloadUpdate() {
    if (this.isDev) return { error: 'dev_mode' };

    if (!this._dmgUrl) {
      // 没有 DMG 资源，引导用户去 GitHub 页面
      this._pushStatus({ status: 'manual-download', version: this._latestVersion });
      return { error: 'no_download_url' };
    }

    try {
      const tmpDir = path.join(app.getPath('temp'), 'hellokitty-update');
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tmpDir, { recursive: true });

      const dmgPath = path.join(tmpDir, 'update.dmg');

      // 下载 DMG
      this._pushStatus({ status: 'downloading', percent: 0 });
      await this._downloadFile(this._dmgUrl, dmgPath, (downloaded, total) => {
        this._pushStatus({
          status: 'downloading',
          percent: Math.round((downloaded / total) * 100),
          total,
          transferred: downloaded,
        });
      });
      this._pushStatus({ status: 'downloading', percent: 100 });

      // 安装更新
      this._pushStatus({ status: 'installing' });

      const mountPoint = path.join(tmpDir, 'mnt');
      fs.mkdirSync(mountPoint, { recursive: true });

      // 挂载 DMG
      try {
        await this._exec('hdiutil', [
          'attach', dmgPath,
          '-mountpoint', mountPoint,
          '-nobrowse', '-quiet'
        ]);
      } catch (e) {
        // 如果已挂载，先卸载
        try { await this._exec('hdiutil', ['detach', mountPoint, '-force']); } catch (_) {}
        await this._exec('hdiutil', [
          'attach', dmgPath,
          '-mountpoint', mountPoint,
          '-nobrowse', '-quiet'
        ]);
      }

      // 查找 .app
      const entries = fs.readdirSync(mountPoint);
      const appName = entries.find(e => e.endsWith('.app'));
      if (!appName) {
        try { await this._exec('hdiutil', ['detach', mountPoint, '-force', '-quiet']); } catch (_) {}
        throw new Error('DMG 中未找到 .app 文件');
      }

      const newAppPath = path.join(mountPoint, appName);
      // 当前应用路径: process.execPath = /path/to/App.app/Contents/MacOS/exec
      const currentAppPath = path.dirname(path.dirname(process.execPath));

      // 用 ditto 覆盖当前应用（macOS 允许覆盖运行中应用的资源文件）
      await this._exec('ditto', ['--noqtn', newAppPath, currentAppPath]);

      // 卸载 DMG
      try { await this._exec('hdiutil', ['detach', mountPoint, '-force', '-quiet']); } catch (_) {}

      // 清除 quarantine 属性
      try { await this._exec('xattr', ['-cr', currentAppPath]); } catch (_) {}

      // 清理临时文件
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

      this._updateReady = true;
      this._pushStatus({ status: 'ready', version: this._latestVersion });
      return { ok: true };
    } catch (error) {
      console.error('[Updater] 下载安装更新失败:', error.message);
      this._pushStatus({ status: 'error', message: `安装失败: ${error.message}` });
      return { error: error.message };
    }
  }

  installUpdate() {
    if (this.isDev) return;
    if (this._updateReady) {
      app.relaunch();
      app.quit();
    }
  }

  openReleasePage() {
    shell.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`);
  }

  getAppVersion() {
    return app.getVersion();
  }

  async getChangelog() {
    try {
      const release = await this._httpGetJson(GITHUB_API_LATEST);
      if (release.body) return release.body;
    } catch (_) {}

    // 本地 CHANGELOG.md 兜底
    try {
      const appPath = app.getAppPath();
      const changelogPath = path.join(appPath, 'CHANGELOG.md');
      if (fs.existsSync(changelogPath)) {
        return fs.readFileSync(changelogPath, 'utf-8');
      }
    } catch (_) {}

    return '暂无更新日志';
  }
}

module.exports = Updater;
