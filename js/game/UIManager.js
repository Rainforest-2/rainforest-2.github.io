export class UIManager {
  constructor(root, unitDefs, onSpawn, onWallet, onCannon) {
    this.moneyText = root.moneyText;
    this.walletLevel = root.walletLevel;
    this.cannonBtn = root.cannonBtn;
    this.cannonState = root.cannonState;
    this.scroller = root.slotScroller;
    this.slotEls = new Map();

    root.walletBtn.addEventListener('click', onWallet);
    root.cannonBtn.addEventListener('click', onCannon);

    Object.entries(unitDefs).forEach(([key, def]) => {
      const btn = document.createElement('button');
      btn.className = 'unit-slot disabled';
      btn.type = 'button';
      btn.innerHTML = `<div class="name">${def.name}</div><div class="cost">${def.cost}円</div><div class="cd"></div>`;
      btn.addEventListener('click', () => onSpawn(key));
      this.scroller.append(btn);
      this.slotEls.set(key, btn);
    });
  }

  render(state) {
    this.moneyText.textContent = `${Math.floor(state.money)} / ${state.moneyMax}円`;
    this.walletLevel.textContent = String(state.walletLevel);
    this.cannonState.textContent = `${Math.floor(state.cannonRatio * 100)}%`;
    this.cannonBtn.classList.toggle('ready', state.cannonReady);

    Object.entries(state.slotState).forEach(([key, s]) => {
      const el = this.slotEls.get(key);
      if (!el) return;
      el.classList.toggle('disabled', !s.canSpawn);
      const cd = el.querySelector('.cd');
      cd.style.transform = `scaleY(${s.cooldownRatio})`;
    });
  }
}
