import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useStreak } from '../../hooks/useStreak';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function StatsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { currentStreak, longestStreak } = useStreak();
  const [stats, setStats] = useState({
    totalAnswers: 0,
    correctAnswers: 0,
    accuracy: 0,
    totalDays: 0,
  });
  const [categoryStats, setCategoryStats] = useState<Array<{
    categoryId: string;
    categoryName: string;
    total: number;
    correct: number;
    accuracy: number;
  }>>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{
    date: string;
    completed: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 全回答数と正解数を取得
      const { data: answers, error: answersError } = await supabase
        .from('user_answers')
        .select('is_correct')
        .eq('user_id', user.id);

      if (answersError) throw answersError;

      const totalAnswers = answers?.length || 0;
      const correctAnswers = answers?.filter(a => a.is_correct).length || 0;
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

      // 学習日数を取得
      const { data: progress, error: progressError } = await supabase
        .from('daily_progress')
        .select('date')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      const totalDays = progress?.length || 0;

      // 分野別の正答率を取得
      const { data: answersWithQuestions, error: categoryError } = await supabase
        .from('user_answers')
        .select(`
          is_correct,
          question_id,
          questions!inner(
            category_id,
            categories(name)
          )
        `)
        .eq('user_id', user.id);

      if (categoryError) throw categoryError;

      // 分野別に集計
      const categoryMap = new Map<string, { total: number; correct: number; name: string }>();
      
      answersWithQuestions?.forEach((answer: any) => {
        const question = answer.questions;
        const categoryId = question?.category_id;
        const categoryName = question?.categories?.name || '未分類';
        
        if (categoryId) {
          const current = categoryMap.get(categoryId) || { total: 0, correct: 0, name: categoryName };
          current.total++;
          if (answer.is_correct) current.correct++;
          categoryMap.set(categoryId, current);
        }
      });

      const categoryStatsArray = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        total: data.total,
        correct: data.correct,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      })).sort((a, b) => b.total - a.total); // 回答数の多い順

      setCategoryStats(categoryStatsArray);

      // 今週の学習日数を取得
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // 日曜日を週の始まりに
      weekStart.setHours(0, 0, 0, 0);

      // 日付をYYYY-MM-DD形式の文字列に変換（ローカル時間を使用）
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const weeklyDates: Array<{ date: string; completed: boolean }> = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = formatDate(date);
        // progressデータから該当する日付を検索
        const completed = progress?.some(p => {
          // p.dateが文字列の場合とDateオブジェクトの場合の両方に対応
          const progressDate = typeof p.date === 'string' ? p.date : formatDate(new Date(p.date));
          return progressDate === dateStr;
        }) || false;
        weeklyDates.push({ date: dateStr, completed });
      }

      setWeeklyProgress(weeklyDates);

      setStats({
        totalAnswers,
        correctAnswers,
        accuracy,
        totalDays,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError(error.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color={colors.textLight} style={styles.loadingText}>
            データを読み込み中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text variant="h3" color={colors.incorrect}>エラーが発生しました</Text>
          <Text variant="body" style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <Text variant="h2" style={styles.header}>学習統計</Text>

        {/* ストリーク統計 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>ストリーク</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text variant="h1" style={styles.statValue}>{currentStreak}</Text>
              <Text variant="body" color={colors.textLight}>現在の連続日数</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="h1" style={styles.statValue}>{longestStreak}</Text>
              <Text variant="body" color={colors.textLight}>最長連続日数</Text>
            </Card>
          </View>
        </View>

        {/* 学習統計 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>学習記録</Text>
          <Card style={styles.card}>
            <View style={styles.statRow}>
              <Text variant="body" color={colors.textLight}>学習日数</Text>
              <Text variant="h2" style={styles.statRowValue}>{stats.totalDays} 日</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text variant="body" color={colors.textLight}>総回答数</Text>
              <Text variant="h2" style={styles.statRowValue}>{stats.totalAnswers} 問</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text variant="body" color={colors.textLight}>正解数</Text>
              <Text variant="h2" style={styles.statRowValue}>{stats.correctAnswers} 問</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text variant="body" color={colors.textLight}>正答率</Text>
              <Text variant="h2" style={[styles.statRowValue, { color: colors.primary }]}>
                {stats.accuracy}%
              </Text>
            </View>
          </Card>
        </View>

        {/* 分野別正答率 */}
        {categoryStats.length > 0 && (
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>分野別正答率</Text>
            <Card style={styles.card}>
              {categoryStats.map((category, index) => (
                <View 
                  key={category.categoryId} 
                  style={[
                    styles.categoryItem,
                    index === categoryStats.length - 1 && styles.categoryItemLast
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <Text variant="body" style={styles.categoryName}>
                      {category.categoryName}
                    </Text>
                    <Text variant="body" style={[
                      styles.categoryAccuracy,
                      { color: category.accuracy >= 80 ? colors.correct : category.accuracy >= 60 ? colors.secondary : colors.incorrect }
                    ]}>
                      {category.accuracy}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[
                      styles.progressBarFill,
                      {
                        width: `${category.accuracy}%`,
                        backgroundColor: category.accuracy >= 80 ? colors.correct : category.accuracy >= 60 ? colors.secondary : colors.incorrect,
                      }
                    ]} />
                  </View>
                  <Text variant="caption" color={colors.textLight} style={styles.categoryDetail}>
                    {category.correct} / {category.total} 問正解
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* 今週の学習日数 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>今週の学習</Text>
          <Card style={styles.card}>
            <View style={styles.calendarContainer}>
              {weeklyProgress.map((day, index) => {
                // 日付文字列（YYYY-MM-DD）をパース
                const [year, month, dayNum] = day.date.split('-').map(Number);
                const date = new Date(year, month - 1, dayNum);
                const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                const dayNumber = date.getDate();
                
                // 今日の日付をローカル時間で取得
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isToday = day.date === todayStr;
                
                return (
                  <View key={day.date} style={styles.calendarDay}>
                    <Text variant="caption" color={colors.textLight} style={styles.dayName}>
                      {dayName}
                    </Text>
                    <View style={[
                      styles.calendarDayCircle,
                      day.completed && styles.calendarDayCompleted,
                      isToday && styles.calendarDayToday,
                    ]}>
                      <Text variant="body" style={[
                        styles.dayNumber,
                        day.completed && styles.dayNumberCompleted,
                        isToday && !day.completed && styles.dayNumberToday, // completedの場合は白を優先
                      ]}>
                        {dayNumber}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text variant="caption" color={colors.textLight} style={styles.calendarCaption}>
              今週は {weeklyProgress.filter(d => d.completed).length} 日学習しました
            </Text>
          </Card>
        </View>

        {/* 励ましメッセージ */}
        <Card style={styles.messageCard}>
          <View style={styles.messageContent}>
            {stats.totalAnswers === 0 ? (
              <>
                <Ionicons name="school-outline" size={24} color={colors.primary} style={styles.messageIcon} />
                <Text variant="body" style={styles.messageText}>
                  学習を始めて統計を記録しましょう！
                </Text>
              </>
            ) : stats.accuracy >= 80 ? (
              <>
                <Ionicons name="trophy" size={24} color={colors.secondary} style={styles.messageIcon} />
                <Text variant="body" style={styles.messageText}>
                  素晴らしい成績です！この調子で頑張りましょう！
                </Text>
              </>
            ) : stats.accuracy >= 60 ? (
              <>
                <Ionicons name="thumbs-up" size={24} color={colors.primary} style={styles.messageIcon} />
                <Text variant="body" style={styles.messageText}>
                  順調に学習できています！
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="fitness" size={24} color={colors.streak} style={styles.messageIcon} />
                <Text variant="body" style={styles.messageText}>
                  コツコツ続けることが大切です！頑張りましょう！
                </Text>
              </>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20, // タブバーの高さ分の余白を追加
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.textLight,
  },
  header: {
    marginBottom: spacing.xxl,
    color: colors.text,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    color: colors.text,
    fontWeight: '600',
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  statRowValue: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  messageCard: {
    padding: spacing.xl,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '20',
    borderRadius: borderRadius.lg,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  messageIcon: {
    marginRight: spacing.xs,
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 24,
    flex: 1,
  },
  categoryItem: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontWeight: '600',
    flex: 1,
  },
  categoryAccuracy: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  categoryDetail: {
    fontSize: 12,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  calendarDay: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayName: {
    fontSize: 12,
  },
  calendarDayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  calendarDayToday: {
    borderColor: colors.secondary,
    borderWidth: 3,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumberCompleted: {
    color: '#FFFFFF', // より濃い白で可視性を向上
    fontWeight: 'bold', // 太字でより見やすく
  },
  dayNumberToday: {
    color: colors.secondary,
  },
  calendarCaption: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
