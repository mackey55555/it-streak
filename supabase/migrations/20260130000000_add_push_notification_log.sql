-- プッシュ通知送信ログ
-- 過去3日間のメッセージ重複排除、23:50 の「23:15 送信済み」判定に利用
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'lunch', 'evening', 'night', 'final', 'deadline', 'recovery')),
  message_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date, slot)
);

CREATE INDEX IF NOT EXISTS idx_push_notification_log_user_date ON push_notification_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_push_notification_log_date_slot ON push_notification_log(date, slot);

-- RLS: ログはバックエンド（service_role）のみが書き込む。anon には公開しない。
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- ポリシーを付けない = anon/authenticated はアクセス不可。service_role は RLS をバイパスするため Edge Function から利用可能。
