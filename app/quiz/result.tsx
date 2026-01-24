import { View, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, Confetti } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useStreak } from '../../hooks/useStreak';
import { useEffect, useState, useRef } from 'react';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ correct: string; total: string }>();
  const { currentStreak, refetch: refetchStreak } = useStreak();
  const [previousStreak, setPreviousStreak] = useState(0);
  
  const correct = parseInt(params.correct || '0', 10);
  const total = parseInt(params.total || '0', 10);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xp = correct * 10; // 正解数 × 10

  const [showConfetti, setShowConfetti] = useState(false);
  const cardScale = useRef(new Animated.Value(0)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ストリーク情報を更新
    refetchStreak();
    // 前回のストリークを保存（ストリーク継続判定用）
    setPreviousStreak(currentStreak);

    // アニメーション値をリセット
    cardScale.setValue(0);
    scoreOpacity.setValue(0);

    // アニメーション開始
    const cardAnimation = Animated.spring(cardScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    });

    const scoreAnimation = Animated.timing(scoreOpacity, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    });

    const parallelAnimation = Animated.parallel([cardAnimation, scoreAnimation]);
    parallelAnimation.start();

    // 高得点の場合は紙吹雪を表示
    let confettiTimeout: NodeJS.Timeout | null = null;
    if (percentage >= 80) {
      confettiTimeout = setTimeout(() => setShowConfetti(true), 500);
    }

    return () => {
      if (confettiTimeout) {
        clearTimeout(confettiTimeout);
      }
      try {
        parallelAnimation.stop();
        cardAnimation.stop();
        scoreAnimation.stop();
      } catch (e) {
        // エラーを無視
      }
    };
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
      {/* 紙吹雪アニメーション */}
      <Confetti visible={showConfetti} duration={3000} />
      
      <View style={styles.content}>
        {/* 結果カード */}
        <Animated.View
          style={[
            styles.resultCardWrapper,
            {
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <Card style={styles.resultCard}>
          <Text variant="h1" style={styles.emoji}>{message.emoji}</Text>
          <Text variant="h2" style={styles.message}>{message.text}</Text>
          
          <Animated.View
            style={[
              styles.scoreContainer,
              {
                opacity: scoreOpacity,
              },
            ]}
          >
            <Text variant="h1" style={styles.score}>{correct}</Text>
            <Text variant="h3" style={styles.scoreDivider}>/</Text>
            <Text variant="h2" style={styles.totalScore}>{total}</Text>
          </Animated.View>
          
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
        </Animated.View>

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
    paddingBottom: spacing.xxl,
  },
  resultCardWrapper: {
    marginBottom: spacing.xl,
    marginTop: spacing.md, // 上部マージンを追加
  },
  resultCard: {
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.lg, // 上部のパディングを増やす
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    overflow: 'visible' as any, // 見切れ防止（Cardコンポーネントのoverflow: hiddenを上書き）
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
    alignItems: 'center', // baselineからcenterに変更
    justifyContent: 'center',
    marginTop: spacing.md, // 上部マージンを追加
    marginBottom: spacing.sm,
    minHeight: 70, // 最小高さを確保
  },
  score: {
    fontSize: 56,
    color: colors.primary,
    fontWeight: 'bold',
    lineHeight: 64, // 行の高さを明示的に設定
  },
  scoreDivider: {
    marginHorizontal: spacing.sm,
    color: colors.textLight,
    lineHeight: 64, // スコアと同じ行の高さに合わせる
  },
  totalScore: {
    color: colors.textLight,
    lineHeight: 40, // 適切な行の高さ
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
