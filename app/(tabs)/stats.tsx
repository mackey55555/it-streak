import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

        {/* 励ましメッセージ */}
        <Card style={styles.messageCard}>
          <Text variant="body" style={styles.messageText}>
            {stats.totalAnswers === 0 
              ? '🎓 学習を始めて統計を記録しましょう！'
              : stats.accuracy >= 80 
              ? '🎉 素晴らしい成績です！この調子で頑張りましょう！'
              : stats.accuracy >= 60
              ? '👍 順調に学習できています！'
              : '💪 コツコツ続けることが大切です！頑張りましょう！'
            }
          </Text>
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
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.xl,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.textLight,
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
    padding: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statRowValue: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  messageCard: {
    padding: spacing.lg,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
