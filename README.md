# 神旅帳（Kamitabicho）v1.1 — 全国の神社巡礼アプリ

全国 **47都道府県・100社** の神社をめぐり、GPS 参拝記録・御朱印・参拝実績を一冊にまとめる PWA です。
v1.1 は **テストユーザーへ公開できるベータ版** として、Firebase 認証・Firestore・Storage・PWA・データ移行を実装しています。

- 技術構成: **Next.js 15（App Router） / React 19 / TypeScript / Tailwind CSS v4 / Firebase v12**
- ホスティング: **Vercel**（`hnd1` = 東京リージョン）
- PWA: `manifest.webmanifest` + Service Worker + オフラインページ（インストール可能）
- デモモード: Firebase 未設定でも全機能を端末内（localStorage）で試せます

---

## 1. クイックスタート（Firebase なしで確認）

```bash
npm install
cp .env.local.example .env.local   # 値は空のままでOK（デモモードで起動）
npm run dev                        # http://localhost:3000
```

1. 「デモモードで試す（登録不要）」を押す
2. ホーム画面へ自動遷移します（v1.1 で修正済み）
3. 神社詳細 → 「動作確認用：この神社の位置を現在地にする」→ 「参拝記録を登録」で
   GPS チェックインを実機なしで確認できます

> 本番ビルドの確認は `npm run build && npm run start`。Service Worker は本番ビルドでのみ登録されます。

---

## 2. 環境変数

`.env.local.example` をコピーして設定します。**必須は Firebase の6項目のみ**です。

| 変数 | 必須 | 用途 |
| --- | :---: | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ● | Firebase Web API キー |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ● | `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ● | プロジェクトID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ● | `<project>.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ● | 送信者ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ● | アプリID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | — | 未設定なら OpenStreetMap の簡易地図で動作 |
| `NEXT_PUBLIC_ENABLE_DEMO` | — | `false` でデモボタンを非表示（既定: 表示） |
| `NEXT_PUBLIC_ENABLE_DEMO_TOOLS` | — | テスト位置設定ツールの表示制御 |

3項目（APIキー・プロジェクトID・アプリID）が揃うと Firebase モードで起動します。
揃っていない場合は自動的にデモモードになります。

---

## 3. Firebase の設定

詳細な手順は **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** を参照してください。要約:

1. Firebase プロジェクト作成 → ウェブアプリを追加 → 構成情報を `.env.local` に貼り付け
2. **Authentication** → Google を有効化 → 承認済みドメインに `localhost` と Vercel ドメインを追加
3. **Firestore** → データベース作成（`asia-northeast1`）→ `firestore.rules` をデプロイ
4. **Storage** → バケット作成 → `storage.rules` をデプロイ
5. 神社マスタ投入: `npm run seed`（サービスアカウント鍵が必要）

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # プロジェクトを選択
firebase deploy --only firestore:rules,firestore:indexes,storage
npm run seed                  # 100社を投入（初回のみ）
```

---

## 4. Vercel へのデプロイ

```bash
npm i -g vercel
vercel link
# 環境変数を登録（Production / Preview / Development すべて）
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# … 6項目を登録 …
vercel --prod
```

Vercel のダッシュボードから行う場合は **Settings → Environment Variables** に上表の値を登録し、
GitHub リポジトリを接続して `main` ブランチをデプロイしてください。

デプロイ後にやること:

1. Firebase コンソール → Authentication → Settings → **承認済みドメイン** に
   `xxxx.vercel.app`（および独自ドメイン）を追加
2. 実機で Google ログイン → 参拝記録 → 御朱印 → PWA インストールを確認
3. `docs/VERIFICATION.md` のチェックリストを実施

---

## 5. ディレクトリ構成

```
.
├── public/
│   ├── icons/                  PWA アイコン（192 / 512 / maskable / apple-touch）
│   ├── images/                 神社画像（共通素材6種）
│   ├── sample/                 デモ用の御朱印画像
│   ├── manifest.webmanifest    PWA マニフェスト
│   ├── sw.js                   Service Worker（v1.1）
│   └── offline.html            オフラインページ
├── src/
│   ├── app/                    画面（App Router）
│   │   ├── login/              ログイン
│   │   ├── page.tsx            ホーム（最近の参拝 / お気に入り / 近くの神社）
│   │   ├── shrines/            神社一覧・詳細
│   │   ├── goshuin/            御朱印帳・新規登録
│   │   ├── mypage/             マイページ（達成率・実績・履歴）
│   │   ├── achievements/       参拝実績
│   │   ├── favorites/          お気に入り
│   │   └── profile/            プロフィール設定
│   ├── components/             UI コンポーネント
│   ├── data/shrines.json       神社マスタ（100社）
│   └── lib/
│       ├── app-context.tsx     認証・データ・実績の状態管理
│       ├── backend.ts          バックエンド選択（Firebase / デモ）
│       ├── backend-firebase.ts Firebase 実装（Auth / Firestore / Storage / 移行）
│       ├── backend-demo.ts     デモ実装（localStorage）
│       ├── achievements.ts     実績の純粋関数
│       ├── legacy.ts           v1.0 データの読み取り・移行フラグ
│       ├── geo.ts              300m 判定（ヘヴァサイン公式）
│       └── types.ts            ドメイン型
├── scripts/
│   ├── seed-shrines.mjs        神社マスタ投入
│   └── migrate-legacy.mjs      旧 visit_history の一括移行（管理者用）
├── docs/
│   ├── FIREBASE_SETUP.md       Firebase 設定手順書
│   ├── BUGFIXES.md             不具合修正内容一覧
│   ├── VERIFICATION.md         品質確認手順・結果
│   └── ROADMAP.md              今後の拡張提案（v1.2 / v1.3 / v2.0）
├── firestore.rules
├── storage.rules
└── firestore.indexes.json
```

---

## 6. データモデル

### users/{uid}

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `uid` | string | Firebase Auth の UID |
| `nickname` | string | 表示名（最大24文字） |
| `photo_url` | string \| null | Storage の画像URL / Google の photoURL |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |
| `achievements` | map | `{ 実績ID: 達成日時 }`（v1.3 のランキング集計用） |
| `migration` | map | 移行履歴（二重移行防止） |
| `schema_version` | number | 現在 `2` |

### visits/{visitId}

`user_id` / `shrine_id` / `visit_datetime` / `latitude` / `longitude` / `distance_m` / `created_at`
（`distance_m <= 300` をセキュリティルールでも強制）

### goshuin/{goshuinId}

`user_id` / `shrine_id` / `image_url` / `memo`（300文字）/ `created_at` / `visited_date`（YYYY-MM-DD）

### favorites/{uid_shrineId}

`user_id` / `shrine_id` / `created_at`（ドキュメントIDが `uid_shrineId` のため重複登録不可）

### shrines/{shrineId}

`name` / `prefecture` / `address` / `latitude` / `longitude` / `main_deity` / `description` /
`image_url` / `visit_count` / `phone` / `url`

> **神社マスタの拡充**: `src/data/shrines.json` の `phone` / `url` は初期状態では未設定です。
> `npm run seed` は `merge` 書き込みのため、Firestore 側で電話番号・公式URLを追記しても
> 再シードで上書きされません（アプリは同梱データ + Firestore の差分をマージして表示します）。

---

## 7. v1.0 からのデータ移行

初回 Google ログイン時に **自動** で実行されます（冪等・二重移行なし）。

| 移行元 | 移行先 | 内容 |
| --- | --- | --- |
| localStorage `kamitabicho:demo:v1` / `v2` | Firestore | 参拝履歴・御朱印・ニックネーム |
| Firestore `visit_history`（v1.0） | `visits` | 参拝履歴（コピーのみ／旧データは残す） |
| `goshuin.photo_url`（v1.0） | `goshuin.image_url` | フィールド名の補完 |

- 二重移行防止: `users/{uid}.migration.local_storage_at` と localStorage の
  `kamitabicho:migration:v1` の **二段構え**
- デモの写真（data URL）は移行時に Firebase Storage へアップロードして URL 化
- 既存ユーザーが多い場合は管理者用スクリプトも利用可能:
  `node scripts/migrate-legacy.mjs ./serviceAccountKey.json`

---

## 8. 主な機能

| 機能 | 画面 | 備考 |
| --- | --- | --- |
| Google ログイン / ログアウト / 自動ログイン維持 | `/login`, `/profile` | ポップアップ→失敗時リダイレクト |
| デモモード | `/login` | 端末内保存・ワンタップ開始 |
| 神社検索（名前・都道府県・ご祭神） | `/shrines` | 参拝済み・お気に入り絞り込み |
| 神社詳細（所在地/電話/URL/ご祭神/由緒/地図） | `/shrines/[id]` | Google Maps / OSM 両対応 |
| GPS 参拝記録（300m 判定） | `/shrines/[id]` | 朱印アニメーション |
| 御朱印帳（写真・授与日・メモ） | `/goshuin`, `/goshuin/new` | 拡大表示・削除 |
| マイページ（参拝回数・御朱印数・達成率） | `/mypage` | ドーナツグラフ |
| 参拝実績（初参拝 / 10社 / 50社 / 100社 ほか9種） | `/achievements` | 自動解放・保存 |
| お気に入り神社 | `/favorites` | ホームにも表示 |
| 最近参拝した神社 | `/` | 横スクロールカード |
| PWA（インストール / オフライン） | 全体 | `sw.js` + `offline.html` |

---

## 9. セキュリティ

- Firestore / Storage のルールは「本人のデータのみ読み書き」を原則とし、未定義パスは全拒否
- 位置情報の 300m 判定はルール側でも `distance_m <= 300` を強制
- 画像は 8MB 以下・`image/*` のみ許可（Storage ルール）
- オープンリダイレクト対策（`next` パラメータは同一オリジンのパスのみ許可）
- 本番運用では **App Check（reCAPTCHA Enterprise）** の導入を推奨（未導入）

---

## 10. 既知の制約（ベータ版）

- 神社マスタの `phone` / `url` は未入力（誤情報を避けるため。管理画面または Firestore で追記）
- 参拝数の集計（`shrines.visit_count`）はクライアント加算のベストエフォート。
  厳密な集計は v1.3 で Cloud Functions に移行予定
- 管理者画面・通報機能は未実装
- 位置情報の精度が低い端末では 300m 判定が不安定になることがある（許容範囲の表示あり）

---

## 11. ドキュメント

- [Firebase 設定手順書](docs/FIREBASE_SETUP.md)
- [不具合修正内容一覧](docs/BUGFIXES.md)
- [品質確認（テスト結果）](docs/VERIFICATION.md)
- [今後の拡張提案](docs/ROADMAP.md)

## ライセンス

MIT（`LICENSE`）
