import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ProgressBar, Text, StreakCardSkeleton, ProgressCardSkeleton } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useStreak } from '../../hooks/useStreak';
import { useDailyProgress } from '../../hooks/useDailyProgress';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { currentStreak, loading: streakLoading, refetch: refetchStreak } = useStreak();
  const { 
    todayProgress, 
    dailyGoal, 
    progressPercentage,
    isGoalCompleted,
    loading: progressLoading, 
    refetch: refetchProgress 
  } = useDailyProgress();

  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{ date: string; completed: boolean }>>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [selectedExamName, setSelectedExamName] = useState<string>('');
  const streakScale = useRef(new Animated.Value(1)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

  // 選択された試験を取得
  const fetchSelectedExam = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_exam_id')
        .eq('id', user.id)
        .single();

      if (profile?.selected_exam_id) {
        const { data: examData } = await supabase
          .from('exams')
          .select('name')
          .eq('id', profile.selected_exam_id)
          .single();

        if (examData) {
          setSelectedExamName(examData.name);
        } else {
          setSelectedExamName('');
        }
      } else {
        setSelectedExamName('');
      }
    } catch (error) {
      console.error('Error fetching selected exam:', error);
      setSelectedExamName('');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSelectedExam();
    }
  }, [user, fetchSelectedExam]);

  // 画面がフォーカスされたときに試験を再取得
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSelectedExam();
      }
    }, [user, fetchSelectedExam])
  );

  // ストリーク更新時のアニメーション
  useEffect(() => {
    if (currentStreak > previousStreak && previousStreak > 0) {
      // ストリークが増えた時のアニメーション
      Animated.sequence([
        Animated.parallel([
          Animated.spring(streakScale, {
            toValue: 1.2,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(streakScale, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
    setPreviousStreak(currentStreak);
  }, [currentStreak]);

  // 今週の学習データを取得
  const fetchWeeklyProgress = async () => {
    if (!user) return;
    
    setWeeklyLoading(true);
    try {
      // 今週の進捗データを取得
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // 日曜日を週の始まりに
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // 日付をYYYY-MM-DD形式の文字列に変換（ローカル時間を使用）
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const weekStartStr = formatDate(weekStart);
      const weekEndStr = formatDate(weekEnd);

      const { data: progress, error } = await supabase
        .from('daily_progress')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);

      if (error) throw error;

      const weeklyDates: Array<{ date: string; completed: boolean }> = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = formatDate(date);
        const completed = progress?.some(p => {
          const progressDate = typeof p.date === 'string' ? p.date : formatDate(new Date(p.date));
          return progressDate === dateStr;
        }) || false;
        weeklyDates.push({ date: dateStr, completed });
      }

      setWeeklyProgress(weeklyDates);
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWeeklyProgress();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStreak(), refetchProgress(), fetchWeeklyProgress()]);
    setRefreshing(false);
  };

  const handleStartLearning = () => {
    router.push('/quiz');
  };

  const handleRandomChallenge = () => {
    router.push({
      pathname: '/quiz',
      params: { mode: 'random' }
    });
  };

  const handleReviewIncorrect = async () => {
    if (!user) return;

    try {
      // 間違えた問題があるか確認
      const { count, error } = await supabase
        .from('user_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_correct', false);

      if (error) throw error;

      if (!count || count === 0) {
        Alert.alert(
          '復習問題なし',
          'まだ間違えた問題がありません。\n問題を解いてから復習機能をご利用ください。'
        );
        return;
      }

      // クイズ画面に遷移（復習モード）
      router.push({
        pathname: '/quiz',
        params: { mode: 'review' }
      });
    } catch (error: any) {
      Alert.alert('エラー', 'データの取得に失敗しました');
      console.error('Error checking incorrect questions:', error);
    }
  };

  const loading = streakLoading || progressLoading;
  const remaining = Math.max(0, dailyGoal - todayProgress.answered);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 現在の試験表示 */}
        {selectedExamName && (
          <View style={styles.examBadge}>
            <Ionicons name="school-outline" size={16} color={colors.primary} />
            <Text variant="caption" style={styles.examBadgeText}>
              {selectedExamName}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={styles.examBadgeButton}
            >
              <Ionicons name="settings-outline" size={14} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        )}

        {/* ストリーク表示 */}
        <Animated.View
          style={[
            styles.streakCardWrapper,
            {
              transform: [
                { scale: streakScale },
              ],
            },
          ]}
        >
          {streakLoading ? (
            <StreakCardSkeleton />
          ) : (
            <Card style={styles.streakCard}>
              <View style={styles.streakContent}>
                <Animated.View
                  style={{
                    transform: [{ scale: streakPulse }],
                  }}
                >
                  <Ionicons name="flame" size={48} color={colors.background} />
                </Animated.View>
                <View style={styles.streakTextContainer}>
                  <Text variant="h2" style={styles.streakNumber}>{currentStreak}</Text>
                  <Text variant="h3" style={styles.streakLabel}>日連続！</Text>
                </View>
              </View>
            </Card>
          )}
        </Animated.View>

        {/* 今日の進捗カード */}
        {progressLoading ? (
          <ProgressCardSkeleton />
        ) : (
          <Card style={[
            styles.progressCard,
            isGoalCompleted && styles.progressCardCompleted
          ]}>
            <Text variant="h3" style={styles.progressTitle}>今日の進捗</Text>
            <View style={styles.progressInfo}>
              <Text variant="h2" style={styles.progressText}>
                {todayProgress.answered} / {dailyGoal} 問
              </Text>
            </View>
            <ProgressBar 
              progress={progressPercentage / 100} 
              style={styles.progressBar}
            />
            {isGoalCompleted ? (
              <View style={styles.progressCaptionRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.captionIcon} />
                <Text variant="caption" style={styles.progressCaption}>
                  今日の目標達成！素晴らしい！
                </Text>
              </View>
            ) : (
              <Text variant="caption" style={styles.progressCaption}>
                あと{remaining}問で今日の目標達成！
              </Text>
            )}
          </Card>
        )}

        {/* 今週の学習カード（コンパクト版） */}
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/stats')}
          activeOpacity={0.7}
        >
          <Card style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <Text variant="h3" style={styles.weeklyTitle}>今週の学習</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </View>
            <View style={styles.calendarContainer}>
              {weeklyLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                weeklyProgress.map((day) => {
                  const [year, month, dayNum] = day.date.split('-').map(Number);
                  const date = new Date(year, month - 1, dayNum);
                  const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                  const dayNumber = date.getDate();
                  
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
                        <Text variant="caption" style={[
                          styles.dayNumber,
                          day.completed && styles.dayNumberCompleted,
                          isToday && !day.completed && styles.dayNumberToday,
                        ]}>
                          {dayNumber}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
            {!weeklyLoading && (
              <Text variant="caption" color={colors.textLight} style={styles.weeklyCaption}>
                今週は {weeklyProgress.filter(d => d.completed).length} 日学習しました
              </Text>
            )}
          </Card>
        </TouchableOpacity>

        {/* 学習開始ボタン */}
        <Button
          title="今日の学習をはじめる"
          onPress={handleStartLearning}
          style={styles.startButton}
        />

        {/* サブメニュー */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/quiz/category-select')}
            activeOpacity={0.7}
          >
            <View style={styles.menuContent}>
              <View style={styles.menuTitleRow}>
                <Ionicons name="library-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                <Text variant="h3">分野別に学習</Text>
              </View>
              <Text variant="caption" style={styles.menuDescription}>
                苦手な分野を集中的に
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleReviewIncorrect}
            activeOpacity={0.7}
          >
            <View style={styles.menuContent}>
              <View style={styles.menuTitleRow}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                <Text variant="h3">苦手な問題を復習</Text>
              </View>
              <Text variant="caption" style={styles.menuDescription}>
                間違えた問題をもう一度
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleRandomChallenge}
            activeOpacity={0.7}
          >
            <View style={styles.menuContent}>
              <View style={styles.menuTitleRow}>
                <Ionicons name="shuffle-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                <Text variant="h3">ランダムチャレンジ</Text>
              </View>
              <Text variant="caption" style={styles.menuDescription}>
                全分野からランダムに出題
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
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
  streakCardWrapper: {
    marginBottom: spacing.lg,
  },
  streakCard: {
    backgroundColor: colors.streak,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 0,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: spacing.lg,
  },
  streakTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  streakNumber: {
    color: colors.background,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 'bold',
  },
  streakLabel: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '600',
    opacity: 0.95,
  },
  progressCard: {
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  progressCardCompleted: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  progressTitle: {
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  progressInfo: {
    marginBottom: spacing.md,
  },
  progressText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBar: {
    marginVertical: spacing.md,
    height: 16,
  },
  progressCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  captionIcon: {
    marginRight: spacing.xs,
  },
  progressCaption: {
    textAlign: 'center',
    fontWeight: '600',
  },
  startButton: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  menuSection: {
    gap: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: 64, // タップ領域を確保
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuContent: {
    flex: 1,
    gap: spacing.xs,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuIcon: {
    marginRight: spacing.xs,
  },
  menuDescription: {
    marginTop: spacing.xs,
    color: colors.textLight,
  },
  weeklyCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  weeklyTitle: {
    fontWeight: '600',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  calendarDay: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayName: {
    fontSize: 11,
  },
  calendarDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumberCompleted: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayNumberToday: {
    color: colors.secondary,
  },
  weeklyCaption: {
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: 12,
  },
  examBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  examBadgeText: {
    flex: 1,
    fontWeight: '600',
    color: colors.text,
  },
  examBadgeButton: {
    padding: spacing.xs,
  },
});

