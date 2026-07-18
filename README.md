# Babylon.js TypeScript Demo

## セットアップ

```bash
npm i
npm run dev
```

ブラウザで表示されたローカル URL を開くと、ゲームが起動します。

## できること

- `WASD` で移動
- `F` で視点変更
- `npm run build` で `docs/` に GitHub Pages 用の本番ビルドを生成
- Babylon.js 本体は `docs/babylon.js` に分離して出力

## スクリプト

- `npm run dev`: 開発サーバー
- `npm run build`: TypeScript チェック後にアプリ本体と Babylon.js を別々にビルドし、成果物を `docs/` に出力
- `npm run preview`: ビルド結果の確認
- `npm run check`: 型チェック

## GitHub Pages で公開する

1. GitHub リポジトリの `Settings > Pages` を開く
2. `Build and deployment` の `Source` で `Deploy from a branch` を選ぶ
3. Branch に公開したいブランチ、Folder に `/docs` を選ぶ
4. ローカルで `npm run build` を実行して `docs/` を更新する
5. `docs/` を含めて commit / push する
