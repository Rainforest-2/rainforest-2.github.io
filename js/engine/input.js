/**
 * Input maps DOM button events to game actions.
 */
class Input {
  constructor({ onStart, onSpawn }) {
    this.onStart = onStart;
    this.onSpawn = onSpawn;

    this.startButton = document.getElementById('startButton');
    this.spawnButton = document.getElementById('spawnButton');

    this.startButton.addEventListener('click', () => this.onStart());
    this.spawnButton.addEventListener('click', () => this.onSpawn());
  }

  setSpawnEnabled(enabled) {
    this.spawnButton.disabled = !enabled;
  }

  setStartEnabled(enabled) {
    this.startButton.disabled = !enabled;
  }
}

window.Input = Input;
