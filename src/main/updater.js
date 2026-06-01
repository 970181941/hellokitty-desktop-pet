const { autoUpdater } = require('electron-updater');
const { app } = require('electron');

class Updater {
  constructor() {
    this.statusCallback = null;
    this.isDev = !app.isPackaged;

    // 配置 autoUpdater
    autoUpdater.autoDownload = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // 注册事件监听
    this._registerEvents();
  }

  /**
   * 设置状态回调函数，用于向渲染进程推送更新状态
   * @param {Function} callback - (data) => void
   */
  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  /**
   * 推送状态到渲染进程
   */
  _pushStatus(data) {
    if (this.statusCallback) {
      this.statusCallback(data);
    }
  }

  /**
   * 注册 autoUpdater 事件
   */
  _registerEvents() {
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] 正在检查更新...');
      this._pushStatus({ status: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[Updater] 发现新版本:', info.version);
      this._pushStatus({
        status: 'available',
        version: info.version,
        releaseNotes: info.releaseNotes || '',
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[Updater] 已是最新版本');
      this._pushStatus({ status: 'not-available' });
    });

    autoUpdater.on('download-progress', (progress) => {
      this._pushStatus({
        status: 'downloading',
        percent: Math.round(progress.percent),
        bytesPerSecond: progress.bytesPerSecond,
        total: progress.total,
        transferred: progress.transferred,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[Updater] 更新已下载，等待安装');
      this._pushStatus({
        status: 'ready',
        version: info.version,
      });
    });

    autoUpdater.on('error', (error) => {
      console.error('[Updater] 更新错误:', error.message);
      this._pushStatus({
        status: 'error',
        message: error.message || '更新失败',
      });
    });
  }

  /**
   * 检查更新
   */
  async checkForUpdates() {
    if (this.isDev) {
      console.log('[Updater] 开发模式下跳过更新检查');
      this._pushStatus({
        status: 'error',
        message: '开发模式下无法检查更新',
      });
      return { available: false, reason: 'dev_mode' };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      const remoteVersion = result?.updateInfo?.version;
      return { available: remoteVersion ? remoteVersion !== app.getVersion() : false };
    } catch (error) {
      console.error('[Updater] 检查更新失败:', error.message);
      this._pushStatus({
        status: 'error',
        message: `检查失败: ${error.message}`,
      });
      return { available: false, error: error.message };
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate() {
    if (this.isDev) {
      return { error: 'dev_mode' };
    }

    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (error) {
      console.error('[Updater] 下载失败:', error.message);
      this._pushStatus({
        status: 'error',
        message: `下载失败: ${error.message}`,
      });
      return { error: error.message };
    }
  }

  /**
   * 安装更新并重启
   */
  installUpdate() {
    if (this.isDev) {
      console.log('[Updater] 开发模式下无法安装更新');
      return;
    }
    autoUpdater.quitAndInstall();
  }

  /**
   * 获取当前应用版本
   */
  getAppVersion() {
    return app.getVersion();
  }
}

module.exports = Updater;
