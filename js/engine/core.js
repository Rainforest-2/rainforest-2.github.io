import { Unit } from './unit.js';
import { StageManager } from './stage.js';
import { Camera } from './camera.js';
import { AnimationController } from './animation.js';

/**
 * core.js
 * ゲームループ(30FPS)、資金、UI更新、描画、スポーン制御を統合。
 */
export class GameCore {
  constructor(canvas, uiRefs, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiRefs;
    this.data = data;

    this.FPS = 30;
    this.frame = 0;
    this.running = false;

    this.players = [];
    this.enemies = [];

    this.playerBaseX = 4700;
    this.enemyBaseX = 300;

    this.walletLevel = 1;
    this.walletMax = 1200;
    this.money = 300;
    this.incomeSpeed = 2.8;

    this.rechargeMap = new Map();

    this.camera = new Camera(canvas);
    this.camera.setBoundaries(this.enemyBaseX - 120, this.playerBaseX + 260);

    this.anim = new AnimationController();

    this.stage = null;
  }

  setupStage(index = 0) {
    const stageDef = this.data.stages[index];
    this.stage = new StageManager(stageDef, this.data.enemies, this);
    this.players = [];
    this.enemies = [];
    this.frame = 0;
    this.running = true;

    this.money = 300;
    this.walletLevel = 1;
    this.walletMax = 1200;
    this.incomeSpeed = 2.8;
    this.rechargeMap.clear();

    this.ui.statusText.textContent = `ステージ: ${stageDef.name}`;
    this.refreshUi();
  }

  canSpawn(unitKey) {
    const def = this.data.units[unitKey];
    const cooldownLeft = this.rechargeMap.get(unitKey) ?? 0;
    return this.money >= def.cost && cooldownLeft <= 0;
  }

  spawnPlayer(unitKey) {
    if (!this.running) return;
    if (!this.canSpawn(unitKey)) return;

    const def = this.data.units[unitKey];
    const spawnX = this.playerBaseX - 60;
    const unit = new Unit(def, 'player', spawnX);

    this.players.push(unit);
    this.money -= def.cost;
    this.rechargeMap.set(unitKey, def.recharge);
  }

  levelUpWallet() {
    const cost = 120 + (this.walletLevel - 1) * 80;
    if (this.money < cost || this.walletLevel >= 8) return;

    this.money -= cost;
    this.walletLevel += 1;
    this.walletMax += 400;
    this.incomeSpeed += 0.8;
  }

  tick() {
    if (!this.running || !this.stage) return;

    this.frame += 1;
    this.stage.update();

    this.money = Math.min(this.walletMax, this.money + this.incomeSpeed);

    this.rechargeMap.forEach((v, key) => {
      this.rechargeMap.set(key, Math.max(0, v - 1));
    });

    this.players.forEach((u) => u.update(this));
    this.enemies.forEach((u) => u.update(this));

    this.players = this.players.filter((u) => u.alive);
    this.enemies = this.enemies.filter((u) => u.alive);

    if (this.stage.isWin()) {
      this.running = false;
      this.ui.statusText.textContent = '勝利！';
    } else if (this.stage.isLose()) {
      this.running = false;
      this.ui.statusText.textContent = '敗北...';
    }

    this.refreshUi();
  }

  refreshUi() {
    this.ui.moneyText.textContent = `${Math.floor(this.money)} / ${this.walletMax}`;
    this.ui.moneyBar.max = this.walletMax;
    this.ui.moneyBar.value = Math.floor(this.money);
    this.ui.walletLevel.textContent = String(this.walletLevel);
    this.ui.frameCounter.textContent = String(this.frame);

    if (this.stage) {
      this.ui.enemyBaseHp.textContent = String(this.stage.enemyBaseHp);
      this.ui.playerBaseHp.textContent = String(this.stage.playerBaseHp);
    }
  }

  drawUnit(unit) {
    const { ctx } = this;

    const stateProgress = unit.state === 'attack'
      ? unit.stateFrame / Math.max(1, unit.attackStateDef.total)
      : 0;

    const walkOffset = unit.state === 'move' ? this.anim.getWalkOffset(this.frame + unit.x * 0.2) : 0;
    const attackScale = unit.state === 'attack' ? this.anim.getAttackScale(stateProgress) : 1;
    const kbRot = unit.state === 'knockback'
      ? this.anim.getKnockbackRotation(unit.stateFrame / 12, unit.direction)
      : 0;

    ctx.save();
    ctx.translate(unit.x, 520 + walkOffset);
    ctx.scale(unit.direction < 0 ? -1 : 1, 1);
    ctx.rotate(kbRot);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#121212';
    ctx.fillStyle = unit.side === 'player' ? '#f6f2e8' : '#353535';

    ctx.beginPath();
    ctx.ellipse(0, 0, 38 * attackScale, 30 * attackScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 射程線（デバッグ/仕様確認用）
    ctx.strokeStyle = '#8f2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(unit.range, -35);
    ctx.stroke();

    ctx.restore();
  }

  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.camera.drawParallax(ctx);

    this.camera.applyTransform(ctx, () => {
      // 地面
      ctx.fillStyle = '#8f846e';
      ctx.fillRect(this.enemyBaseX - 400, 560, this.playerBaseX - this.enemyBaseX + 800, 180);

      // 城（左=敵、右=味方）
      ctx.fillStyle = '#3b1f12';
      ctx.fillRect(this.enemyBaseX - 30, 420, 60, 140);
      ctx.fillStyle = '#e7e0cf';
      ctx.fillRect(this.playerBaseX - 30, 420, 60, 140);

      // すべてのワールド描画は camera transform 内で行う
      this.players.forEach((u) => this.drawUnit(u));
      this.enemies.forEach((u) => this.drawUnit(u));
    });
  }

  run() {
    const frameMs = 1000 / this.FPS;
    let lastTime = performance.now();
    let acc = 0;

    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      acc += dt;

      while (acc >= frameMs) {
        this.tick();
        acc -= frameMs;
      }

      this.render();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
