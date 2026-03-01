import { GameLoop } from './game/GameLoop.js';
import { Camera } from './game/Camera.js';
import { TouchInput } from './game/TouchInput.js';
import { Renderer } from './game/Renderer.js';
import { BattleSystem } from './game/BattleSystem.js';
import { UIManager } from './game/UIManager.js';

const canvas = document.getElementById('gameCanvas');
const uiBar = document.getElementById('uiBar');

const [units, enemies, stages] = await Promise.all([
  fetch('./data/units.json').then((r) => r.json()),
  fetch('./data/enemies.json').then((r) => r.json()),
  fetch('./data/stages.json').then((r) => r.json())
]);

const worldWidth = 4200;
const battleHeight = () => window.innerHeight - uiBar.getBoundingClientRect().height;

const camera = new Camera(worldWidth, window.innerWidth);
const renderer = new Renderer(canvas, camera, battleHeight);
const battle = new BattleSystem({
  units,
  enemies,
  stage: stages[0],
  worldWidth,
  battleHeight: battleHeight()
});

const ui = new UIManager(
  {
    moneyText: document.getElementById('moneyText'),
    walletLevel: document.getElementById('walletLevel'),
    walletBtn: document.getElementById('walletBtn'),
    cannonBtn: document.getElementById('cannonBtn'),
    cannonState: document.getElementById('cannonState'),
    slotScroller: document.getElementById('slotScroller')
  },
  battle.unitDefs,
  (key) => battle.spawnPlayer(key),
  () => battle.levelUpWallet(),
  () => battle.fireCannon()
);

new TouchInput(canvas, battleHeight, camera);

const loop = new GameLoop(
  () => {
    camera.applyInertia();
    battle.resizeBattleHeight(battleHeight());
    camera.setViewWidth(window.innerWidth);
    battle.step();
    ui.render(battle.getUIState());
  },
  () => {
    renderer.render({
      units: battle.units,
      effects: battle.effects,
      groundY: battle.groundY,
      enemyBase: battle.enemyBase,
      playerBase: battle.playerBase,
      cannonFxFrames: battle.cannonFxFrames
    });
  },
  30
);

function onResize() {
  renderer.resize();
  camera.setViewWidth(window.innerWidth);
}

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
onResize();
loop.start();
