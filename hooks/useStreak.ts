import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { useAuth } from './useAuth';

type Streak = Database['public']['Tables']['streaks']['Row'];

// ローカル時間で今日の日付をYYYY-MM-DD形式で取得
const getTodayLocal = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ローカル時間で昨日の日付をYYYY-MM-DD形式で取得
const getYesterdayLocal = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// YYYY-MM-DD文字列間の日数差を計算（タイムゾーン安全）
const getDaysBetween = (dateStr1: string, dateStr2: string): number => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

// YYYY-MM-DD文字列の翌日を取得
const getNextDay = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** ストリーク復活可能な最大日数 */
const MAX_REVIVE_DAYS = 3;

export const useStreak = () => {
  const { user, loading: authLoading } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ストリーク情報を取得
  const fetchStreak = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const { data, error: fetchError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found は許容（初回アクセス時）
        throw fetchError;
      }

      // 連続が途切れているかチェック（最後の学習が今日・昨日でない場合は途切れ）
      let streakToSet = data;
      if (data && data.current_streak > 0 && data.last_completed_date) {
        const today = getTodayLocal();
        const yesterday = getYesterdayLocal();
        const lastDate = data.last_completed_date;
        if (lastDate !== today && lastDate !== yesterday) {
          const missedDays = getDaysBetween(lastDate, yesterday);
          // 復活可能範囲内なら previous_streak を保存、超えていたら 0（復活不可）
          const savePreviousStreak = missedDays <= MAX_REVIVE_DAYS ? data.current_streak : 0;
          const { data: updated } = await supabase
            .from('streaks')
            .update({ current_streak: 0, previous_streak: savePreviousStreak })
            .eq('user_id', user.id)
            .select()
            .single();
          streakToSet = updated ?? { ...data, current_streak: 0, previous_streak: savePreviousStreak };
        }
      }

      setStreak(streakToSet);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  };

  // ストリークを更新
  const updateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const today = getTodayLocal();

      // 現在のストリーク情報を取得
      const { data: currentStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentStreak) {
        // ストリークが存在しない場合は作成
        const { data: newStreak } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_completed_date: today,
          })
          .select()
          .single();

        setStreak(newStreak);
        return;
      }

      const lastDate = currentStreak.last_completed_date;

      // 今日既に更新済みの場合は何もしない
      if (lastDate === today) {
        return;
      }

      // 前回の日付を確認
      const yesterdayStr = getYesterdayLocal();

      let newCurrentStreak: number;

      if (lastDate === yesterdayStr) {
        // 連続している場合
        newCurrentStreak = currentStreak.current_streak + 1;
      } else {
        // 連続が途切れた場合
        newCurrentStreak = 1;
      }

      const newLongestStreak = Math.max(
        currentStreak.longest_streak,
        newCurrentStreak
      );

      // 更新（previous_streak もクリアして復活途中の状態を解消）
      const { data: updatedStreak } = await supabase
        .from('streaks')
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_completed_date: today,
          previous_streak: 0,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      setStreak(updatedStreak);
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating streak:', err);
    }
  };

  // 今日の学習が完了しているかチェック
  const checkTodayCompleted = () => {
    if (!streak) return false;
    const today = new Date().toISOString().split('T')[0];
    return streak.last_completed_date === today;
  };

  /**
   * ストリークを1日分復活させる（リワード広告視聴後に呼ぶ）
   * last_completed_date の翌日を埋めて1日前進させる。
   * 全日分埋まった（last_completed_date === 昨日）場合は current_streak を復元する。
   */
  const reviveStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const yesterday = getYesterdayLocal();

      const { data: currentStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentStreak || !currentStreak.last_completed_date) return;

      // 復活対象がない場合は何もしない
      if (currentStreak.previous_streak <= 0) return;

      const missedDays = getDaysBetween(currentStreak.last_completed_date, yesterday);
      if (missedDays <= 0 || missedDays > MAX_REVIVE_DAYS) return;

      // 埋める日 = last_completed_date の翌日
      const fillDate = getNextDay(currentStreak.last_completed_date);

      if (missedDays === 1) {
        // 最後の1日 → 全復元
        const { data: updatedStreak } = await supabase
          .from('streaks')
          .update({
            current_streak: currentStreak.previous_streak,
            last_completed_date: yesterday,
            previous_streak: 0,
          })
          .eq('user_id', user.id)
          .select()
          .single();
        setStreak(updatedStreak);
      } else {
        // まだ残りあり → last_completed_date を1日前進
        const { data: updatedStreak } = await supabase
          .from('streaks')
          .update({
            last_completed_date: fillDate,
          })
          .eq('user_id', user.id)
          .select()
          .single();
        setStreak(updatedStreak);
      }

      // 埋めた日の daily_progress レコードを作成（週間カレンダーに反映）
      await supabase
        .from('daily_progress')
        .upsert({
          user_id: user.id,
          date: fillDate,
          questions_answered: 0,
          questions_correct: 0,
        }, { onConflict: 'user_id,date', ignoreDuplicates: true });
    } catch (err: any) {
      setError(err.message);
      console.error('Error reviving streak:', err);
    }
  };

  // 復活に必要な残り広告視聴回数を算出
  const getReviveDaysRemaining = (): number => {
    if (!streak || streak.previous_streak <= 0 || !streak.last_completed_date) return 0;
    if (streak.current_streak > 0) return 0;
    const yesterday = getYesterdayLocal();
    const missedDays = getDaysBetween(streak.last_completed_date, yesterday);
    if (missedDays <= 0 || missedDays > MAX_REVIVE_DAYS) return 0;
    return missedDays;
  };

  useEffect(() => {
    // 認証が完了し、ユーザーが存在する場合のみデータを取得
    if (!authLoading && user) {
      fetchStreak();
    }
  }, [user, authLoading]);

  // 日付変更を検知して自動的に再取得
  useEffect(() => {
    if (!user) return;

    let lastCheckedDate = getTodayLocal();

    // 1分ごとに日付をチェック
    const interval = setInterval(() => {
      const today = getTodayLocal();
      if (today !== lastCheckedDate) {
        lastCheckedDate = today;
        fetchStreak();
      }
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [user]);

  return {
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    previousStreak: streak?.previous_streak ?? 0,
    lastCompletedDate: streak?.last_completed_date,
    reviveDaysRemaining: getReviveDaysRemaining(),
    loading,
    error,
    updateStreak,
    reviveStreak,
    checkTodayCompleted,
    refetch: fetchStreak,
  };
};
