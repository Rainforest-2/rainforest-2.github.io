export class Camera {
  constructor(worldWidth, viewWidth) {
    this.worldWidth = worldWidth;
    this.viewWidth = viewWidth;
    this.zoom = 1;
    this.minZoom = 0.7;
    this.maxZoom = 1.8;
    this.x = worldWidth - viewWidth;
    this.velocity = 0;
  }

  setViewWidth(viewWidth) {
    this.viewWidth = viewWidth;
    this.clamp();
  }

  panByScreenDelta(deltaScreenX) {
    const worldDelta = deltaScreenX / this.zoom;
    this.x -= worldDelta;
    this.velocity = -worldDelta;
    this.clamp();
  }

  applyInertia() {
    if (Math.abs(this.velocity) < 0.02) {
      this.velocity = 0;
      return;
    }
    this.x += this.velocity;
    this.velocity *= 0.9;
    this.clamp();
  }

  zoomAt(screenX, ratio) {
    const prevZoom = this.zoom;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * ratio));
    const focusWorld = this.x + screenX / prevZoom;
    this.x = focusWorld - screenX / this.zoom;
    this.clamp();
  }

  clamp() {
    const maxX = this.worldWidth - this.viewWidth / this.zoom;
    this.x = Math.max(0, Math.min(maxX, this.x));
  }

  worldToScreen(worldX) {
    return (worldX - this.x) * this.zoom;
  }
}
