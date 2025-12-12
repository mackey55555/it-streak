# 毎日の学習リマインダー送信機能

このEdge Functionは、設定された時刻にユーザーにPush通知を送信します。

## 機能

- 通知時刻が現在時刻と一致するユーザーを取得
- 今日まだ学習していないユーザーに通知を送信
- ストリーク情報に基づいてメッセージをカスタマイズ

## デプロイ方法

```bash
# Supabase CLIでデプロイ
supabase functions deploy send-daily-reminder
```

## 定期実行の設定

SupabaseダッシュボードのSQLエディタで以下を実行：

```sql
-- pg_cron拡張を有効化（初回のみ）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 毎分実行（実際の運用では毎時実行に変更推奨）
SELECT cron.schedule(
  'send-daily-reminder',
  '* * * * *', -- 毎分（テスト用）
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminder',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- スケジュールを確認
SELECT * FROM cron.job;

-- スケジュールを削除（必要に応じて）
-- SELECT cron.unschedule('send-daily-reminder');
```

**注意**: 本番環境では毎分実行ではなく、毎時実行（`0 * * * *`）に変更してください。

## 手動実行（テスト用）

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminder' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

