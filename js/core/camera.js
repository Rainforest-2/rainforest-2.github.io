export class Camera {
  constructor({ viewportWidth, stageWidth }) {
    this.viewportWidth = viewportWidth;
    this.stageWidth = stageWidth;
    this.scrollX = 0;
    this.scrollSpeed = 680;
  }

  update(dt, inputX) {
    if (!inputX) return;
    this.scrollX += inputX * this.scrollSpeed * dt;
    this.scrollX = Math.max(0, Math.min(this.scrollX, this.maxScrollX()));
  }

  maxScrollX() {
    return Math.max(0, this.stageWidth - this.viewportWidth);
  }

  worldToScreenX(worldX) {
    return worldX - this.scrollX;
  }
}
