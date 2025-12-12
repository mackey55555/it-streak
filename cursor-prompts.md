# Cursor開発プロンプト集 - Duolingo式資格学習アプリ

## 使い方
1. 各ステップのプロンプトをCursorにコピペして実行
2. 動作確認を行う
3. OKなら次のステップへ
4. 問題があればCursorに修正を依頼

---

## Step 1: プロジェクト初期化

### 1-1. Expoプロジェクト作成

**ターミナルで実行（Cursorではなく）：**
```bash
npx create-expo-app@latest quizapp --template blank-typescript
cd quizapp
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

### 1-2. 動作確認
```bash
npx expo start
```
- Expo Goアプリでスキャン
- 「Open up App.tsx to start working on your app!」が表示されればOK

---

## Step 2: Expo Router セットアップ

### 2-1. プロンプト

```
このExpo + TypeScriptプロジェクトにExpo Routerをセットアップしてください。

要件：
- app/ ディレクトリベースのファイルルーティング
- 以下の画面構成を作成：
  - (auth)/login.tsx - ログイン画面
  - (auth)/signup.tsx - サインアップ画面
  - (tabs)/_layout.tsx - タブナビゲーション
  - (tabs)/index.tsx - ホーム画面
  - (tabs)/stats.tsx - 統計画面
  - (tabs)/settings.tsx - 設定画面
  - quiz/index.tsx - クイズ画面
  - quiz/result.tsx - 結果画面
- 各画面には画面名を表示するだけのプレースホルダーを配置
- _layout.tsx でナビゲーション構造を定義

package.jsonのmainを"expo-router/entry"に変更することも忘れずに。
```

### 2-2. 動作確認
- アプリを再起動
- タブナビゲーションが表示される
- 各タブをタップして画面遷移できる

---

## Step 3: デザインシステム・テーマ設定

### 3-1. プロンプト

```
Duolingoライクなデザインシステムを作成してください。

要件：
1. constants/theme.ts を作成し、以下を定義：
   - カラーパレット（Duolingo風の明るい緑をメイン）
     - primary: #58CC02（Duolingo緑）
     - secondary: #FFC800（ゴールド/XP）
     - background: #FFFFFF
     - surface: #F7F7F7
     - text: #4B4B4B
     - textLight: #AFAFAF
     - correct: #58CC02
     - incorrect: #FF4B4B
     - streak: #FF9600
   - フォントサイズ（14, 16, 18, 24, 32）
   - スペーシング（4, 8, 12, 16, 24, 32）
   - 角丸（8, 12, 16）

2. components/ui/ に基本コンポーネントを作成：
   - Button.tsx（プライマリ、セカンダリ、ゴースト）
   - Card.tsx（影付きカード）
   - ProgressBar.tsx（進捗バー）
   - Text.tsx（見出し、本文、キャプション）

各コンポーネントはTypeScriptで型定義し、Duolingoのような丸みのある親しみやすいデザインにしてください。
ボタンは押したときに少し沈む（scale down）アニメーションを付けてください。
```

### 3-2. 動作確認
- ホーム画面でコンポーネントをimportして表示テスト
- ボタンを押してアニメーション確認

---

## Step 4: ホーム画面UI実装

### 4-1. プロンプト

```
ホーム画面（app/(tabs)/index.tsx）をDuolingo風に実装してください。

画面構成：
1. 上部：ストリーク表示
   - 🔥アイコン + 「12日連続！」のようなテキスト
   - 背景にグラデーションまたは目立つカード

2. 中央：今日の進捗カード
   - 「今日の進捗」タイトル
   - 「3 / 5 問」のような表示
   - ProgressBarで視覚的に表示
   - 円形のプログレスでもOK

3. メイン：学習開始ボタン
   - 大きな緑のボタン
   - 「今日の学習をはじめる」テキスト
   - 押すと /quiz に遷移

4. 下部：サブメニュー（リスト形式）
   - 「分野別に学習」→ 矢印アイコン
   - 「苦手な問題を復習」→ 矢印アイコン
   - タップ可能なリストアイテム

今はモックデータ（ハードコード）でOKです。
SafeAreaViewを使用してノッチ対応してください。
Step 3で作成したデザインシステムを使用してください。
```

### 4-2. 動作確認
- ホーム画面が表示される
- ストリーク、進捗が見える
- 「今日の学習をはじめる」ボタンが目立つ
- ボタンを押すとquiz画面に遷移する

---

## Step 5: クイズ画面UI実装

### 5-1. プロンプト

```
クイズ画面（app/quiz/index.tsx）をDuolingo風に実装してください。

画面構成：
1. 上部：進捗バー
   - 細いバーで「5問中3問目」を表示
   - ✕ボタン（左上）でホームに戻る

2. 中央：問題カード
   - 問題文を表示するカード
   - スクロール可能（長文対応）

3. 下部：4択の選択肢
   - A, B, C, D の4つのボタン
   - 縦に並べる
   - 選択すると色が変わる（選択中状態）

4. 最下部：回答ボタン
   - 「回答する」ボタン
   - 選択肢を選ぶまでdisabled

回答後の正誤表示（別の状態）：
- 正解：緑の背景 + ✓ + 「正解！」
- 不正解：赤の背景 + ✕ + 「不正解」+ 正解の表示
- 解説を表示
- 「次へ」ボタン

モックデータで以下の問題を入れてください：
{
  question: "OSI基本参照モデルにおいて、ネットワーク層の役割はどれか。",
  choices: [
    "A: 伝送路上のビット列の伝送",
    "B: 隣接ノード間のデータ転送",
    "C: エンドツーエンドのデータ転送の信頼性確保",
    "D: ネットワーク上の経路選択"
  ],
  correctAnswer: "D",
  explanation: "ネットワーク層（第3層）は、異なるネットワーク間の経路選択（ルーティング）を行う層です。"
}

useStateで選択状態、回答済み状態を管理してください。
```

### 5-2. 動作確認
- 問題文が表示される
- 選択肢をタップすると選択状態になる
- 「回答する」を押すと正誤が表示される
- 解説が表示される

---

## Step 6: Supabaseセットアップ

### 6-1. Supabaseプロジェクト作成（Webで手動）

1. https://supabase.com にアクセス
2. 新規プロジェクト作成
3. Project URL と anon key をメモ

### 6-2. プロンプト

```
Supabaseクライアントをセットアップしてください。

要件：
1. Supabase関連パッケージのインストールコマンドを教えてください

2. lib/supabase.ts を作成：
   - Supabaseクライアントの初期化
   - 環境変数から URL と ANON_KEY を読み込む
   - AsyncStorageを使った認証の永続化

3. .env.local ファイルのテンプレート作成：
   - EXPO_PUBLIC_SUPABASE_URL=
   - EXPO_PUBLIC_SUPABASE_ANON_KEY=

4. app.config.ts で環境変数を読み込む設定

TypeScriptの型定義も含めてください。
```

### 6-3. 動作確認
- `.env.local` に実際の値を設定
- アプリがエラーなく起動する
- console.logでSupabase接続を確認

---

## Step 7: 認証機能実装

### 7-1. プロンプト

```
Supabase Authを使ったログイン/サインアップ機能を実装してください。

要件：
1. hooks/useAuth.ts を作成：
   - signUp(email, password)
   - signIn(email, password)
   - signOut()
   - session（現在のセッション）
   - user（現在のユーザー）
   - loading（読み込み中状態）

2. app/(auth)/login.tsx を実装：
   - メールアドレス入力欄
   - パスワード入力欄
   - ログインボタン
   - 「アカウントを作成」リンク → signup画面へ
   - エラーメッセージ表示
   - Duolingo風のデザイン

3. app/(auth)/signup.tsx を実装：
   - メールアドレス入力欄
   - パスワード入力欄（確認用も）
   - サインアップボタン
   - 「ログイン」リンク → login画面へ

4. app/_layout.tsx を修正：
   - 認証状態をチェック
   - 未認証：(auth)グループを表示
   - 認証済：(tabs)グループを表示

TextInputはDuolingo風に角丸で、フォーカス時にボーダー色が変わるようにしてください。
```

### 7-2. 動作確認
- サインアップでアカウント作成できる
- Supabaseダッシュボードでユーザーが追加されている
- ログインするとホーム画面に遷移する
- アプリを再起動してもログイン状態が維持される

---

## Step 8: データベーステーブル作成

### 8-1. Supabase SQLエディタで実行

```sql
-- 仕様書のSQLをSupabaseのSQLエディタで実行
-- profiles, exams, categories, questions, user_answers, streaks, daily_progress

-- RLS（Row Level Security）ポリシーも設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own answers" ON user_answers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streak" ON streaks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON daily_progress
  FOR ALL USING (auth.uid() = user_id);

-- questionsは全員が読み取り可能
CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (true);
```

### 8-2. プロンプト

```
Supabaseのデータベース型定義を生成してください。

要件：
1. types/database.ts を作成
2. 以下のテーブルの型を定義：
   - profiles
   - exams
   - categories
   - questions
   - user_answers
   - streaks
   - daily_progress

3. Supabaseクライアントに型を適用

以下のスキーマに基づいて型を作成してください：
[仕様書のCREATE TABLE文を貼り付け]
```

### 8-3. 動作確認
- TypeScriptエラーが出ない
- Supabaseダッシュボードでテーブルが作成されている

---

## Step 9: クイズロジック実装

### 9-1. プロンプト

```
クイズ機能のビジネスロジックを実装してください。

要件：
1. hooks/useQuiz.ts を作成：
   - fetchQuestions(count: number) - ランダムに問題を取得
   - submitAnswer(questionId, answer) - 回答を保存
   - currentQuestion - 現在の問題
   - questionIndex - 何問目か
   - totalQuestions - 全問題数
   - nextQuestion() - 次の問題へ
   - isFinished - 全問回答したか
   - results - 回答結果の配列

2. hooks/useStreak.ts を作成：
   - currentStreak - 現在のストリーク
   - longestStreak - 最長ストリーク
   - updateStreak() - 今日の学習を記録
   - checkTodayCompleted() - 今日のゴール達成確認

3. hooks/useDailyProgress.ts を作成：
   - todayProgress - 今日の進捗 {answered: number, correct: number}
   - dailyGoal - 1日の目標（デフォルト5問）
   - isGoalCompleted - 目標達成したか
   - recordProgress(isCorrect) - 進捗を記録

Supabaseとの連携を含めてください。
エラーハンドリングも実装してください。
```

### 9-2. 動作確認
- 問題がSupabaseから取得できる（まだ問題データがない場合はスキップ）
- 回答がuser_answersテーブルに保存される
- ストリークが更新される

---

## Step 10: 問題データ投入

### 10-1. プロンプト

```
基本情報技術者試験の過去問サンプルデータを作成してください。

要件：
1. scripts/seed-questions.ts を作成
2. 以下のダミーデータを10問作成：
   - テクノロジ系から5問
   - マネジメント系から3問
   - ストラテジ系から2問
3. 実際の過去問風の問題文と選択肢
4. 解説も含める
5. Supabaseに投入するスクリプト

実行方法も教えてください。

※本番では実際の過去問を使いますが、まずはテスト用にダミーデータで動作確認します。
```

### 10-2. 動作確認
- スクリプトを実行して問題が投入される
- アプリでクイズを開始すると問題が表示される

---

## Step 11: 結果画面・統計画面実装

### 11-1. プロンプト

```
結果画面と統計画面を実装してください。

1. app/quiz/result.tsx（クイズ終了後の結果画面）：
   - スコア表示（例：5問中4問正解！）
   - 正答率のサークルグラフまたは大きな数字
   - 獲得XP（正解数 × 10）
   - ストリーク継続のお祝いメッセージ（該当時）
   - 「ホームに戻る」ボタン
   - 「もう一度チャレンジ」ボタン
   - Duolingo風のお祝い演出（紙吹雪など、可能であれば）

2. app/(tabs)/stats.tsx（統計画面）：
   - 総学習問題数
   - 総正答率
   - 現在のストリーク / 最長ストリーク
   - 分野別の正答率（棒グラフまたはリスト）
   - 今週の学習日数（カレンダー風の表示）

hooks/useStats.ts を作成して、統計データを取得するロジックを実装してください。
react-native-chart-kit または react-native-svg-charts を使用してもOKです。
```

### 11-2. 動作確認
- クイズ終了後に結果画面に遷移する
- スコアが正しく表示される
- 統計画面に過去の成績が表示される

---

## Step 12: Push通知実装

### 12-1. プロンプト

```
Expo Push Notificationsを実装してください。

要件：
1. 必要なパッケージのインストールコマンド

2. hooks/usePushNotifications.ts を作成：
   - registerForPushNotifications() - 通知許可を取得し、トークンを保存
   - ExpoPushTokenをSupabaseのprofilesテーブルに保存

3. app/(tabs)/settings.tsx を実装：
   - 通知ON/OFFトグル
   - 通知時刻の設定（TimePicker）
   - デイリーゴール設定（5問、10問、15問から選択）
   - ログアウトボタン

4. アプリ起動時に通知許可を確認するロジック

※ Push通知の送信側（Supabase Edge Functions）は次のステップで実装します。
```

### 12-2. 動作確認
- アプリ起動時に通知許可ダイアログが表示される
- 許可するとpush tokenがSupabaseに保存される
- 設定画面で通知時刻を変更できる

---

## Step 13: Push通知送信（Supabase Edge Functions）

### 13-1. Supabase Edge Functions作成

```
Supabase Edge Functionsで毎日のPush通知を送信する機能を作成してください。

要件：
1. supabase/functions/send-daily-reminder/index.ts
   - 設定時刻になったユーザーを取得
   - 今日まだ学習していないユーザーをフィルタ
   - Expo Push APIに通知を送信
   - 通知文言はストリークに応じて変える

2. 通知文言の例：
   - ストリーク継続中：「🔥 {streak}日連続達成中！今日も続けよう」
   - 未学習：「📚 今日の学習、まだ終わってないよ」

3. デプロイ方法と、pg_cronでの定期実行設定方法

Expo Push APIのエンドポイント：
https://exp.host/--/api/v2/push/send
```

### 13-2. 動作確認
- Edge Functionを手動で実行
- 通知が届く

---

## Step 14: 最終調整・ポリッシュ

### 14-1. プロンプト

```
アプリ全体の最終調整をしてください。

要件：
1. ローディング状態の追加
   - データ取得中はスケルトンまたはスピナー表示
   - ボタン押下中はローディング表示

2. エラーハンドリングの改善
   - ネットワークエラー時のリトライUI
   - エラーメッセージのトースト表示

3. アニメーションの追加
   - 画面遷移時のトランジション
   - 正解時のお祝いアニメーション
   - ストリーク更新時の演出

4. アクセシビリティ
   - 適切なaccessibilityLabel
   - 十分なタップ領域（44px以上）

5. アプリアイコン・スプラッシュスクリーン
   - assets/にアイコンとスプラッシュを配置
   - app.jsonで設定

react-native-reanimated を使用してアニメーションを実装してください。
```

---

## Step 15: ストアビルド・申請

### 15-1. プロンプト

```
EAS Buildを使ったストア申請の準備をしてください。

要件：
1. eas.jsonの設定
2. app.jsonの本番設定（バージョン、バンドルIDなど）
3. iOS: Apple Developer設定
4. Android: Google Play Console設定
5. ビルドコマンドとsubmitコマンド

プライバシーポリシーと利用規約のURLも必要になるので、
必要な項目を教えてください。
```

---

## トラブルシューティング用プロンプト

### エラーが出た時

```
以下のエラーが発生しています。原因と解決方法を教えてください。

エラーメッセージ：
[エラーメッセージを貼り付け]

関連するコード：
[該当コードを貼り付け]

試したこと：
- 
```

### デザインを調整したい時

```
[スクリーンショットまたは画面名] のデザインを調整してください。

現状の問題：
- [具体的な問題]

参考にしたいデザイン：
- [Duolingoのスクショや説明]

具体的に変えたい点：
- 
```

---

## Tips

1. **一度に大きな変更をしない** - 小さく作って確認を繰り返す
2. **エラーはすぐ対処** - 放置すると雪だるま式に増える
3. **Gitでこまめにコミット** - 動いた状態を保存する
4. **実機で確認** - シミュレータと実機で挙動が違うことがある
