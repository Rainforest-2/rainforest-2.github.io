# Original Mini TD Prototype (HTML/CSS/JS Only)

ローカルのみで動作する、2Dタワーディフェンスの**下準備＋最小プロトタイプ**です。
著作権への配慮として、素材・命名・ゲーム内容はすべてオリジナルの仮実装です。

## 実行方法

1. このリポジトリをローカルに配置する。
2. `index.html` をブラウザで直接開く。
3. `Start Stage` で開始し、`Deploy Unit` で味方を出撃する。

> 補足: 一部ブラウザ設定では `fetch()` による JSON 読み込みが `file://` で制限される場合があります。
> その場合はローカル HTTP サーバー（例: `python -m http.server`）を使ってください。

## ディレクトリ構造

```text
project/
 ├ index.html
 ├ css/
 │   └ style.css
 ├ js/
 │   ├ main.js
 │   └ engine/
 │       ├ renderer.js
 │       ├ physics.js
 │       ├ timeline.js
 │       └ input.js
 ├ assets/
 │   ├ images/
 │   ├ sounds/
 │   └ data/
 └ README.md
```

## ファイル役割

- `index.html`
  - キャンバス、所持金ゲージ、出撃ボタン、開始ボタン、ステータス表示を提供。
- `css/style.css`
  - HUD とキャンバスを見やすく配置するための最小スタイル。
- `js/engine/timeline.js`
  - 固定 FPS 更新の `GameLoop`。
- `js/engine/renderer.js`
  - `Renderer`、`Sprite`、`ResourceLoader` を提供。
- `js/engine/physics.js`
  - 射程判定・ターゲット探索の `Collision`。
- `js/engine/input.js`
  - UI ボタン入力をゲーム処理へ接続。
- `js/main.js`
  - `Entity` と `BattleField`、戦闘の最小ロジック本体。
- `assets/data/units.json`
  - 味方・敵の共通ステータス定義（JSONテンプレート）。
- `assets/images/*.svg`
  - 仮キャラ・背景・ヒット演出のプレースホルダー素材。

## 実装済みの最小プロトタイプ要素

- 背景描画
- 味方1種の出撃
- 敵1種の定期出現
- 接近時の自動戦闘（射程判定、ダメージ、簡易ノックバック）
- 同一レーン管理
- お金自動増加
- 仮の勝利/敗北条件（基地HP）

## 拡張予定

- 複数ユニットと進化段階
- 演出強化（ヒットエフェクト、攻撃モーション、SE/BGM）
- ステージデータ駆動化（難易度、ウェーブ設定）
- UI 改善（クールダウン表示、編成スロット）
- セーブデータ（ローカルストレージ）
