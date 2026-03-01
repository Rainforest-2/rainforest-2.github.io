let NEXT_ID = 1;

export class Unit {
  constructor(params) {
    this.id = NEXT_ID++;
    Object.assign(this, params);
    this.maxHp = this.hp;
    this.attackTimer = 0;
    this.inForeswing = false;
    this.damageQueued = false;
    this.kbTaken = 0;
    this.knockbackFrames = 0;
    this.rotation = 0;
    this.dead = false;
    this.animT = Math.random() * 99;
    this.hitFlash = 0;
  }

  get radius() {
    return this.size * 0.45;
  }

  attackTipX() {
    return this.x + this.dir * this.range;
  }

  updateAnimation() {
    this.animT += 0.24;
    if (this.hitFlash > 0) this.hitFlash -= 1;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 3;
    if (this.hp <= 0) {
      this.dead = true;
      return;
    }

    if (this.kb_count <= 0) return;
    const threshold = this.maxHp / this.kb_count;
    const expectedKb = Math.floor((this.maxHp - this.hp) / threshold);
    if (expectedKb > this.kbTaken) {
      this.kbTaken = expectedKb;
      this.applyKnockback();
    }
  }

  applyKnockback() {
    this.knockbackFrames = 18;
    this.rotation = 0;
  }
}
