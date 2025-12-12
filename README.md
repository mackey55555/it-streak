# 🎓 IT資格学習アプリ

基本情報技術者試験対策のための、ゲーミフィケーション要素を取り入れた学習アプリです。

## ✨ 特徴

- 🔥 **ストリーク機能** - 連続学習日数を記録してモチベーション維持
- 📊 **学習進捗管理** - 日々の学習状況を可視化
- 🎯 **デイリーゴール** - 1日の目標問題数を設定
- 📝 **4択クイズ** - 過去問ベースの問題で実力アップ
- 🔔 **プッシュ通知** - 学習リマインダー（実装予定）
- 📱 **iOS/Android対応** - React Native (Expo) で構築

## 🛠 技術スタック

- **フロントエンド**: React Native, Expo, TypeScript
- **ルーティング**: Expo Router
- **バックエンド**: Supabase (認証、データベース)
- **デザイン**: 親しみやすいカスタムデザインシステム

## 📦 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd quizapp
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. Supabaseプロジェクトのセットアップ

詳細は [DATABASE_SETUP.md](./DATABASE_SETUP.md) を参照してください。

1. Supabaseプロジェクトを作成
2. `supabase/schema.sql` を実行
3. `.env.local` に環境変数を設定

### 4. 問題データの投入

詳細は [SEED_QUESTIONS.md](./SEED_QUESTIONS.md) を参照してください。

```bash
cd scripts
npm install
npm run seed
```

### 5. アプリの起動

```bash
npm start
```

Expo Goアプリでスキャンするか、シミュレータで起動してください。

## 📁 プロジェクト構造

```
quizapp/
├── app/                    # Expo Routerの画面
│   ├── (auth)/            # 認証関連画面
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── index.tsx      # ホーム画面
│   │   ├── stats.tsx      # 統計画面
│   │   └── settings.tsx   # 設定画面
│   ├── quiz/              # クイズ関連画面
│   │   ├── index.tsx      # クイズ画面
│   │   └── result.tsx     # 結果画面
│   └── _layout.tsx        # ルートレイアウト
├── components/            # 再利用可能なコンポーネント
│   └── ui/               # UIコンポーネント
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ProgressBar.tsx
│       └── Text.tsx
├── constants/            # 定数・テーマ
│   └── theme.ts
├── hooks/                # カスタムフック
│   ├── useAuth.ts        # 認証
│   ├── useQuiz.ts        # クイズロジック
│   ├── useStreak.ts      # ストリーク管理
│   └── useDailyProgress.ts # 日次進捗
├── lib/                  # ライブラリ設定
│   └── supabase.ts       # Supabaseクライアント
├── types/                # TypeScript型定義
│   └── database.ts       # データベース型
├── scripts/              # ユーティリティスクリプト
│   └── seed-questions.ts # 問題データ投入
└── supabase/            # Supabaseスキーマ
    └── schema.sql       # データベーススキーマ
```

## 🎨 デザインシステム

明るく親しみやすいデザインを採用：

- **プライマリカラー**: `#58CC02` (メイングリーン)
- **セカンダリカラー**: `#FFC800` (ゴールド)
- **ストリークカラー**: `#FF9600` (オレンジ)
- **正解**: `#58CC02` (緑)
- **不正解**: `#FF4B4B` (赤)

詳細は `constants/theme.ts` を参照してください。

## 📝 使い方

1. **アカウント作成** - メールアドレスとパスワードで登録
2. **ログイン** - 登録したアカウントでログイン
3. **学習開始** - ホーム画面の「今日の学習をはじめる」をタップ
4. **問題に回答** - 4択から正解を選んで回答
5. **ストリーク継続** - 毎日学習してストリークを伸ばそう！

## 🚀 今後の実装予定

- [ ] 統計画面の実装
- [ ] 設定画面の実装
- [ ] 結果画面の強化（紙吹雪アニメーション等）
- [ ] 分野別学習機能
- [ ] 苦手問題の復習機能
- [ ] プッシュ通知機能
- [ ] ダークモード対応
- [ ] 学習履歴のグラフ化
- [ ] ソーシャル機能（ランキング等）

## 🐛 トラブルシューティング

### アプリが起動しない
- `npm install` を実行して依存パッケージを再インストール
- Expoのキャッシュをクリア: `npx expo start -c`

### 認証エラー
- `.env.local` の設定を確認
- Supabaseダッシュボードでプロジェクトが有効か確認

### 問題が表示されない
- 問題データが投入されているか確認
- `SEED_QUESTIONS.md` の手順を確認

## 📄 ライセンス

MIT License

## 👨‍💻 開発者

開発に関する質問や提案は、Issuesまでお願いします。

---

Happy Learning! 🎓✨

