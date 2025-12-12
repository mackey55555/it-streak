# データベースセットアップ手順

このプロジェクトでは Supabase CLI を使用してデータベースを管理しています。

## 前提条件

- Supabase CLIがインストール済み
- Supabaseプロジェクトが作成済み

## 初回セットアップ

### 1. Supabaseにログイン

```bash
supabase login
```

### 2. プロジェクトをリンク

```bash
cd quizapp
supabase link --project-ref <your-project-ref>
```

プロジェクトrefは、Supabaseダッシュボードの「Settings」→「General」→「Reference ID」で確認できます。

### 3. マイグレーションを適用

```bash
supabase db push
```

これで以下のテーブルが作成されます：
- `profiles` - ユーザープロフィール
- `exams` - 試験カテゴリ
- `categories` - 分野カテゴリ  
- `questions` - 問題
- `user_answers` - 回答履歴
- `streaks` - ストリーク管理
- `daily_progress` - 日次進捗

### 4. 環境変数の設定

`.env.local` ファイルを作成：

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## マイグレーション管理

### 新しいマイグレーションを作成

```bash
supabase migration new <migration_name>
```

### マイグレーションを適用

```bash
supabase db push
```

### マイグレーション状況を確認

```bash
supabase migration list
```

### リモートDBの差分を確認

```bash
supabase db diff
```

## ローカル開発（オプション）

ローカルでSupabaseを起動することもできます：

```bash
# ローカルSupabaseを起動
supabase start

# ローカルDBにマイグレーションを適用
supabase db reset

# ローカルSupabaseを停止
supabase stop
```

## 認証設定（開発用）

開発中はメール確認をオフにすると便利です：

1. Supabaseダッシュボードで「Authentication」→「Providers」→「Email」
2. 「Confirm email」をオフ
3. 「Save」をクリック

⚠️ 本番環境では必ずオンにしてください。

## トラブルシューティング

### エラー: "relation does not exist"

マイグレーションが適用されていない可能性があります：

```bash
supabase db push
```

### エラー: "permission denied"

RLSポリシーの問題です。マイグレーションファイルを確認してください。

### 認証エラー

- `.env.local` の値が正しいか確認
- URLの末尾にスラッシュ `/` がないか確認
- アプリを再起動
