/**
 * loader.js
 * オフライン前提で JSON をまとめて読み込むだけの最小ローダー。
 */
export class Loader {
  static async loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`JSON load failed: ${path}`);
    }
    return response.json();
  }

  static async loadGameData() {
    const [units, enemies, stages] = await Promise.all([
      Loader.loadJSON('data/units.json'),
      Loader.loadJSON('data/enemies.json'),
      Loader.loadJSON('data/stages.json')
    ]);

    return { units, enemies, stages };
  }
}
