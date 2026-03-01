/**
 * camera.js
 * 横スクロール + ズーム + パララックス背景。
 */
export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;

    this.leftBoundary = 0;
    this.rightBoundary = 5000;

    this.dragging = false;
    this.dragPrevX = 0;

    this.parallax = [
      { factor: 0.2, color: '#cfc7b6' },
      { factor: 0.45, color: '#bab19e' },
      { factor: 0.7, color: '#9a927f' }
    ];

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.x -= 40 / this.zoom;
      if (e.key === 'ArrowRight') this.x += 40 / this.zoom;
      this.clamp();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.dragPrevX = e.clientX;
    });

    window.addEventListener('mouseup', () => {
      this.dragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.dragPrevX;
      this.dragPrevX = e.clientX;
      this.x -= dx / this.zoom;
      this.clamp();
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 0.92 : 1.08;
      this.zoom = Math.min(1.8, Math.max(0.6, this.zoom * scale));
      this.clamp();
    });
  }

  setBoundaries(left, right) {
    this.leftBoundary = left;
    this.rightBoundary = right;
    this.clamp();
  }

  clamp() {
    const visibleWorldWidth = this.canvas.width / this.zoom;
    const maxX = Math.max(this.leftBoundary, this.rightBoundary - visibleWorldWidth);
    this.x = Math.max(this.leftBoundary, Math.min(maxX, this.x));
  }

  applyTransform(ctx, drawWorldFn) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
    drawWorldFn();
    ctx.restore();
  }

  drawParallax(ctx) {
    const h = this.canvas.height;
    this.parallax.forEach((layer, i) => {
      ctx.fillStyle = layer.color;
      const offset = -(this.x * layer.factor) % 600;
      for (let x = -600 + offset; x < this.canvas.width + 600; x += 600) {
        ctx.fillRect(x, 0, 600, h * (0.35 + i * 0.1));
      }
    });
  }
}
