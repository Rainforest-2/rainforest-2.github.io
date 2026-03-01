import { Collision } from './collision.js';

/**
 * unit.js
 * 味方・敵共通の本体。30FPS固定、フレームで全管理。
 */
export class Unit {
  constructor(def, side, spawnX) {
    this.id = crypto.randomUUID();
    this.name = def.name;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.cost = def.cost ?? 0;
    this.recharge = def.recharge ?? 0;
    this.range = def.range;
    this.speed = def.speed;
    this.atkPower = def.atk_power;
    this.attackStateDef = def.attack_state;
    this.kbCount = Math.max(1, def.kb_count ?? 1);
    this.attributes = def.attributes ?? {};

    this.side = side; // 'player' or 'enemy'
    this.direction = side === 'player' ? -1 : 1;
    this.x = spawnX;
    this.y = 0;

    this.alive = true;
    this.state = 'move'; // move | attack | knockback
    this.stateFrame = 0;
    this.attackDone = false;
    this.targetId = null;
    this.knockbackInvuln = 0;

    this.nextKbHp = this.maxHp - this.maxHp / this.kbCount;
  }

  hitRangeStart() {
    return this.direction < 0 ? this.x - this.range : this.x;
  }

  hitRangeEnd() {
    return this.direction < 0 ? this.x : this.x + this.range;
  }

  takeDamage(value) {
    if (!this.alive || this.knockbackInvuln > 0) return;
    this.hp -= value;

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return;
    }

    // 最大HP/kb_count ごとに KB
    if (this.hp <= this.nextKbHp) {
      this.startKnockback();
      this.nextKbHp -= this.maxHp / this.kbCount;
    }
  }

  startKnockback() {
    this.state = 'knockback';
    this.stateFrame = 0;
    this.knockbackInvuln = 12;
  }

  update(world) {
    if (!this.alive) return;
    if (this.knockbackInvuln > 0) this.knockbackInvuln -= 1;

    if (this.state === 'knockback') {
      // 後方へ短く吹き飛ぶ（進行方向の逆向き）
      this.x -= this.direction * 7;
      this.stateFrame += 1;
      if (this.stateFrame >= 12) {
        this.state = 'move';
        this.stateFrame = 0;
      }
      return;
    }

    const enemies = this.side === 'player' ? world.enemies : world.players;
    const target = Collision.pickFrontTarget(this, enemies);

    if (this.state === 'attack') {
      this.stateFrame += 1;
      const hitFrame = this.attackStateDef.hit;
      const totalFrame = this.attackStateDef.total;

      // hitF で1回だけ判定。対象死亡後もモーション継続。
      if (!this.attackDone && this.stateFrame >= hitFrame) {
        this.attackDone = true;
        if (target) target.takeDamage(this.atkPower);
      }

      if (this.stateFrame >= totalFrame) {
        this.state = 'move';
        this.stateFrame = 0;
        this.attackDone = false;
      }
      return;
    }

    if (target) {
      // 射程内なら停止して攻撃予備動作へ
      this.state = 'attack';
      this.stateFrame = 0;
      this.attackDone = false;
      return;
    }

    // 前進（味方は左、敵は右）
    this.x += this.speed * this.direction;
  }
}
