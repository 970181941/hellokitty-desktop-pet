const { GIFS, WINDOW_CONFIG } = require('../utils/constants');

class AnimationManager {
  constructor() {
    this.currentImg = document.getElementById('gif-current');
    this.nextImg = document.getElementById('gif-next');
    this.isSwapping = false;
    this.currentGifId = null;
    this.preloaded = new Set();
    this._currentIsA = true; // 跟踪哪个 img 是当前活跃的
  }

  /**
   * 获取 GIF 文件的完整路径
   */
  getGifPath(gifId) {
    const gifInfo = GIFS[gifId];
    if (!gifInfo) return null;
    return `../../assets/gifs/${gifInfo.file}`;
  }

  /**
   * 预加载指定的 GIF
   */
  preload(gifIds) {
    for (const id of gifIds) {
      if (this.preloaded.has(id)) continue;
      const path = this.getGifPath(id);
      if (!path) continue;
      const img = new Image();
      img.src = path;
      this.preloaded.add(id);
    }
  }

  /**
   * 播放指定动画
   * @param {string} gifId - GIF 标识
   * @param {object} options - { immediate: false }
   * @returns {Promise} 动画切换完成后 resolve
   */
  play(gifId, options = {}) {
    if (this.currentGifId === gifId && !options.force) {
      return Promise.resolve();
    }

    const path = this.getGifPath(gifId);
    if (!path) return Promise.resolve();

    this.currentGifId = gifId;

    if (options.immediate) {
      // 立即切换，无过渡
      const active = this._getActiveImg();
      active.src = path;
      // 重新加载 GIF 动画（强制重播）
      active.src = path + '?t=' + Date.now();
      return Promise.resolve();
    }

    return this._swapTo(path);
  }

  /**
   * 重新播放当前动画（重头开始）
   */
  replayCurrent() {
    if (!this.currentGifId) return Promise.resolve();
    const path = this.getGifPath(this.currentGifId);
    if (!path) return Promise.resolve();
    const active = this._getActiveImg();
    active.src = path + '?t=' + Date.now();
    return Promise.resolve();
  }

  /**
   * 获取当前播放的 GIF ID
   */
  getCurrentGifId() {
    return this.currentGifId;
  }

  /**
   * 内部方法：淡入淡出切换
   */
  _swapTo(newPath) {
    return new Promise((resolve) => {
      if (this.isSwapping) {
        // 如果正在切换，直接跳到最终状态
        resolve();
        return;
      }

      this.isSwapping = true;

      const currentActive = this._getActiveImg();
      const nextActive = this._getNextImg();

      // 设置新图片源并等待加载
      nextActive.src = newPath;

      const onLoad = () => {
        nextActive.removeEventListener('load', onLoad);

        // 切换 active class 触发 CSS 过渡
        currentActive.classList.remove('active');
        nextActive.classList.add('active');
        this._currentIsA = !this._currentIsA;

        // 等待 CSS 过渡完成
        setTimeout(() => {
          this.isSwapping = false;
          resolve();
        }, 350);
      };

      nextActive.addEventListener('load', onLoad);

      // 超时保护
      setTimeout(() => {
        if (this.isSwapping) {
          nextActive.removeEventListener('load', onLoad);
          currentActive.classList.remove('active');
          nextActive.classList.add('active');
          this._currentIsA = !this._currentIsA;
          this.isSwapping = false;
          resolve();
        }
      }, 3000);
    });
  }

  _getActiveImg() {
    return this._currentIsA ? this.currentImg : this.nextImg;
  }

  _getNextImg() {
    return this._currentIsA ? this.nextImg : this.currentImg;
  }
}

module.exports = AnimationManager;
