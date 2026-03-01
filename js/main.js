import { Camera } from './core/camera.js';
import { StageManager } from './systems/stage-manager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startButton = document.getElementById('startButton');
const spawnButton = document.getElementById('spawnButton');
const statusText = document.getElementById('statusText');
const moneyGauge = document.getElementById('moneyGauge');
const moneyValue = document.getElementById('moneyValue');
const allyCastleText = document.getElementById('allyCastleHp');
const enemyCastleText = document.getElementById('enemyCastleHp');
const stageTimeText = document.getElementById('stageTime');

const keyState = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keyState.left = true;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keyState.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keyState.left = false;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keyState.right = false;
});

function buildDefaultAnimations(theme) {
  return {
    walk: { frames: 4, frameDuration: 0.12, loop: true, palette: theme.walk },
    attack: { frames: 5, frameDuration: 0.08, loop: false, palette: theme.attack },
    knockback: { frames: 3, frameDuration: 0.09, loop: false, palette: theme.knockback },
    death: { frames: 4, frameDuration: 0.1, loop: false, palette: theme.death }
  };
}

async function loadData() {
  const [units, enemies, stages] = await Promise.all([
    fetch('assets/data/units.json').then((r) => r.json()),
    fetch('assets/data/enemies.json').then((r) => r.json()),
    fetch('assets/data/stages.json').then((r) => r.json())
  ]);

  Object.values(units).forEach((u) => {
    if (!u.animations) {
      u.animations = buildDefaultAnimations({
        walk: ['#b8f7d4', '#93eec1', '#7dddb0', '#9de8c5'],
        attack: ['#f6d365', '#fda085', '#f6d365', '#ffd3a5', '#ffe7ba'],
        knockback: ['#9ca3af', '#6b7280', '#9ca3af'],
        death: ['#f87171', '#ef4444', '#7f1d1d', '#111827']
      });
    }
  });

  Object.values(enemies).forEach((u) => {
    if (!u.animations) {
      u.animations = buildDefaultAnimations({
        walk: ['#f9a8d4', '#f472b6', '#ec4899', '#f472b6'],
        attack: ['#fb7185', '#f43f5e', '#e11d48', '#fb7185', '#fda4af'],
        knockback: ['#94a3b8', '#64748b', '#94a3b8'],
        death: ['#7f1d1d', '#450a0a', '#1f2937', '#111827']
      });
    }
  });

  return { units, enemies, stages };
}

function drawCastle(castle, camera, isAlly) {
  const width = 90;
  const height = 140;
  const x = camera.worldToScreenX(castle.x - width / 2);
  const y = 150;
  ctx.fillStyle = isAlly ? '#2563eb' : '#dc2626';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = 'white';
  ctx.fillText(isAlly ? 'ALLY CASTLE' : 'ENEMY CASTLE', x - 10, y - 10);
}

function drawUnit(unit, camera) {
  const x = camera.worldToScreenX(unit.x - unit.width / 2);
  const y = unit.y - unit.height;

  ctx.save();
  if (unit.team === 'enemy') {
    ctx.translate(x + unit.width, y);
    ctx.scale(-1, 1);
    ctx.fillStyle = unit.animation.currentColor();
    ctx.fillRect(0, 0, unit.width, unit.height);
  } else {
    ctx.fillStyle = unit.animation.currentColor();
    ctx.fillRect(x, y, unit.width, unit.height);
  }
  ctx.restore();

  const hpRatio = Math.max(0, unit.hp / unit.maxHp);
  ctx.fillStyle = '#111827';
  ctx.fillRect(x, y - 12, unit.width, 7);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x, y - 12, unit.width * hpRatio, 7);
}

function drawBackground(stage, camera) {
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, stage.groundY, canvas.width, canvas.height - stage.groundY);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  for (let x = 0; x < stage.width; x += 240) {
    const screenX = camera.worldToScreenX(x);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvas.height);
    ctx.stroke();
  }
}

(async function bootstrap() {
  const { units, enemies, stages } = await loadData();
  const stage = stages.defaultStage;

  const manager = new StageManager({ stage, allies: units, enemies });
  const camera = new Camera({ viewportWidth: canvas.width, stageWidth: stage.width });

  let running = false;
  let previous = performance.now();

  startButton.addEventListener('click', () => {
    location.reload();
  });

  spawnButton.addEventListener('click', () => {
    manager.spawnAlly('cat_basic');
  });

  statusText.textContent = '← → / A D でカメラスクロール。Deployで左拠点から出撃。';
  running = true;

  function frame(now) {
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;

    if (running) {
      const inputX = (keyState.right ? 1 : 0) - (keyState.left ? 1 : 0);
      camera.update(dt, inputX);
      manager.update(dt);

      drawBackground(stage, camera);
      ctx.font = '14px sans-serif';
      drawCastle(manager.allyCastle, camera, true);
      drawCastle(manager.enemyCastle, camera, false);
      manager.allyUnits.forEach((u) => drawUnit(u, camera));
      manager.enemyUnits.forEach((u) => drawUnit(u, camera));

      moneyGauge.max = manager.maxMoney;
      moneyGauge.value = Math.floor(manager.money);
      moneyValue.textContent = `${Math.floor(manager.money)} / ${manager.maxMoney}`;
      allyCastleText.textContent = Math.max(0, Math.ceil(manager.allyCastle.hp));
      enemyCastleText.textContent = Math.max(0, Math.ceil(manager.enemyCastle.hp));
      stageTimeText.textContent = manager.elapsed.toFixed(1);
      spawnButton.disabled = manager.money < units.cat_basic.cost || manager.finished;

      if (manager.finished) {
        statusText.textContent = manager.result === 'win' ? '勝利！敵城を破壊しました。' : '敗北…味方の城が崩壊。';
        running = false;
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
