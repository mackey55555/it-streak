# 🎓 IT Streak（IT資格学習アプリ）

基本情報技術者試験などのIT資格対策のための、**ストリーク（継続）×クイズ**の学習アプリです。  
「すとりー」キャラクターと、やさしいUIで、毎日の学習を無理なく続けられる設計を目指しています。

## ✨ 特徴（実装済み）

- 🔥 **ストリーク機能**: 連続学習日数を記録
- 🎯 **デイリーゴール**: 1日の目標問題数を設定（設定画面で変更）
- 📝 **4択クイズ**: 通常学習（ランダム）に加え、以下の学習モードに対応
  - **分野別に学習**（カテゴリ選択）
  - **苦手な問題を復習**（過去の不正解から出題）
  - **ランダムチャレンジ**
- 📊 **学習統計**: ストリーク・総回答数・正答率・分野別正答率・過去30日推移（グラフ/カレンダー）
- 🏫 **試験の切り替え**: 設定画面で「学習する試験」を選択（試験ごとにカテゴリ/問題を切替）
- 🔔 **学習リマインダー通知**:
  - アプリ側: 通知ON/OFF、Push Token登録（端末/環境の制約あり）
  - サーバー側: Supabase Edge Function + GitHub Actions（cron）でスロット配信
- 📱 **iOS/Android対応**: React Native（Expo）で構築

## 🛠 技術スタック

- **フロントエンド**: React Native / Expo / TypeScript
- **ルーティング**: Expo Router
- **バックエンド**: Supabase（Auth / Database / Edge Functions）
- **通知**: expo-notifications + Edge Function（送信）+ GitHub Actions（定期実行）
- **UI**: カスタムデザインシステム（`constants/theme.ts`）

## 📦 セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数

`.env.local` に以下を設定します（例）。

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_PROJECT_ID`（Push通知のToken取得に必要）

### 3. Supabaseセットアップ（DB / マイグレーション）

詳細は [DATABASE_SETUP.md](./DATABASE_SETUP.md) を参照してください。

### 4. 問題データの投入

詳細は [SEED_QUESTIONS.md](./SEED_QUESTIONS.md) を参照してください。

```bash
npm run seed
```

### 5. アプリ起動

```bash
npm start
```

## 🔔 Push通知について（注意）

- **実機が必要**です（エミュレータ/シミュレータでは動きません）
- **AndroidのExpo GoではPush通知は利用できません**（開発ビルドを使用してください）
- 送信側は `supabase/functions/send-daily-reminder/` と `.github/workflows/send-daily-reminder.yml` を参照してください  
  - 通知文言の設計: [PUSH_NOTIFICATION_DESIGN.md](./PUSH_NOTIFICATION_DESIGN.md)

## 📁 プロジェクト構造（抜粋）

```
quizapp/
├── app/                        # Expo Routerの画面
│   ├── (auth)/                 # 認証関連
│   ├── (tabs)/                 # ホーム/統計/設定
│   ├── quiz/                   # クイズ/分野選択/結果
│   ├── SplashCharacterScreen.tsx
│   └── _layout.tsx
├── components/
│   └── ui/                     # Button/Card/Text/Chartなど
├── constants/
│   └── theme.ts                # カラー/余白/角丸/影
├── hooks/                      # useAuth/useQuiz/useStreak/useDailyProgress/usePushNotifications
├── lib/                        # Supabase/Hapticsなど
├── scripts/                    # seed/問題マージなど
└── supabase/
    ├── migrations/             # DBマイグレーション
    └── functions/send-daily-reminder/  # Edge Function（通知送信）
```

## 🎨 デザイン（カラーコード）

実装の正は `constants/theme.ts` です（READMEの色はここに合わせています）。

- **primary**: `#7A8A70`
- **secondary**: `#B5854F`
- **background**: `#FEFCF9`
- **surface**: `#F5F3F0`
- **text**: `#3A3A3A`
- **textLight**: `#6A6A6A`
- **correct**: `#7A8A70`
- **incorrect**: `#B58585`
- **streak**: `#B5854F`
- **disabled / border**: `#C8C6C3`

## 📝 使い方

1. **アカウント作成 / ログイン**
2. **設定**で「学習する試験」「1日の目標問題数」「通知」を設定
3. ホームから学習を開始（通常/分野別/復習/ランダム）
4. 毎日続けてストリークを伸ばす

## 🚀 今後の改善アイデア

- [ ] ダークモード対応
- [ ] 結果画面・演出の強化（より分かりやすい振り返り、モチベ向上）
- [ ] 苦手分析の強化（復習優先度、弱点カテゴリの提案）

## 🐛 トラブルシューティング

### アプリが起動しない

- `npm install` を再実行
- Expoのキャッシュクリア: `npx expo start -c`

### 認証/データ取得でエラーになる

- `.env.local` の設定を確認
- Supabaseのプロジェクト/マイグレーション/シードが完了しているか確認

### 問題が表示されない

- 問題データ投入（seed）が完了しているか確認
- 設定画面で「試験」が選択されているか確認

## 📄 ライセンス

MIT License

