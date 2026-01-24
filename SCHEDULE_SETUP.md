# プッシュ通知の定期実行設定

`pg_cron` が利用できない場合（無料プランなど）、GitHub Actionsを使用して定期実行を設定します。

## セットアップ手順

### 1. GitHub Secretsの設定

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」を開く
2. 「New repository secret」をクリック
3. 以下の2つのシークレットを追加：

   **SUPABASE_URL**
   ```
   https://YOUR_PROJECT_REF.supabase.co
   ```
   （例: `https://wjxqdxkgwxjyflqknmup.supabase.co`）

   **SUPABASE_ANON_KEY**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   （`.env.local` の `EXPO_PUBLIC_SUPABASE_ANON_KEY` の値）

### 2. ワークフローファイルの確認

`.github/workflows/send-daily-reminder.yml` が既に作成されています。

### 3. 実行スケジュールの調整（オプション）

デフォルトでは毎時0分（UTC）に実行されます。

**日本時間の19:00に送信したい場合：**
- 日本時間19:00 = UTC 10:00（JST = UTC+9）
- `.github/workflows/send-daily-reminder.yml` を編集：

```yaml
on:
  schedule:
    - cron: '0 10 * * *'  # 毎日UTC 10:00（日本時間19:00）
```

**毎時実行（推奨）：**
```yaml
on:
  schedule:
    - cron: '0 * * * *'  # 毎時0分（UTC）
```

### 4. 動作確認

1. GitHubリポジトリの「Actions」タブを開く
2. 「Send Daily Reminder」ワークフローを選択
3. 「Run workflow」ボタンで手動実行してテスト

### 5. 動作の仕組み

1. GitHub Actionsが毎時0分（UTC）にワークフローを実行
2. Edge Function `send-daily-reminder` を呼び出し
3. Edge Functionが以下を実行：
   - 現在時刻を取得（例：19:00）
   - `notification_time = "19:00"` のユーザーを検索
   - 今日まだ学習していないユーザーに通知を送信

## タイムゾーンの注意

- GitHub Actionsのcronは **UTC時間** で動作します
- 日本時間（JST）は UTC+9 です
- 例：日本時間19:00に送信したい場合 → UTC 10:00に設定

## 手動実行（テスト用）

GitHub Actionsの「Actions」タブから手動実行するか、以下のコマンドで直接テスト：

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminder' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## トラブルシューティング

### 通知が届かない

1. **通知設定の確認**
   - アプリの設定画面で `notification_enabled = true` か確認
   - `notification_time` が正しく設定されているか確認

2. **プッシュトークンの確認**
   - Supabaseの `profiles` テーブルで `push_token` が保存されているか確認

3. **今日の学習状況**
   - 通知は「今日まだ学習していない」ユーザーにのみ送信されます
   - `daily_progress.questions_answered = 0` の場合のみ通知

4. **GitHub Actionsのログ確認**
   - 「Actions」タブで実行ログを確認
   - エラーがないか確認

### GitHub Actionsが実行されない

1. **リポジトリの設定確認**
   - 「Settings」→「Actions」→「General」で「Workflow permissions」が「Read and write permissions」になっているか確認

2. **Secretsの確認**
   - `SUPABASE_URL` と `SUPABASE_ANON_KEY` が正しく設定されているか確認

3. **ワークフローファイルの確認**
   - `.github/workflows/send-daily-reminder.yml` が正しくコミットされているか確認
