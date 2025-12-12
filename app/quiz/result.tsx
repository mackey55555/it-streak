import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ correct: string; total: string }>();
  
  const correct = parseInt(params.correct || '0', 10);
  const total = parseInt(params.total || '0', 10);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getMessage = () => {
    if (percentage >= 80) return { emoji: '🎉', text: '素晴らしい！' };
    if (percentage >= 60) return { emoji: '👍', text: 'いい調子！' };
    if (percentage >= 40) return { emoji: '💪', text: 'もう少し！' };
    return { emoji: '📚', text: '復習しよう！' };
  };

  const message = getMessage();

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
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
