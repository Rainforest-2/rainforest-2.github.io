import { Unit } from '../entities/unit.js';

export class StageManager {
  constructor({ stage, allies, enemies }) {
    this.stage = stage;
    this.alliesData = allies;
    this.enemiesData = enemies;

    this.elapsed = 0;
    this.waveCursor = 0;
    this.enemySpawnTimers = new Map();

    this.allyCastle = { x: stage.allyCastleX, hp: stage.castleHp, maxHp: stage.castleHp };
    this.enemyCastle = { x: stage.enemyCastleX, hp: stage.castleHp, maxHp: stage.castleHp };

    this.allyUnits = [];
    this.enemyUnits = [];

    this.money = stage.initialMoney;
    this.maxMoney = stage.maxMoney;
    this.moneyRate = stage.moneyRate;
    this.finished = false;
    this.result = 'running';
  }

  spawnAlly(unitId) {
    const def = this.alliesData[unitId];
    if (!def || this.money < def.cost || this.finished) return false;

    this.money -= def.cost;
    const spawned = new Unit({
      definition: def,
      team: 'ally',
      x: this.stage.allySpawnX,
      y: this.stage.groundY
    });
    this.allyUnits.push(spawned);
    return true;
  }

  update(dt) {
    if (this.finished) return;

    this.elapsed += dt;
    this.money = Math.min(this.maxMoney, this.money + this.moneyRate * dt);

    this.updateEnemyWaves(dt);

    const context = {
      stageStartX: 0,
      stageEndX: this.stage.width,
      allyCastle: this.allyCastle,
      enemyCastle: this.enemyCastle,
      findTarget: (unit) => this.findNearestTarget(unit),
      applyAttack: (unit) => this.applyAttack(unit)
    };

    this.allyUnits.forEach((unit) => unit.update(dt, context));
    this.enemyUnits.forEach((unit) => unit.update(dt, context));

    this.allyUnits = this.allyUnits.filter((u) => u.alive || !u.animation.isFinished());
    this.enemyUnits = this.enemyUnits.filter((u) => u.alive || !u.animation.isFinished());

    if (this.allyCastle.hp <= 0) {
      this.finished = true;
      this.result = 'lose';
    }
    if (this.enemyCastle.hp <= 0) {
      this.finished = true;
      this.result = 'win';
    }
  }

  updateEnemyWaves(dt) {
    while (this.waveCursor < this.stage.waves.length && this.elapsed >= this.stage.waves[this.waveCursor].at) {
      const wave = this.stage.waves[this.waveCursor];
      this.enqueueWave(wave);
      this.waveCursor += 1;
    }

    for (const [id, timer] of this.enemySpawnTimers) {
      const next = timer - dt;
      if (next <= 0) {
        const schedule = this.enemySpawnTimersMeta.get(id);
        this.spawnEnemy(schedule.enemyId);
        schedule.spawned += 1;
        if (schedule.spawned >= schedule.count) {
          this.enemySpawnTimers.delete(id);
          this.enemySpawnTimersMeta.delete(id);
        } else {
          const delay = schedule.intervalMin + Math.random() * (schedule.intervalMax - schedule.intervalMin);
          this.enemySpawnTimers.set(id, delay);
        }
      } else {
        this.enemySpawnTimers.set(id, next);
      }
    }
  }

  enqueueWave(wave) {
    if (!this.enemySpawnTimersMeta) this.enemySpawnTimersMeta = new Map();
    wave.spawns.forEach((spawn, index) => {
      const key = `${this.waveCursor}-${index}-${spawn.enemyId}`;
      this.enemySpawnTimersMeta.set(key, { ...spawn, spawned: 0 });
      this.enemySpawnTimers.set(key, spawn.delay || 0);
    });
  }

  spawnEnemy(enemyId) {
    const def = this.enemiesData[enemyId];
    if (!def) return;
    const enemy = new Unit({
      definition: def,
      team: 'enemy',
      x: this.stage.enemySpawnX,
      y: this.stage.groundY
    });
    this.enemyUnits.push(enemy);
  }

  findNearestTarget(unit) {
    const enemies = unit.team === 'ally' ? this.enemyUnits : this.allyUnits;
    const ahead = enemies
      .filter((e) => e.alive && (unit.team === 'ally' ? e.x >= unit.x : e.x <= unit.x))
      .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
    return ahead[0] || null;
  }

  applyAttack(attacker) {
    const target = this.findNearestTarget(attacker);
    if (target && attacker.inRangeOf(target)) {
      target.receiveDamage(attacker.attackPower);
      return;
    }

    const castle = attacker.team === 'ally' ? this.enemyCastle : this.allyCastle;
    if (attacker.isAtCastle(castle)) {
      castle.hp -= attacker.attackToCastle;
    }
  }
}
