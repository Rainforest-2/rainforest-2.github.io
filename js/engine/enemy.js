import { Unit } from './unit.js';

/**
 * enemy.js
 * 将来的な敵固有能力拡張の受け皿。
 */
export class Enemy extends Unit {
  constructor(def, spawnX) {
    super(def, 'enemy', spawnX);
    this.isBoss = Boolean(def.is_boss);
  }
}
