-- 同一端末で複数アカウントにログインした場合、最後にログインしたアカウントにのみ通知するため
-- push_token を登録した時刻を記録する
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token_registered_at TIMESTAMP WITH TIME ZONE;

-- 既存の push_token を持つ行は updated_at を暫定値とする（次回トークン更新で上書きされる）
UPDATE profiles
SET push_token_registered_at = updated_at
WHERE push_token IS NOT NULL AND push_token_registered_at IS NULL;
