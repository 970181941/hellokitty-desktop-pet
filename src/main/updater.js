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

      // 解压 DMG 并暂存新应用
      this._pushStatus({ status: 'installing' });

      const mountPoint = path.join(tmpDir, 'mnt');
      const stageDir = path.join(tmpDir, 'staged');
      fs.mkdirSync(mountPoint, { recursive: true });
      fs.mkdirSync(stageDir, { recursive: true });

      // 挂载 DMG
      try {
        await this._exec('hdiutil', [
          'attach', dmgPath,
          '-mountpoint', mountPoint,
          '-nobrowse', '-quiet'
        ]);
      } catch (e) {
        try { await this._exec('hdiutil', ['detach', mountPoint, '-force']); } catch (_) {}
        await this._exec('hdiutil', [
          'attach', dmgPath,
          '-mountpoint', mountPoint,
          '-nobrowse', '-quiet'
        ]);
      }

      // 查找 .app 并复制到暂存区
      const entries = fs.readdirSync(mountPoint);
      const appName = entries.find(e => e.endsWith('.app'));
      if (!appName) {
        try { await this._exec('hdiutil', ['detach', mountPoint, '-force', '-quiet']); } catch (_) {}
        throw new Error('DMG 中未找到 .app 文件');
      }

      const newAppPath = path.join(mountPoint, appName);
      const stagedAppPath = path.join(stageDir, appName);
      await this._exec('ditto', ['--noqtn', newAppPath, stagedAppPath]);

      // 卸载 DMG
      try { await this._exec('hdiutil', ['detach', mountPoint, '-force', '-quiet']); } catch (_) {}

      // 保存关键路径供 installUpdate 使用
      this._stagedAppPath = stagedAppPath;
      this._currentAppPath = path.dirname(path.dirname(process.execPath));
      this._currentPID = process.pid;
      this._tmpDir = tmpDir;
      this._appName = appName;

      // 检测应用运行位置
      const isWritable = this._isWritableAppPath(this._currentAppPath);
      this._canAutoInstall = isWritable;

      this._updateReady = true;
      this._pushStatus({ status: 'ready', version: this._latestVersion });
      return { ok: true };
    } catch (error) {
      console.error('[Updater] 下载更新失败:', error.message);
      this._pushStatus({ status: 'error', message: `下载失败: ${error.message}` });
      return { error: error.message };
    }
  }

  /**
   * 检测应用路径是否可写（只有在 /Applications 等可写目录才能自动更新）
   */
  _isWritableAppPath(appPath) {
    try {
      // 检查是否在 /Applications 目录下
      const normalizedPath = fs.realpathSync(appPath);
      if (normalizedPath.startsWith('/Applications/') || normalizedPath.startsWith('/Users/')) {
        // 尝试写入测试
        const testFile = path.join(appPath, '.write-test-' + Date.now());
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async installUpdate() {
    if (this.isDev) return { error: 'dev_mode' };
    if (!this._updateReady || !this._stagedAppPath) return { error: 'not_ready' };

    if (!this._canAutoInstall) {
      // 应用在只读位置（如 DMG），引导用户手动安装
      return this._manualInstall();
    }

    // 自动安装：写脚本 → 退出 → 脚本替换 → 启动
    const scriptPath = path.join(this._tmpDir, 'replace.sh');
    const logPath = path.join(this._tmpDir, 'update.log');
    const script = [
      '#!/bin/bash',
      '# Hello Kitty 桌面宠物 - 更新替换脚本',
      '',
      'STAGED="' + this._stagedAppPath + '"',
      'CURRENT="' + this._currentAppPath + '"',
      'PID=' + this._currentPID,
      'TMPDIR_PATH="' + this._tmpDir + '"',
      'LOG="' + logPath + '"',
      '',
      'echo "[$(date)] 开始更新" > "$LOG"',
      'echo "STAGED=$STAGED" >> "$LOG"',
      'echo "CURRENT=$CURRENT" >> "$LOG"',
      'echo "PID=$PID" >> "$LOG"',
      '',
      '# 等待当前进程完全退出',
      'for i in $(seq 1 20); do',
      '  if ! kill -0 $PID 2>/dev/null; then',
      '    echo "[$(date)] 进程已退出" >> "$LOG"',
      '    break',
      '  fi',
      '  sleep 0.5',
      'done',
      '',
      '# 额外等待确保文件锁释放',
      'sleep 2',
      '',
      '# 删除旧应用并复制新应用',
      'echo "[$(date)] 开始替换..." >> "$LOG"',
      'rm -rf "$CURRENT" 2>/dev/null',
      'ditto --noqtn "$STAGED" "$CURRENT" 2>>"$LOG"',
      '',
      'if [ $? -eq 0 ]; then',
      '  echo "[$(date)] 替换成功" >> "$LOG"',
      'else',
      '  echo "[$(date)] 替换失败" >> "$LOG"',
      'fi',
      '',
      '# 清除隔离属性',
      'xattr -cr "$CURRENT" 2>/dev/null',
      '',
      '# 启动新版本',
      'echo "[$(date)] 启动应用" >> "$LOG"',
      'open "$CURRENT"',
      '',
      '# 清理临时文件',
      'sleep 3',
      'rm -rf "$TMPDIR_PATH"',
      'echo "[$(date)] 更新完成" >> "$LOG"',
    ].join('\n');

    fs.writeFileSync(scriptPath, script, { mode: 0o755 });

    // 分离启动替换脚本（不随主进程退出）
    spawn('/bin/bash', [scriptPath], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    // 退出当前应用，让脚本接管
    app.quit();
    return { ok: true };
  }

  /**
   * 手动安装：挂载 DMG 到 Finder，引导用户拖入 Applications
   */
  _manualInstall() {
    try {
      // 重新挂载 DMG（之前已卸载），这次不隐藏，让用户看到
      const dmgPath = path.join(this._tmpDir, 'update.dmg');
      if (fs.existsSync(dmgPath)) {
        // 在 Finder 中打开 DMG
        spawn('open', [dmgPath], { detached: true, stdio: 'ignore' }).unref();
        this._pushStatus({
          status: 'error',
          message: '请将应用拖入“应用程序”文件夹后再试更新。已为你打开安装包。'
        });
      } else {
        // DMG 不存在，引导去 GitHub 下载
        shell.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`);
        this._pushStatus({
          status: 'error',
          message: '安装包已丢失，已为你打开下载页面。'
        });
      }
      return { error: 'manual_install_required' };
    } catch (e) {
      return { error: e.message };
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
