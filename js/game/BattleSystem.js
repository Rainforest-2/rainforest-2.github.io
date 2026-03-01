import { Unit } from './Unit.js';

export class BattleSystem {
  constructor({ units, enemies, stage, worldWidth, battleHeight }) {
    this.unitDefs = normalizeUnitDefs(units, -1, 'ally');
    this.enemyDefs = normalizeUnitDefs(enemies, 1, 'enemy');
    this.stage = stage;
    this.worldWidth = worldWidth;
    this.battleHeight = battleHeight;
    this.groundY = battleHeight * 0.78;

    this.playerBase = { x: worldWidth - 150, hp: stage.base_hp_player, maxHp: stage.base_hp_player, w: 116, h: 150 };
    this.enemyBase = { x: 150, hp: stage.base_hp_enemy, maxHp: stage.base_hp_enemy, w: 106, h: 142 };

    this.units = [];
    this.frame = 0;
    this.effects = [];

    this.walletLevel = 1;
    this.moneyMax = 600;
    this.money = 280;
    this.moneyGainPerF = 0.9;
    this.rechargeMap = new Map();

    this.cannonMaxF = 900;
    this.cannonCharge = 0;
    this.cannonFxFrames = 0;

    this.waveIndex = 0;
  }

  resizeBattleHeight(h) {
    this.battleHeight = h;
    this.groundY = h * 0.78;
  }

  step() {
    this.frame += 1;
    this.money = Math.min(this.moneyMax, this.money + this.moneyGainPerF);
    this.cannonCharge = Math.min(this.cannonMaxF, this.cannonCharge + 1);
    if (this.cannonFxFrames > 0) this.cannonFxFrames -= 1;
    this.updateRecharges();
    this.spawnWaves();
    this.updateUnits();
    this.units = this.units.filter((u) => !u.dead);
    this.effects = this.effects.filter((fx) => --fx.life > 0);
  }

  updateRecharges() {
    for (const [k, v] of this.rechargeMap.entries()) {
      if (v > 0) this.rechargeMap.set(k, v - 1);
    }
  }

  spawnWaves() {
    while (this.waveIndex < this.stage.waves.length && this.stage.waves[this.waveIndex].time <= this.frame) {
      const wave = this.stage.waves[this.waveIndex++];
      for (let i = 0; i < wave.count; i += 1) {
        this.spawnEnemy(wave.enemy, i * 26);
      }
    }
  }

  spawnEnemy(type, offset = 0) {
    const def = this.enemyDefs[type];
    if (!def) return;
    this.units.push(new Unit({ ...def, x: this.enemyBase.x + 120 + offset, y: this.groundY }));
  }

  canSpawn(type) {
    const def = this.unitDefs[type];
    return this.money >= def.cost && (this.rechargeMap.get(type) ?? 0) <= 0;
  }

  spawnPlayer(type) {
    const def = this.unitDefs[type];
    if (!def || !this.canSpawn(type)) return false;
    this.money -= def.cost;
    this.rechargeMap.set(type, def.cooldown_F);
    this.units.push(new Unit({ ...def, x: this.playerBase.x - 120, y: this.groundY }));
    return true;
  }

  levelUpWallet() {
    const cost = 120 + this.walletLevel * 90;
    if (this.money < cost || this.walletLevel >= 8) return false;
    this.money -= cost;
    this.walletLevel += 1;
    this.moneyMax += 260;
    this.moneyGainPerF += 0.22;
    return true;
  }

  fireCannon() {
    if (this.cannonCharge < this.cannonMaxF) return false;
    this.cannonCharge = 0;
    this.cannonFxFrames = 12;
    this.units.forEach((u) => {
      if (u.side === 'enemy') {
        u.takeDamage(460);
        u.applyKnockback();
      }
    });
    return true;
  }

  updateUnits() {
    for (const u of this.units) {
      u.updateAnimation();

      if (u.knockbackFrames > 0) {
        u.knockbackFrames -= 1;
        u.rotation += 0.55 * u.dir;
        u.x -= u.dir * 7;
        continue;
      }

      const target = this.findFrontTarget(u);
      const inRange = target ? this.isInRange(u, target) : this.isInRangeToBase(u);

      if (!inRange) {
        u.inForeswing = false;
        u.attackTimer = 0;
        u.damageQueued = false;
        u.x += u.dir * u.speed;
      } else {
        if (!u.inForeswing && !u.damageQueued) {
          u.inForeswing = true;
          u.attackTimer = u.foreswing_F;
        }

        if (u.inForeswing) {
          u.attackTimer -= 1;
          if (u.attackTimer <= 0) {
            u.inForeswing = false;
            u.damageQueued = true;
            u.attackTimer = u.backswing_F;
            this.resolveHit(u, target);
          }
        } else if (u.damageQueued) {
          u.attackTimer -= 1;
          if (u.attackTimer <= 0) {
            u.damageQueued = false;
          }
        }
      }

      if (u.side === 'ally' && u.x <= this.enemyBase.x + 45) {
        this.enemyBase.hp = Math.max(0, this.enemyBase.hp - u.atk);
      }
      if (u.side === 'enemy' && u.x >= this.playerBase.x - 45) {
        this.playerBase.hp = Math.max(0, this.playerBase.hp - u.atk);
      }
    }
  }

  resolveHit(attacker, lockedTarget) {
    const target = lockedTarget && !lockedTarget.dead ? lockedTarget : this.findFrontTarget(attacker);
    if (target && this.isInRange(attacker, target)) {
      target.takeDamage(attacker.atk);
      this.effects.push({ x: target.x, y: target.y - target.size * 0.5, life: 8, text: Math.random() > 0.5 ? 'バシッ!' : 'ドカッ!' });
      return;
    }

    if (attacker.side === 'ally' && this.isInRangeToBase(attacker)) {
      this.enemyBase.hp = Math.max(0, this.enemyBase.hp - attacker.atk);
    } else if (attacker.side === 'enemy' && this.isInRangeToBase(attacker)) {
      this.playerBase.hp = Math.max(0, this.playerBase.hp - attacker.atk);
    }
  }

  findFrontTarget(attacker) {
    const foes = this.units.filter((u) => u.side !== attacker.side);
    if (foes.length === 0) return null;
    if (attacker.dir < 0) {
      return foes.filter((f) => f.x < attacker.x).sort((a, b) => b.x - a.x)[0] ?? null;
    }
    return foes.filter((f) => f.x > attacker.x).sort((a, b) => a.x - b.x)[0] ?? null;
  }

  isInRange(attacker, target) {
    const tip = attacker.attackTipX();
    if (attacker.dir < 0) return tip <= target.x + target.radius;
    return tip >= target.x - target.radius;
  }

  isInRangeToBase(attacker) {
    const tip = attacker.attackTipX();
    if (attacker.side === 'ally') return tip <= this.enemyBase.x + this.enemyBase.w * 0.5;
    return tip >= this.playerBase.x - this.playerBase.w * 0.5;
  }

  getUIState() {
    const slotState = {};
    Object.entries(this.unitDefs).forEach(([key, def]) => {
      const rem = Math.max(0, this.rechargeMap.get(key) ?? 0);
      slotState[key] = {
        canSpawn: this.canSpawn(key),
        cooldownRatio: def.cooldown_F ? rem / def.cooldown_F : 0
      };
    });

    return {
      money: this.money,
      moneyMax: this.moneyMax,
      walletLevel: this.walletLevel,
      cannonRatio: this.cannonCharge / this.cannonMaxF,
      cannonReady: this.cannonCharge >= this.cannonMaxF,
      slotState
    };
  }
}

function normalizeUnitDefs(source, dir, side) {
  const out = {};
  Object.entries(source).forEach(([key, d]) => {
    out[key] = {
      key,
      side,
      dir,
      name: d.name,
      cost: d.cost ?? 0,
      cooldown_F: d.recharge ?? 90,
      hp: d.hp,
      atk: d.atk_power,
      speed: d.speed,
      range: d.range,
      kb_count: d.kb_count ?? 1,
      foreswing_F: d.attack_state?.pre ?? 10,
      backswing_F: (d.attack_state?.total ?? 30) - (d.attack_state?.pre ?? 10),
      size: side === 'ally' ? 64 : 70
    };
  });
  return out;
}
