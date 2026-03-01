/**
 * GameLoop handles a fixed time-step update and a draw pass.
 * This keeps battle logic deterministic while rendering smoothly.
 */
class GameLoop {
  constructor({ fps = 60, update, draw }) {
    this.fps = fps;
    this.step = 1 / fps;
    this.update = update;
    this.draw = draw;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.rafId = 0;

    // Bind once so requestAnimationFrame can call a stable function reference.
    this.tick = this.tick.bind(this);
  }

  /** Start the loop from current time. */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Stop rendering and updates. */
  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  /** Internal frame callback. */
  tick(nowMs) {
    if (!this.running) return;
    const now = nowMs / 1000;
    let delta = now - this.lastTime;
    this.lastTime = now;

    // Clamp delta to avoid huge simulation jumps after tab sleep.
    delta = Math.min(delta, 0.25);
    this.accumulator += delta;

    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }

    const alpha = this.accumulator / this.step;
    this.draw(alpha);
    this.rafId = requestAnimationFrame(this.tick);
  }
}

window.GameLoop = GameLoop;
