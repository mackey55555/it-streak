import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SlotType } from './messages.ts';
import { selectMessage, substituteVariables } from './selectMessage.ts';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface RequestBody {
  slot?: SlotType;
}

function getTodayJST(): string {
  const now = Date.now();
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(now + jstOffset).toISOString().slice(0, 10);
}

function getDateDaysAgo(today: string, days: number): string {
  const d = new Date(today + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: RequestBody = {};
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      // 空 body や JSON でない場合は evening として従来互換
      body = { slot: 'evening' };
    }
    const slot: SlotType = body.slot ?? 'evening';

    const today = getTodayJST();
    const threeDaysAgo = getDateDaysAgo(today, 3);

    const validSlots: SlotType[] = [
      'morning',
      'lunch',
      'evening',
      'night',
      'final',
      'deadline',
      'recovery',
    ];
    if (!validSlots.includes(slot)) {
      return new Response(
        JSON.stringify({ error: `Invalid slot: ${slot}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, push_token, daily_goal')
      .eq('notification_enabled', true)
      .not('push_token', 'is', null);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify', slot }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: todayProgressList } = await supabase
      .from('daily_progress')
      .select('user_id, questions_answered')
      .eq('date', today);

    const progressByUser = new Map<string, number>();
    for (const p of todayProgressList ?? []) {
      progressByUser.set(p.user_id, p.questions_answered ?? 0);
    }

    const { data: streaksList } = await supabase
      .from('streaks')
      .select('user_id, current_streak, last_completed_date')
      .in('user_id', profiles.map((p) => p.id));

    const streakByUser = new Map<string, number>();
    const lastCompletedByUser = new Map<string, string | null>();
    for (const s of streaksList ?? []) {
      streakByUser.set(s.user_id, s.current_streak ?? 0);
      lastCompletedByUser.set(s.user_id, s.last_completed_date ?? null);
    }

    const { data: logRows } = await supabase
      .from('push_notification_log')
      .select('user_id, date, message_id')
      .gte('date', threeDaysAgo)
      .lte('date', today);

    const recentMessageIdsByUser = new Map<string, string[]>();
    for (const row of logRows ?? []) {
      const key = row.user_id;
      if (!recentMessageIdsByUser.has(key)) recentMessageIdsByUser.set(key, []);
      recentMessageIdsByUser.get(key)!.push(row.message_id);
    }

    let userIdsToNotify = profiles
      .filter((p) => {
        const answered = progressByUser.get(p.id) ?? 0;
        const streak = streakByUser.get(p.id) ?? 0;
        const lastCompleted = lastCompletedByUser.get(p.id) ?? null;
        if (slot === 'recovery') {
          return streak === 0 && answered === 0 && lastCompleted != null;
        }
        if (slot === 'morning') {
          return answered === 0 && (streak > 0 || lastCompleted == null);
        }
        return answered === 0;
      })
      .map((p) => p.id);

    if (slot === 'deadline') {
      const { data: finalSent } = await supabase
        .from('push_notification_log')
        .select('user_id')
        .eq('date', today)
        .eq('slot', 'final');
      const finalSentSet = new Set((finalSent ?? []).map((r) => r.user_id));
      userIdsToNotify = userIdsToNotify.filter((id) => finalSentSet.has(id));
    }

    const notifications: ExpoPushMessage[] = [];
    const logInserts: { user_id: string; date: string; slot: string; message_id: string }[] = [];

    for (const profile of profiles) {
      if (!userIdsToNotify.includes(profile.id)) continue;

      const pushToken = profile.push_token as string;
      const dailyGoal = profile.daily_goal ?? 5;
      const todayAnswered = progressByUser.get(profile.id) ?? 0;
      const streak = streakByUser.get(profile.id) ?? 0;
      const remaining = Math.max(0, dailyGoal - todayAnswered);
      const recentMessageIds = recentMessageIdsByUser.get(profile.id) ?? [];

      const message = selectMessage({
        slot,
        streak,
        dailyGoal,
        todayQuestionsAnswered: todayAnswered,
        recentMessageIds,
      });

      const { title, body } = substituteVariables(
        message.title,
        message.body,
        streak,
        remaining
      );

      notifications.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: { type: 'daily_reminder', slot, message_id: message.id },
      });

      logInserts.push({
        user_id: profile.id,
        date: today,
        slot,
        message_id: message.id,
      });
    }

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({
          message: slot === 'deadline' ? 'No users received final today' : 'All users have already completed today',
          slot,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const res = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });
      const result = await res.json();
      if (res.status !== 200) {
        console.error('Expo Push API error:', result);
      }
    }

    if (logInserts.length > 0) {
      const { error: logError } = await supabase.from('push_notification_log').insert(logInserts);
      if (logError) console.error('push_notification_log insert error:', logError);
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        slot,
        count: notifications.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
