# データベースセットアップ手順

## 1. Supabaseプロジェクト作成

1. https://supabase.com にアクセス
2. 「New Project」をクリック
3. プロジェクト名を入力（例: quizapp）
4. データベースパスワードを設定（強力なものを推奨）
5. リージョンを選択（Japan推奨）
6. 「Create new project」をクリック

## 2. データベースURLとキーの取得

1. プロジェクトダッシュボードで「Settings」→「API」を開く
2. 以下の値をコピー：
   - **Project URL**（例: `https://xxxxx.supabase.co`）
   - **anon public key**（例: `eyJhbGc...`）

## 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下を記入：

```
EXPO_PUBLIC_SUPABASE_URL=あなたのProject URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=あなたのanon public key
```

## 4. SQLスキーマの実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 「New query」をクリック
3. `supabase/schema.sql` ファイルの内容を全てコピー＆ペースト
4. 「Run」をクリックして実行

## 5. 確認

SQLエディタで以下を実行して、テーブルが作成されたか確認：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

以下のテーブルが表示されればOK：
- profiles
- exams
- categories
- questions
- user_answers
- streaks
- daily_progress

## 6. 認証設定（オプション）

より良いUXのために、メール確認をオフにすることもできます：

1. 「Authentication」→「Providers」→「Email」
2. 「Confirm email」をオフ（開発中のみ推奨）
3. 本番環境では必ずオンにしてください

## トラブルシューティング

### エラー: "relation does not exist"
- SQLスクリプトが正しく実行されていない可能性があります
- SQLエディタでもう一度実行してください

### エラー: "permission denied"
- RLSポリシーが正しく設定されていない可能性があります
- `schema.sql` の最後の方のポリシー部分を確認してください

### 認証エラー
- `.env.local` の値が正しいか確認
- URLの末尾にスラッシュ `/` がないか確認
- アプリを再起動してください

