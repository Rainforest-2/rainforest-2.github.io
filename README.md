# にゃんこ風バトルエンジン再設計仕様書

## 概要
このリファクタは、既存の最小試作を **30FPS固定・フレーム基準ロジック** のバトルエンジンへ再構築したものです。
HTML/CSS/ES6 + Canvas2D のみで動作し、外部ライブラリは使用していません。

## 主要改修ログ

### 1. 侵攻方向の統一
- 敵城を左、味方城を右へ固定。
- 味方ユニットは右→左（`direction = -1`）、敵ユニットは左→右（`direction = 1`）。
- 射程判定線は方向に応じて正負を反転。

### 2. Camera システム導入
- `js/engine/camera.js` に Camera クラスを新設。
- 横スクロール（←→、ドラッグ）、ズーム（ホイール）に対応。
- 3層パララックス背景を `camera.x / factor` で描画。
- 左右境界で移動制限。

### 3. バトルロジックをフレーム管理へ統一
- `Unit` は `move / attack / knockback` 状態機械を持つ。
- 攻撃は `pre / hit / total` フレームで管理。
- hit判定は1回のみ、対象死亡後もモーション継続。
- KB は `maxHp / kbCount` ごとの閾値で発生。

### 4. 当たり判定の再実装
- 矩形衝突を排除。
- 中心X + 射程でライン判定（にゃんこ方式）。

### 5. stage.json 駆動の wave 管理
- `time(F)` 到達で敵を出現。
- 敵全滅/敵城破壊で勝利、味方城HP0で敗北。

### 6. 所持金と財布レベル
- 1Fごとに `money += incomeSpeed`。
- 財布レベルUPで `walletMax` と `incomeSpeed` を強化。
- ユニットスロットはコスト不足・再生産中を反映。

### 7. UI/UX
- 下部8スロット構成。
- hoverでユニット詳細。
- クールタイムを扇形オーバーレイ描画。
- 墨絵風に寄せた太線・抑彩度描画。

## ディレクトリ構成

```text
/
├ index.html
├ style.css
├ /js
│   ├ main.js
│   └ /engine
│       ├ core.js
│       ├ camera.js
│       ├ unit.js
│       ├ enemy.js
│       ├ stage.js
│       ├ animation.js
│       ├ collision.js
│       └ loader.js
├ /data
│   ├ units.json
│   ├ enemies.json
│   └ stages.json
└ /assets
    ├ /sprites
    └ /bg
```

## 実行方法
1. ルートで HTTP サーバーを起動（例: `python -m http.server 8000`）。
2. ブラウザで `http://localhost:8000` を開く。
3. ステージ開始、ユニット出撃、財布レベルUPを試す。

