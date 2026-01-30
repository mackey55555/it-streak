# 毎日の学習リマインダー送信機能

この Edge Function は、スロット（時間帯）ごとにユーザーへ Push 通知を送信します。設計は `PUSH_NOTIFICATION_DESIGN.md` を参照。

## 機能

- **スロット**: morning / lunch / evening / night / final / deadline / recovery
- 今日まだ学習していないユーザーに送信（recovery はストリーク切れ翌日に限定）
- 23:50（deadline）は 23:15（final）送信済みユーザーのみ
- 過去3日間の送信履歴でメッセージ重複を排除し、ストリークに応じてメッセージを選択

## デプロイ方法

```bash
supabase functions deploy send-daily-reminder
```

## 定期実行（GitHub Actions）

`.github/workflows/send-daily-reminder.yml` で以下が設定されています。

- **cron**: 7:00 / 12:00 / 19:00 / 21:30 / 23:15 / 23:50 JST に対応する UTC で実行
- **7:00**: 先に `slot=recovery`、続けて `slot=morning` を呼び出し

### GitHub Secrets

- `SUPABASE_URL`: `https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_ANON_KEY`: Supabase の Anon Key

## 手動テスト

### 1. GitHub Actions から実行

1. リポジトリの **Actions** タブを開く
2. **Send Daily Reminder** ワークフローを選択
3. **Run workflow** をクリック
4. **Slot** で `morning` / `lunch` / `evening` / `night` / `final` / `deadline` / `recovery` のいずれかを選択
5. **Run workflow** で実行
6. 実行ログで **Call Supabase Edge Function** のステップを開き、`response (200):` と JSON を確認

### 2. curl で直接呼び出し

```bash
# 例: evening スロット
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminder' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"slot":"evening"}'
```

### 3. 送信ログの確認

Supabase Dashboard → **Table Editor** → `push_notification_log` で以下を確認できます。

- `date`: 送信日（JST の日付）
- `slot`: スロット名
- `message_id`: 送ったメッセージ ID（M01, E02 など）

対象ユーザーがいない場合は `count: 0` や `All users have already completed today` のようなレスポンスになります。テスト用に「今日まだ学習していない」ユーザーと `notification_enabled = true`・`push_token` が設定されている必要があります。
