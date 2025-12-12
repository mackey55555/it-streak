import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  try {
    // Supabaseクライアントの作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 現在の時刻を取得
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // 今日の日付
    const today = now.toISOString().split('T')[0];

    // 通知時刻が現在時刻と一致するユーザーを取得
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, push_token, notification_enabled, notification_time')
      .eq('notification_enabled', true)
      .not('push_token', 'is', null);

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 通知時刻が現在時刻と一致するユーザーをフィルタ
    const usersToNotify = profiles.filter(profile => {
      if (!profile.notification_time) return false;
      const notificationTime = profile.notification_time.substring(0, 5); // "HH:MM"形式
      return notificationTime === currentTime;
    });

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users match current notification time' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 各ユーザーの今日の学習状況を確認
    const notifications: ExpoPushMessage[] = [];

    for (const user of usersToNotify) {
      // 今日の進捗を確認
      const { data: todayProgress } = await supabase
        .from('daily_progress')
        .select('questions_answered')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      // 今日まだ学習していない場合のみ通知
      if (!todayProgress || todayProgress.questions_answered === 0) {
        // ストリーク情報を取得
        const { data: streak } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();

        const currentStreak = streak?.current_streak || 0;

        // 通知メッセージを生成
        let title: string;
        let body: string;

        if (currentStreak > 0) {
          title = '🔥 ストリーク継続中！';
          body = `${currentStreak}日連続達成中！今日も学習を続けよう！`;
        } else {
          title = '📚 今日の学習';
          body = '今日の学習、まだ終わってないよ！';
        }

        notifications.push({
          to: user.push_token!,
          sound: 'default',
          title,
          body,
          data: { type: 'daily_reminder' },
        });
      }
    }

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All users have already completed today' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Expo Push APIに送信
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(notifications),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        count: notifications.length,
        result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

