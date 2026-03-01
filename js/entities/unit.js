import { AnimationController } from '../core/animation-controller.js';

const STATE = {
  WALK: 'walk',
  ATTACK: 'attack',
  RECOVERY: 'recovery',
  KNOCKBACK: 'knockback',
  DEATH: 'death'
};

export class Unit {
  constructor({ definition, team, x, y }) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.team = team;
    this.x = x;
    this.y = y;
    this.width = definition.size?.w ?? 64;
    this.height = definition.size?.h ?? 64;

    this.maxHp = definition.hp;
    this.hp = definition.hp;
    this.attackPower = definition.attackPower;
    this.range = definition.range;
    this.moveSpeed = definition.moveSpeed;
    this.attackInterval = definition.attackInterval;
    this.attackWindup = definition.attackWindup;
    this.knockbackDistance = definition.knockbackDistance;
    this.knockbackDuration = definition.knockbackDuration;
    this.knockbackCount = definition.knockbackCount;
    this.attackToCastle = definition.attackToCastle;

    this.direction = team === 'ally' ? 1 : -1;
    this.state = STATE.WALK;
    this.alive = true;

    this.attackTimer = 0;
    this.attackWindupTimer = 0;
    this.recoveryTimer = 0;
    this.knockbackTimer = 0;
    this.invincibleTimer = 0;
    this.pendingDamageApplied = false;

    this.knockbackThresholds = Array.from({ length: this.knockbackCount }, (_, i) =>
      this.maxHp * (1 - (i + 1) / (this.knockbackCount + 1))
    );
    this.knockbackIndex = 0;

    this.animation = new AnimationController(definition.animations);
  }

  distanceTo(target) {
    return Math.abs(target.x - this.x);
  }

  inRangeOf(target) {
    return Math.abs(target.x - this.x) <= this.range;
  }

  update(dt, context) {
    if (!this.alive) {
      this.animation.setState('death');
      this.animation.update(dt);
      return;
    }

    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);

    if (this.state === STATE.KNOCKBACK) {
      this.knockbackTimer -= dt;
      const ratio = Math.max(0, this.knockbackTimer) / Math.max(this.knockbackDuration, 0.0001);
      this.x -= this.direction * this.knockbackDistance * dt / this.knockbackDuration;
      this.animation.setState('knockback');
      if (ratio <= 0) {
        this.state = STATE.WALK;
      }
      this.animation.update(dt);
      return;
    }

    if (this.state === STATE.ATTACK) {
      this.attackWindupTimer -= dt;
      this.animation.setState('attack', { lockUntilEnd: true });

      if (!this.pendingDamageApplied && this.attackWindupTimer <= 0) {
        this.pendingDamageApplied = true;
        context.applyAttack(this);
      }

      if (this.animation.isFinished()) {
        this.state = STATE.RECOVERY;
        this.recoveryTimer = this.attackInterval;
      }

      this.animation.update(dt);
      return;
    }

    if (this.state === STATE.RECOVERY) {
      this.recoveryTimer -= dt;
      this.animation.setState('walk');
      if (this.recoveryTimer <= 0) {
        this.state = STATE.WALK;
      }
      this.animation.update(dt);
      return;
    }

    const target = context.findTarget(this);
    if (target && this.inRangeOf(target)) {
      if (this.attackTimer <= 0) {
        this.beginAttack();
      }
    } else {
      this.animation.setState('walk');
      this.x += this.direction * this.moveSpeed * dt;
      this.pushToBattleBounds(context.stageStartX, context.stageEndX);
    }

    const enemyCastle = this.team === 'ally' ? context.enemyCastle : context.allyCastle;
    if (this.isAtCastle(enemyCastle)) {
      if (this.attackTimer <= 0) {
        this.beginAttack();
      }
    }

    this.animation.update(dt);
  }

  beginAttack() {
    this.state = STATE.ATTACK;
    this.attackTimer = this.attackInterval;
    this.attackWindupTimer = this.attackWindup;
    this.pendingDamageApplied = false;
    this.animation.setState('attack', { lockUntilEnd: true });
  }

  isAtCastle(castle) {
    const dx = Math.abs(castle.x - this.x);
    return dx <= this.range;
  }

  receiveDamage(amount) {
    if (!this.alive || this.invincibleTimer > 0) return;
    this.hp -= amount;

    if (this.hp <= 0) {
      this.alive = false;
      this.state = STATE.DEATH;
      this.animation.setState('death');
      return;
    }

    if (this.knockbackIndex < this.knockbackThresholds.length) {
      const threshold = this.knockbackThresholds[this.knockbackIndex];
      if (this.hp <= threshold) {
        this.triggerKnockback();
        this.knockbackIndex += 1;
      }
    }
  }

  triggerKnockback() {
    this.state = STATE.KNOCKBACK;
    this.knockbackTimer = this.knockbackDuration;
    this.invincibleTimer = this.knockbackDuration;
    this.animation.setState('knockback');
  }

  pushToBattleBounds(startX, endX) {
    this.x = Math.max(startX, Math.min(endX, this.x));
  }
}
