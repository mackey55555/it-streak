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

### 方法1: GitHub Actions（推奨・無料）

`pg_cron` が利用できない場合（無料プランなど）、GitHub Actionsを使用できます。

#### 1. GitHub Secretsの設定

リポジトリの「Settings」→「Secrets and variables」→「Actions」で以下を追加：

- `SUPABASE_URL`: `https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_ANON_KEY`: SupabaseのAnon Key

#### 2. ワークフローファイル

`.github/workflows/send-daily-reminder.yml` が既に作成されています。

#### 3. 実行スケジュールの調整

日本時間の19:00に送信したい場合（UTC 10:00）：
```yaml
- cron: '0 10 * * *'  # 毎日UTC 10:00（日本時間19:00）
```

毎時実行する場合：
```yaml
- cron: '0 * * * *'  # 毎時0分
```

#### 4. 手動実行

GitHubリポジトリの「Actions」タブから手動実行も可能です。

### 方法2: pg_cron（有料プランのみ）

Supabaseの有料プランで `pg_cron` が利用可能な場合：

```sql
-- pg_cron拡張を有効化（初回のみ）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 毎時0分に実行
SELECT cron.schedule(
  'send-daily-reminder',
  '0 * * * *', -- 毎時0分
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
SELECT * FROM cron.job WHERE jobname = 'send-daily-reminder';

-- スケジュールを削除（必要に応じて）
-- SELECT cron.unschedule('send-daily-reminder');
```

**注意**: `pg_cron` はSupabaseの有料プランでのみ利用可能です。無料プランでは `relation "cron.job" does not exist` エラーが発生します。

## 手動実行（テスト用）

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminder' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

