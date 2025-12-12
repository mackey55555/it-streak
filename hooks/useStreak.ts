import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Streak = Database['public']['Tables']['streaks']['Row'];

export const useStreak = () => {
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

      setStreak(data);
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

      const today = new Date().toISOString().split('T')[0];

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
      const yesterdayStr = yesterday.toISOString().split('T')[0];

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

  useEffect(() => {
    fetchStreak();
  }, []);

  return {
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    lastCompletedDate: streak?.last_completed_date,
    loading,
    error,
    updateStreak,
    checkTodayCompleted,
    refetch: fetchStreak,
  };
};

