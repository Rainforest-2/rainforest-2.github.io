import { Loader } from './engine/loader.js';
import { GameCore } from './engine/core.js';

/**
 * main.js
 * UIイベントと GameCore を接続。
 */
const canvas = document.getElementById('gameCanvas');
const uiRefs = {
  moneyText: document.getElementById('moneyText'),
  moneyBar: document.getElementById('moneyBar'),
  enemyBaseHp: document.getElementById('enemyBaseHp'),
  playerBaseHp: document.getElementById('playerBaseHp'),
  walletLevel: document.getElementById('walletLevel'),
  frameCounter: document.getElementById('frameCounter'),
  statusText: document.getElementById('statusText')
};

const unitBar = document.getElementById('unitBar');
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.append(tooltip);

const data = await Loader.loadGameData();
const game = new GameCore(canvas, uiRefs, data);

function createSlotCanvasOverlay(slot, ratio) {
  const overlay = slot.querySelector('.cooldown');
  const c = overlay.getContext('2d');
  c.clearRect(0, 0, overlay.width, overlay.height);
  if (ratio <= 0) return;

  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath();
  c.moveTo(overlay.width / 2, overlay.height / 2);
  c.arc(
    overlay.width / 2,
    overlay.height / 2,
    overlay.width,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * ratio
  );
  c.closePath();
  c.fill();
}

function renderUnitBar() {
  unitBar.innerHTML = '';

  const keys = Object.keys(data.units).slice(0, 8);
  keys.forEach((key) => {
    const def = data.units[key];
    const slot = document.createElement('button');
    slot.className = 'unit-slot';
    slot.innerHTML = `<span class="name">${def.name}</span><span class="cost">${def.cost}円</span>`;

    const overlay = document.createElement('canvas');
    overlay.className = 'cooldown';
    overlay.width = 160;
    overlay.height = 82;
    slot.append(overlay);

    slot.addEventListener('click', () => game.spawnPlayer(key));

    slot.addEventListener('mouseenter', () => {
      tooltip.classList.add('show');
      tooltip.textContent = `${def.name} | 射程:${def.range} | 速度:${def.speed} | 再生産:${def.recharge}F`;
    });
    slot.addEventListener('mousemove', (e) => {
      tooltip.style.left = `${e.clientX + 12}px`;
      tooltip.style.top = `${e.clientY + 12}px`;
    });
    slot.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    unitBar.append(slot);
  });

  function updateSlots() {
    const slots = [...unitBar.querySelectorAll('.unit-slot')];
    slots.forEach((slot, i) => {
      const key = keys[i];
      const def = data.units[key];
      const cd = game.rechargeMap.get(key) ?? 0;
      const ratio = def.recharge ? cd / def.recharge : 0;

      const enable = game.canSpawn(key);
      slot.classList.toggle('enabled', enable);
      slot.classList.toggle('disabled', !enable);
      createSlotCanvasOverlay(slot, ratio);
    });

    requestAnimationFrame(updateSlots);
  }

  requestAnimationFrame(updateSlots);
}

renderUnitBar();

document.getElementById('startButton').addEventListener('click', () => game.setupStage(0));
document.getElementById('walletButton').addEventListener('click', () => game.levelUpWallet());

game.setupStage(0);
game.run();
