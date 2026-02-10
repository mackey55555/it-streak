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
          // 途切れているのでDBの current_streak を 0 に更新
          const { data: updated } = await supabase
            .from('streaks')
            .update({ current_streak: 0 })
            .eq('user_id', user.id)
            .select()
            .single();
          streakToSet = updated ?? { ...data, current_streak: 0 };
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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      const yesterdayStr = `${year}-${month}-${day}`;

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

      // 更新
      const { data: updatedStreak } = await supabase
        .from('streaks')
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_completed_date: today,
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
   * ストリークを復活させる（リワード広告視聴後に呼ぶ）
   * current_streak を 1 に、last_completed_date を今日に設定する
   */
  const reviveStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const today = getTodayLocal();

      const { data: currentStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentStreak) {
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

      const { data: updatedStreak } = await supabase
        .from('streaks')
        .update({
          current_streak: 1,
          last_completed_date: today,
          // longest_streak は変更しない（過去の最長記録を維持）
        })
        .eq('user_id', user.id)
        .select()
        .single();

      setStreak(updatedStreak);
    } catch (err: any) {
      setError(err.message);
      console.error('Error reviving streak:', err);
    }
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
    lastCompletedDate: streak?.last_completed_date,
    loading,
    error,
    updateStreak,
    reviveStreak,
    checkTodayCompleted,
    refetch: fetchStreak,
  };
};

