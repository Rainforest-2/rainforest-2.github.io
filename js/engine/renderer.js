/**
 * Sprite stores an image and optional frame animation metadata.
 */
class Sprite {
  constructor(image, frameWidth = null, frameHeight = null, frameCount = 1, frameDuration = 0.15) {
    this.image = image;
    this.frameWidth = frameWidth || image.width;
    this.frameHeight = frameHeight || image.height;
    this.frameCount = frameCount;
    this.frameDuration = frameDuration;
    this.elapsed = 0;
    this.currentFrame = 0;
  }

  /** Advance frame timer for simple loop animations. */
  update(dt) {
    if (this.frameCount <= 1) return;
    this.elapsed += dt;
    if (this.elapsed >= this.frameDuration) {
      this.elapsed = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
  }

  /** Draw current frame to canvas at a target position and size. */
  draw(ctx, x, y, width, height, flip = false) {
    const sx = this.currentFrame * this.frameWidth;
    if (flip) {
      ctx.save();
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, sx, 0, this.frameWidth, this.frameHeight, 0, 0, width, height);
      ctx.restore();
      return;
    }

    ctx.drawImage(this.image, sx, 0, this.frameWidth, this.frameHeight, x, y, width, height);
  }
}

/**
 * Renderer centralizes draw helpers.
 */
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground(backgroundImage) {
    this.ctx.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
  }
}

/**
 * ResourceLoader preloads images and returns a key->Image dictionary.
 */
class ResourceLoader {
  constructor() {
    this.images = {};
  }

  loadImages(manifest) {
    const entries = Object.entries(manifest);
    const jobs = entries.map(([key, src]) => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          this.images[key] = image;
          resolve();
        };
        image.onerror = reject;
        image.src = src;
      });
    });

    return Promise.all(jobs).then(() => this.images);
  }
}

window.Sprite = Sprite;
window.Renderer = Renderer;
window.ResourceLoader = ResourceLoader;
