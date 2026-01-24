import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Card, ProgressBar, Text, StreakCardSkeleton, ProgressCardSkeleton } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useStreak } from '../../hooks/useStreak';
import { useDailyProgress } from '../../hooks/useDailyProgress';
import { useState, useEffect, useRef } from 'react';

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

  const [refreshing, setRefreshing] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);
  const streakScale = useRef(new Animated.Value(1)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStreak(), refetchProgress()]);
    setRefreshing(false);
  };

  const handleStartLearning = () => {
    router.push('/quiz');
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
                  <Text variant="h1" style={styles.streakEmoji}>🔥</Text>
                </Animated.View>
                <View style={styles.streakTextContainer}>
                  <Text variant="h2" style={styles.streakNumber}>{currentStreak}</Text>
                  <Text variant="body" color={colors.textLight}>日連続！</Text>
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
              <Text variant="caption" style={styles.progressCaption}>
                🎉 今日の目標達成！素晴らしい！
              </Text>
            ) : (
              <Text variant="caption" style={styles.progressCaption}>
                あと{remaining}問で今日の目標達成！
              </Text>
            )}
          </Card>
        )}

        {/* 学習開始ボタン */}
        <Button
          title="今日の学習をはじめる"
          onPress={handleStartLearning}
          style={styles.startButton}
        />

        {/* サブメニュー */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Text variant="h3">📚 分野別に学習</Text>
              <Text variant="caption" style={styles.menuDescription}>
                苦手な分野を集中的に
              </Text>
            </View>
            <Text variant="h3" color={colors.textLight}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Text variant="h3">🔄 苦手な問題を復習</Text>
              <Text variant="caption" style={styles.menuDescription}>
                間違えた問題をもう一度
              </Text>
            </View>
            <Text variant="h3" color={colors.textLight}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Text variant="h3">⭐ ランダムチャレンジ</Text>
              <Text variant="caption" style={styles.menuDescription}>
                全分野からランダムに出題
              </Text>
            </View>
            <Text variant="h3" color={colors.textLight}>›</Text>
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
    alignItems: 'flex-start',
  },
  streakNumber: {
    color: colors.background,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 'bold',
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
  progressCaption: {
    marginTop: spacing.xs,
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
  menuDescription: {
    marginTop: spacing.xs,
    color: colors.textLight,
  },
});

