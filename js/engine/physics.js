/**
 * Collision contains tiny helper methods for lane-based combat.
 */
class Collision {
  /**
   * Return true when defender is inside attacker's range in same lane.
   */
  static inRange(attacker, defender) {
    if (attacker.lane !== defender.lane) return false;
    const distance = Math.abs(attacker.x - defender.x);
    return distance <= attacker.range;
  }

  /**
   * Return nearest enemy in front of unit (based on team direction).
   */
  static findTarget(unit, enemies) {
    const sameLane = enemies.filter((e) => e.lane === unit.lane && e.alive);

    if (unit.team === 'player') {
      const ahead = sameLane.filter((e) => e.x >= unit.x);
      ahead.sort((a, b) => a.x - b.x);
      return ahead[0] || null;
    }

    const ahead = sameLane.filter((e) => e.x <= unit.x);
    ahead.sort((a, b) => b.x - a.x);
    return ahead[0] || null;
  }
}

window.Collision = Collision;
