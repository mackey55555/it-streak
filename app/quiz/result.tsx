import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useStreak } from '../../hooks/useStreak';
import { useEffect, useState } from 'react';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ correct: string; total: string }>();
  const { currentStreak, refetch: refetchStreak } = useStreak();
  const [previousStreak, setPreviousStreak] = useState(0);
  
  const correct = parseInt(params.correct || '0', 10);
  const total = parseInt(params.total || '0', 10);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xp = correct * 10; // 正解数 × 10

  useEffect(() => {
    // ストリーク情報を更新
    refetchStreak();
    // 前回のストリークを保存（ストリーク継続判定用）
    setPreviousStreak(currentStreak);
  }, []);

  const getMessage = () => {
    if (percentage >= 80) return { emoji: '🎉', text: '素晴らしい！' };
    if (percentage >= 60) return { emoji: '👍', text: 'いい調子！' };
    if (percentage >= 40) return { emoji: '💪', text: 'もう少し！' };
    return { emoji: '📚', text: '復習しよう！' };
  };

  const message = getMessage();
  
  // ストリーク継続のお祝いメッセージ
  const streakMessage = currentStreak > 1 
    ? `🔥 ${currentStreak}日連続達成中！`
    : null;

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    router.replace('/quiz');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* 結果カード */}
        <Card style={styles.resultCard}>
          <Text variant="h1" style={styles.emoji}>{message.emoji}</Text>
          <Text variant="h2" style={styles.message}>{message.text}</Text>
          
          <View style={styles.scoreContainer}>
            <Text variant="h1" style={styles.score}>{correct}</Text>
            <Text variant="h3" style={styles.scoreDivider}>/</Text>
            <Text variant="h2" style={styles.totalScore}>{total}</Text>
          </View>
          
          <Text variant="body" color={colors.textLight} style={styles.percentage}>
            正答率 {percentage}%
          </Text>
          
          {/* 獲得XP */}
          <View style={styles.xpContainer}>
            <Text variant="h3" style={styles.xpLabel}>獲得XP</Text>
            <View style={styles.xpValueContainer}>
              <Text variant="h1" style={styles.xpValue}>+{xp}</Text>
            </View>
          </View>
          
          {/* ストリーク継続メッセージ */}
          {streakMessage && (
            <View style={styles.streakMessageContainer}>
              <Text variant="body" style={styles.streakMessage}>
                {streakMessage}
              </Text>
            </View>
          )}
        </Card>

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          <Button
            title="もう一度挑戦"
            onPress={handleRetry}
            variant="ghost"
            style={styles.button}
          />
          <Button
            title="ホームに戻る"
            onPress={handleGoHome}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  message: {
    marginBottom: spacing.xl,
    color: colors.primary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  score: {
    fontSize: 56,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scoreDivider: {
    marginHorizontal: spacing.sm,
    color: colors.textLight,
  },
  totalScore: {
    color: colors.textLight,
  },
  percentage: {
    marginTop: spacing.sm,
  },
  xpContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  xpLabel: {
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  xpValueContainer: {
    backgroundColor: colors.secondary + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  xpValue: {
    color: colors.secondary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  streakMessageContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.streak + '20',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  streakMessage: {
    color: colors.streak,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
