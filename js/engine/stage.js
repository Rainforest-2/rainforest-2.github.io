import { Enemy } from './enemy.js';

/**
 * stage.js
 * stage.json の wave を FrameTimer で処理。
 */
export class StageManager {
  constructor(stageDef, enemyDefs, world) {
    this.stageDef = stageDef;
    this.enemyDefs = enemyDefs;
    this.world = world;

    this.frame = 0;
    this.waveIndex = 0;

    this.enemyBaseHp = stageDef.base_hp_enemy;
    this.playerBaseHp = stageDef.base_hp_player;

    this.pending = [...stageDef.waves].sort((a, b) => a.time - b.time);
  }

  update() {
    this.frame += 1;

    // wave 出現
    while (this.pending.length && this.pending[0].time <= this.frame) {
      const wave = this.pending.shift();
      const def = this.enemyDefs[wave.enemy];
      if (!def) continue;
      for (let i = 0; i < wave.count; i += 1) {
        const spawnX = this.world.enemyBaseX + 50 + i * 20;
        this.world.enemies.push(new Enemy(def, spawnX));
      }
    }

    // 城接触チェック
    this.world.players.forEach((u) => {
      if (u.alive && u.x <= this.world.enemyBaseX + 20) {
        this.enemyBaseHp -= u.atkPower;
        u.alive = false;
      }
    });

    this.world.enemies.forEach((u) => {
      if (u.alive && u.x >= this.world.playerBaseX - 20) {
        this.playerBaseHp -= u.atkPower;
        u.alive = false;
      }
    });

    if (this.enemyBaseHp < 0) this.enemyBaseHp = 0;
    if (this.playerBaseHp < 0) this.playerBaseHp = 0;
  }

  isWin() {
    return (
      this.enemyBaseHp <= 0 ||
      (this.pending.length === 0 && this.world.enemies.filter((e) => e.alive).length === 0)
    );
  }

  isLose() {
    return this.playerBaseHp <= 0;
  }
}
