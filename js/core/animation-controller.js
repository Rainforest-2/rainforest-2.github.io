export class AnimationController {
  constructor(definition) {
    this.definition = definition;
    this.state = 'walk';
    this.frame = 0;
    this.timer = 0;
    this.locked = false;
  }

  setState(nextState, { lockUntilEnd = false } = {}) {
    if (this.locked && this.state !== nextState) return;
    if (this.state === nextState) return;
    this.state = nextState;
    this.frame = 0;
    this.timer = 0;
    this.locked = lockUntilEnd;
  }

  update(dt) {
    const clip = this.definition[this.state] || this.definition.walk;
    if (!clip || clip.frames <= 1) return;

    this.timer += dt;
    while (this.timer >= clip.frameDuration) {
      this.timer -= clip.frameDuration;
      this.frame += 1;

      if (this.frame >= clip.frames) {
        if (clip.loop) {
          this.frame = 0;
        } else {
          this.frame = clip.frames - 1;
          this.locked = false;
          break;
        }
      }
    }
  }

  isFinished() {
    const clip = this.definition[this.state] || this.definition.walk;
    return !clip.loop && this.frame >= clip.frames - 1;
  }

  currentColor() {
    const clip = this.definition[this.state] || this.definition.walk;
    const palette = clip.palette || ['#ffffff'];
    return palette[this.frame % palette.length];
  }
}
