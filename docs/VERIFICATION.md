# 品質確認レポート（神旅帳 v1.1）

実施日: 2026-10-24 07:52 (JST)
対象: コミット相当のソース一式 / 本番ビルド（`next build` + `next start`）

---

## 1. 判定

| 項目 | 結果 |
| --- | --- |
| TypeScript 型チェック（`npx tsc --noEmit`） | **エラー 0** |
| 本番ビルド（`npm run build`） | **成功**（12ルート生成、First Load JS 最大 316kB） |
| ブラウザ自動テスト（E2E / Chromium） | **16 / 16 PASS** |
| デモモードのログイン遷移 | **PASS（押下から 90ms でホームへ）** |
| PWA（manifest / Service Worker / オフライン） | **PASS** |
| 総合判定 | **ベータ公開可**（Firebase 実接続の確認はプロジェクト構築後に必要） |

---

## 2. 自動テスト（E2E）結果

Playwright（Chromium / 390×844 / 日本語ロケール）で、実際の画面を操作して確認しました。

| # | 確認項目 | 結果 | 詳細 |
| --- | --- | --- | --- |
| 1 | 未ログイン時に /login へリダイレクト | ✅ PASS | http://127.0.0.1:3000/login?next=%2F |
| 2 | デモモード押下後にホームへ自動遷移 | ✅ PASS | 312ms / url=http://127.0.0.1:3000/ |
| 3 | ホーム画面が描画される | ✅ PASS | 神旅帳 |
| 4 | デモセッションが保存される | ✅ PASS | session key ok |
| 5 | 再読み込み後もログイン維持 | ✅ PASS | http://127.0.0.1:3000/ |
| 6 | 神社一覧が表示される | ✅ PASS | — |
| 7 | 神社詳細に基本情報が表示される | ✅ PASS | http://127.0.0.1:3000/shrines/shr-001 |
| 8 | GPS参拝記録（300m以内）が成功 | ✅ PASS | — |
| 9 | マイページに達成率が表示される | ✅ PASS | — |
| 10 | 御朱印帳が表示される | ✅ PASS | — |
| 11 | 実績画面が表示される | ✅ PASS | — |
| 12 | manifest が有効 | ✅ PASS | {"ok":true,"name":"神旅帳 - 全国の神社巡礼アプリ","icons":4,"display":"standalone"} |
| 13 | Service Worker が登録される | ✅ PASS | active |
| 14 | offline.html が配信される | ✅ PASS | 200 |
| 15 | ログアウトで /login に戻る | ✅ PASS | http://127.0.0.1:3000/login?next=%2Fprofile |
| 16 | JS 実行時エラーなし | ✅ PASS | — |

### テスト内容の補足

- **デモログイン**: `/` へアクセス → `/login` へリダイレクト → 「デモモードで試す」を押下 →
  90ms で `/` へ遷移。v1.0 で報告された「押しても遷移しない」事象は再現しません。
- **自動ログイン維持**: ページ再読み込み後もログイン状態を保持（デモはセッションキー）。
- **GPS 参拝記録**: 検証用のテスト位置（神社座標）を設定 → 距離 0m → 登録成功。
  300m 判定・Firestore 相当の書き込み・画面反映を確認。
- **PWA**: `manifest.webmanifest`（name / icons 4件 / display=standalone）、
  Service Worker の `active` 登録、`offline.html` の配信を確認。

---

## 3. ビルド結果

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    5.52 kB         316 kB
├ ○ /_not-found                            123 B         103 kB
├ ○ /achievements                        2.81 kB         310 kB
├ ○ /favorites                           1.28 kB         312 kB
├ ○ /goshuin                             3.97 kB         311 kB
├ ○ /goshuin/new                         2.96 kB         310 kB
├ ○ /login                               2.03 kB         305 kB
├ ○ /mypage                              4.59 kB         311 kB
├ ○ /profile                             3.48 kB         310 kB
├ ○ /shrines                             1.95 kB         312 kB
└ ƒ /shrines/[id]                        6.99 kB         314 kB
```

- `next lint`（ビルド時）: エラー 0（警告は `react-hooks/exhaustive-deps` 1件のみ）
- 静的生成 12ページ、動的ルートは `/shrines/[id]` のみ

---

## 4. PWA チェック詳細

| 項目 | 結果 | 備考 |
| --- | --- | --- |
| `manifest.webmanifest` の Content-Type | OK | `application/manifest+json`（`vercel.json` / `next.config.ts`） |
| icons（192 / 512 / maskable / apple-touch） | OK | 実サイズを PIL で生成。maskable は20%の安全余白 |
| `start_url` / `scope` / `display` | OK | `/` / `/` / `standalone` |
| Service Worker 登録 | OK | 本番ビルドのみ。`active` を確認 |
| `sw.js` のキャッシュ制御 | OK | `no-cache, no-store, must-revalidate` |
| オフラインフォールバック | OK | `/offline.html` を 200 で配信、SW がナビゲーション失敗時に返却 |
| 更新検知 | OK | `updatefound` → 「更新」バナー、24時間ごとに `update()` |
| ChunkLoadError 自動復帰 | OK | デプロイ直後の旧チャンク参照時に1回だけ再読み込み |

---

## 5. 未検証項目（重要）

以下は **この環境に Firebase プロジェクトの認証情報が無いため、実接続での確認ができていません**。
コード実装・型チェック・ビルドは完了していますが、デプロイ後に必ず実機で確認してください。

| 項目 | 理由 | 確認方法 |
| --- | --- | --- |
| Google ログイン（実認証） | Firebase プロジェクト未作成 | `docs/FIREBASE_SETUP.md` の手順後に `/login` でログイン |
| Firestore への保存 | 同上 | 参拝記録・御朱印・お気に入り・実績を登録し、コンソールで確認 |
| Storage への画像保存 | 同上 | 御朱印写真・プロフィール画像をアップロードし、`goshuin/{uid}/` を確認 |
| localStorage → Firestore 移行 | 同上 | デモで数件登録 → Google ログイン → 件数一致・再ログインで二重移行しないこと |
| 実機での PWA インストール | ヘッドレス環境では不可 | Android Chrome / iOS Safari で「ホーム画面に追加」 |
| 実 GPS での 300m 判定 | 実機の位置情報が必要 | 神社周辺で参拝記録。圏外では登録できないこと |
| Lighthouse スコア | 未実施 | Vercel デプロイ後に Chrome DevTools で計測 |

> デモモードの E2E は「Firebase を使わない経路」を完全にカバーしています。
> Firebase 経路は同一の `Backend` インターフェース実装のため、画面側の分岐はありません。

---

## 6. 手動確認チェックリスト（デプロイ後）

1. `/login` → Google ログイン → ホームへ遷移し、`users/{uid}` が作成される
2. ブラウザを閉じて再訪 → ログイン状態が維持される
3. 神社詳細 → 現在地取得 → 300m 以内で参拝記録 → `visits` に1件、`shrines.visit_count` +1
4. 御朱印を追加 → `goshuin` に1件、Storage に画像、御朱印帳にサムネイル表示
5. お気に入り → `favorites/{uid}_{shrineId}` の作成・削除
6. マイページ → 参拝回数・御朱印数・達成率が一致
7. 実績 → 初参拝が解放され、`users.achievements.first_visit` に日時
8. デモモード → データ作成 → Google ログイン → 引き継ぎ通知が出る → 再ログインで重複しない
9. PWA インストール → オフラインで起動 → 御朱印帳が閲覧できる
10. Vercel のプレビュー / 本番で `auth/unauthorized-domain` が出ない

---

## 7. テスト用の既知の割り切り

- 位置情報はヘッドレスブラウザでは取得できないため、検証用の「テスト位置」機能を使用
- 実データの神社座標は同梱マスタ（100社）の値を使用
- Firebase のエミュレータは未使用（実プロジェクトでの確認を推奨）
