/**
 * collision.js
 * にゃんこ方式のライン判定（中心座標 + 射程）専用。
 */
export class Collision {
  static isInRange(attacker, target) {
    // 味方は右→左（向き -1）: x - range <= target.x
    // 敵は左→右（向き +1）: x + range >= target.x
    if (attacker.direction < 0) {
      return attacker.x - attacker.range <= target.x;
    }
    return attacker.x + attacker.range >= target.x;
  }

  static pickFrontTarget(attacker, candidates) {
    // 進行方向先頭の 1 体を優先。
    const filtered = candidates.filter((t) => t.alive && Collision.isInRange(attacker, t));
    if (!filtered.length) return null;

    if (attacker.direction < 0) {
      return filtered.sort((a, b) => a.x - b.x)[0];
    }
    return filtered.sort((a, b) => b.x - a.x)[0];
  }
}
