export class Renderer {
  constructor(canvas, camera, getBattleHeight) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.getBattleHeight = getBattleHeight;
  }

  resize() {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(state) {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const battleH = this.getBattleHeight();

    ctx.clearRect(0, 0, w, h);
    this.drawBackground(ctx, w, battleH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, battleH);
    ctx.clip();

    ctx.translate(-this.camera.x * this.camera.zoom, 0);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    this.drawBases(ctx, state);
    state.units.forEach((u) => this.drawUnit(ctx, u));
    state.effects.forEach((fx) => this.drawHit(ctx, fx));

    ctx.restore();

    if (state.cannonFxFrames > 0) this.drawCannonBeam(ctx, w, battleH, state.cannonFxFrames);
  }

  drawBackground(ctx, w, battleH) {
    const sky = ctx.createLinearGradient(0, 0, 0, battleH);
    sky.addColorStop(0, '#5d7dff');
    sky.addColorStop(0.65, '#8fe9ff');
    sky.addColorStop(1, '#d8f7ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, battleH);

    ctx.fillStyle = '#b9e862';
    ctx.fillRect(0, battleH * 0.73, w, battleH * 0.27);
  }

  drawBases(ctx, state) {
    const draw = (b, enemy) => {
      ctx.save();
      ctx.translate(b.x, state.groundY);
      ctx.fillStyle = enemy ? '#b3b3b3' : '#f8f4e4';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.rect(-b.w / 2, -b.h, b.w, b.h);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillRect(-18, -52, 36, 52);
      ctx.restore();
    };

    draw(state.enemyBase, true);
    draw(state.playerBase, false);
  }

  drawUnit(ctx, u) {
    const stretch = 1 + Math.sin(u.animT) * 0.12;
    const squash = 1 - Math.sin(u.animT) * 0.09;
    const attackWarp = u.inForeswing ? 1.25 : 1;
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(u.rotation);
    ctx.scale(u.dir < 0 ? -1 : 1, 1);

    if (u.side === 'ally') {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 5;
      ctx.scale(squash * attackWarp, stretch);
      ctx.beginPath();
      ctx.ellipse(0, -u.size * 0.55, u.size * 0.38, u.size * 0.33, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-u.size * 0.18, -u.size * 0.84);
      ctx.lineTo(-u.size * 0.03, -u.size * 1.08);
      ctx.lineTo(u.size * 0.1, -u.size * 0.83);
      ctx.moveTo(u.size * 0.05, -u.size * 0.82);
      ctx.lineTo(u.size * 0.2, -u.size * 1.05);
      ctx.lineTo(u.size * 0.27, -u.size * 0.79);
      ctx.stroke();
      ctx.fillStyle = '#111';
      if (u.knockbackFrames > 0) {
        ctx.fillRect(-18, -40, 10, 3);
        ctx.fillRect(8, -40, 10, 3);
      } else {
        ctx.beginPath();
        ctx.arc(-10, -38, 4, 0, Math.PI * 2);
        ctx.arc(10, -38, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, -20, 8, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = u.hitFlash ? '#ffdbdb' : '#9b5de5';
      ctx.strokeStyle = '#2d0d4e';
      ctx.lineWidth = 4;
      ctx.scale(stretch, squash * attackWarp);
      ctx.beginPath();
      ctx.roundRect(-u.size * 0.33, -u.size * 0.98, u.size * 0.66, u.size * 0.88, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffed66';
      ctx.beginPath();
      ctx.arc(-12, -42, 5, 0, Math.PI * 2);
      ctx.arc(12, -42, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHit(ctx, fx) {
    ctx.save();
    ctx.translate(fx.x, fx.y);
    const burst = 18 + (8 - fx.life) * 2;
    ctx.fillStyle = '#fff46c';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 12; i += 1) {
      const r = i % 2 === 0 ? burst : burst * 0.45;
      const a = (Math.PI * 2 * i) / 12;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(fx.text, -24, -22);
    ctx.restore();
  }

  drawCannonBeam(ctx, w, battleH, f) {
    ctx.save();
    const alpha = Math.min(0.8, f / 12);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, battleH * 0.25, w, battleH * 0.12);
    ctx.fillStyle = `rgba(0,255,255,${alpha * 0.7})`;
    ctx.fillRect(0, battleH * 0.29, w, battleH * 0.04);
    ctx.restore();
  }
}
