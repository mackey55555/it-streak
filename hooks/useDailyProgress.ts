import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type DailyProgress = Database['public']['Tables']['daily_progress']['Row'];

export const useDailyProgress = () => {
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 今日の進捗を取得
  const fetchTodayProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const today = new Date().toISOString().split('T')[0];

      // プロフィールから目標を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDailyGoal(profile.daily_goal);
      }

      // 今日の進捗を取得
      const { data, error: fetchError } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setProgress(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching daily progress:', err);
    } finally {
      setLoading(false);
    }
  };

  // 進捗を記録
  const recordProgress = async (isCorrect: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const today = new Date().toISOString().split('T')[0];

      // 現在の進捗を取得
      const { data: currentProgress } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!currentProgress) {
        // 今日の進捗が存在しない場合は作成
        const { data: newProgress } = await supabase
          .from('daily_progress')
          .insert({
            user_id: user.id,
            date: today,
            questions_answered: 1,
            questions_correct: isCorrect ? 1 : 0,
          })
          .select()
          .single();

        setProgress(newProgress);
      } else {
        // 既存の進捗を更新
        const { data: updatedProgress } = await supabase
          .from('daily_progress')
          .update({
            questions_answered: currentProgress.questions_answered + 1,
            questions_correct: currentProgress.questions_correct + (isCorrect ? 1 : 0),
          })
          .eq('user_id', user.id)
          .eq('date', today)
          .select()
          .single();

        setProgress(updatedProgress);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error recording progress:', err);
    }
  };

  // 目標達成確認
  const isGoalCompleted = () => {
    if (!progress) return false;
    return progress.questions_answered >= dailyGoal;
  };

  // 進捗率を計算
  const progressPercentage = progress
    ? Math.min((progress.questions_answered / dailyGoal) * 100, 100)
    : 0;

  useEffect(() => {
    fetchTodayProgress();
  }, []);

  return {
    todayProgress: {
      answered: progress?.questions_answered ?? 0,
      correct: progress?.questions_correct ?? 0,
    },
    dailyGoal,
    isGoalCompleted: isGoalCompleted(),
    progressPercentage,
    loading,
    error,
    recordProgress,
    refetch: fetchTodayProgress,
  };
};

