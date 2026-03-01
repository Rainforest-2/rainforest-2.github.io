export class GameLoop {
  constructor(stepFn, renderFn, fps = 30) {
    this.stepFn = stepFn;
    this.renderFn = renderFn;
    this.frameMs = 1000 / fps;
    this.accumulator = 0;
    this.last = 0;
    this.running = false;
    this.frame = 0;
  }

  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  tick = (now) => {
    if (!this.running) return;
    const dt = Math.min(now - this.last, 250);
    this.last = now;
    this.accumulator += dt;

    while (this.accumulator >= this.frameMs) {
      this.frame += 1;
      this.stepFn(this.frame);
      this.accumulator -= this.frameMs;
    }

    this.renderFn(this.accumulator / this.frameMs);
    requestAnimationFrame(this.tick);
  };
}
