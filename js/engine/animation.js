/**
 * animation.js
 * フレーム単位の揺れ・ノックバック回転・攻撃タメの演出を返す。
 */
export class AnimationController {
  constructor() {
    this.walkAmplitude = 4;
    this.walkPeriod = 18;
  }

  getWalkOffset(frame) {
    return Math.sin((frame / this.walkPeriod) * Math.PI * 2) * this.walkAmplitude;
  }

  getAttackScale(progress) {
    // タメで少し縮み、ヒット付近で戻る簡易カーブ
    if (progress < 0.35) return 1 - progress * 0.2;
    if (progress < 0.55) return 0.93 + (progress - 0.35) * 0.5;
    return 1;
  }

  getKnockbackRotation(progress, direction) {
    // 回転しながら後退: 方向に応じて回転符号を変える
    return (1 - progress) * direction * 0.35;
  }
}
