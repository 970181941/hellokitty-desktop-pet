const { app, shell } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/970181941/hellokitty-desktop-pet/main';
const GITHUB_RELEASES_BASE =
  'https://github.com/970181941/hellokitty-desktop-pet/releases/download';

class Updater {
  constructor() {
    this.statusCallback = null;
    this.isDev = !app.isPackaged;
    this._lastVersion = null;
    this._downloadUrl = null;
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

  _httpGet(url, redirectCount = 0) {
    if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'hellokitty-desktop-pet-updater' } }, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          res.resume();
          return this._httpGet(res.headers.location, redirectCount + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  _downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
      const doRequest = (reqUrl, redirects) => {
        if (redirects > 5) return reject(new Error('Too many redirects'));
        const client = reqUrl.startsWith('https') ? https : http;
        client.get(reqUrl, { headers: { 'User-Agent': 'hellokitty-desktop-pet-updater' } }, (res) => {
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

  // --- YAML parser ---

  _parseLatestMacYml(yml) {
    const versionMatch = yml.match(/^version:\s*(.+)$/m);
    const urlMatch = yml.match(/-\s+url:\s*(.+)$/m);
    if (!versionMatch || !urlMatch) return null;
    return {
      version: versionMatch[1].trim(),
      fileName: urlMatch[1].trim(),
    };
  }

  // --- Public API ---

  async checkForUpdates() {
    if (this.isDev) {
      this._pushStatus({ status: 'error', message: '开发模式下无法检查更新' });
      return { available: false, reason: 'dev_mode' };
    }

    this._pushStatus({ status: 'checking' });

    try {
      const yml = await this._httpGet(`${GITHUB_RAW_BASE}/dist/latest-mac.yml`);
      const info = this._parseLatestMacYml(yml);

      if (!info) {
        this._pushStatus({ status: 'error', message: '无法解析更新信息' });
        return { available: false };
      }

      const currentVersion = app.getVersion();
      this._lastVersion = info.version;
      this._downloadUrl = `${GITHUB_RELEASES_BASE}/v${info.version}/${info.fileName}`;

      if (this._isNewerVersion(info.version, currentVersion)) {
        this._pushStatus({ status: 'available', version: info.version });
        return { available: true };
      }

      this._pushStatus({ status: 'not-available' });
      return { available: false };
    } catch (error) {
      console.error('[Updater] 检查更新失败:', error.message);
      this._pushStatus({ status: 'error', message: `检查失败: ${error.message}` });
      return { available: false, error: error.message };
    }
  }

  async downloadUpdate() {
    if (this.isDev) return { error: 'dev_mode' };
    if (!this._downloadUrl) {
      this._pushStatus({ status: 'error', message: '无可用的下载链接' });
      return { error: 'no_url' };
    }

    try {
      const tmpDir = path.join(app.getPath('temp'), 'hellokitty-update');
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tmpDir, { recursive: true });

      const zipPath = path.join(tmpDir, 'update.zip');

      // 下载 zip
      await this._downloadFile(this._downloadUrl, zipPath, (downloaded, total) => {
        this._pushStatus({
          status: 'downloading',
          percent: Math.round((downloaded / total) * 100),
          total,
          transferred: downloaded,
        });
      });

      // 解压 zip
      this._pushStatus({ status: 'downloading', percent: 100 });
      const extractDir = path.join(tmpDir, 'extracted');
      await this._exec('ditto', ['-x', '-k', zipPath, extractDir]);

      // 覆盖当前应用（macOS 允许覆盖运行中应用的资源文件）
      const appPath = path.dirname(path.dirname(process.execPath));
      const newAppPath = path.join(extractDir, path.basename(appPath));

      if (fs.existsSync(newAppPath)) {
        await this._exec('ditto', [newAppPath, appPath]);
      }

      // 清除 quarantine 属性
      try {
        await this._exec('xattr', ['-cr', appPath]);
      } catch (e) { /* ignore */ }

      this._updateReady = true;
      this._pushStatus({ status: 'ready', version: this._lastVersion });
      return { ok: true };
    } catch (error) {
      console.error('[Updater] 下载/安装更新失败:', error.message);
      this._pushStatus({ status: 'error', message: `下载失败: ${error.message}` });
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

  getAppVersion() {
    return app.getVersion();
  }

  async getChangelog() {
    try {
      return await this._httpGet(`${GITHUB_RAW_BASE}/CHANGELOG.md`);
    } catch (e) {
      return '无法加载更新日志';
    }
  }

  // --- Helpers ---

  _isNewerVersion(remote, current) {
    const r = remote.split('.').map(Number);
    const c = current.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((r[i] || 0) > (c[i] || 0)) return true;
      if ((r[i] || 0) < (c[i] || 0)) return false;
    }
    return false;
  }

  _exec(cmd, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { stdio: 'ignore' });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd} exited with code ${code}`));
      });
      proc.on('error', reject);
    });
  }
}

module.exports = Updater;
