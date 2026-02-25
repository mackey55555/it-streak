/**
 * クイズ結果の表示コンテンツ（広告表示の有無に依存しない共通UI）
 */
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text, Confetti, Character } from '../ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { notificationSuccess } from '../../lib/haptics';
import { useStreak } from '../../hooks/useStreak';
import { useEffect, useState, useRef } from 'react';

type Props = {
  readyToAnimate: boolean;
};

export function ResultContent({ readyToAnimate }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ correct: string; total: string }>();
  const { currentStreak, refetch: refetchStreak } = useStreak();
  const [previousStreak, setPreviousStreak] = useState(0);
  const { height: screenHeight } = useWindowDimensions();

  // 画面高さに応じたスケール（基準: 736pt = iPhone 8 Plus）
  const scale = Math.min(1, screenHeight / 736);

  const correct = parseInt(params.correct || '0', 10);
  const total = parseInt(params.total || '0', 10);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xp = correct * 10;

  const [showConfetti, setShowConfetti] = useState(false);
  const cardScale = useRef(new Animated.Value(0)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!readyToAnimate || hasAnimated.current) return;
    hasAnimated.current = true;

    notificationSuccess();
    refetchStreak();
    setPreviousStreak(currentStreak);

    cardScale.setValue(0);
    scoreOpacity.setValue(0);

    let confettiTimeout: ReturnType<typeof setTimeout> | null = null;

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

    Animated.parallel([cardAnimation, scoreAnimation]).start();

    if (percentage >= 80) {
      confettiTimeout = setTimeout(() => setShowConfetti(true), 500);
    }

    return () => {
      if (confettiTimeout) clearTimeout(confettiTimeout);
    };
  }, [readyToAnimate]);

  const getMessage = () => {
    if (percentage >= 80) return { icon: 'trophy', text: '素晴らしい！', color: colors.secondary, characterType: 'result-high' as const, characterSize: 'large' as const };
    if (percentage >= 60) return { icon: 'thumbs-up', text: 'いい調子！', color: colors.primary, characterType: 'result-good' as const, characterSize: 'medium' as const };
    if (percentage >= 40) return { icon: 'fitness', text: 'もう少し！', color: colors.streak, characterType: 'result-medium' as const, characterSize: 'medium' as const };
    return { icon: 'book', text: '復習しよう！', color: colors.textLight, characterType: 'result-low' as const, characterSize: 'medium' as const };
  };

  const message = getMessage();
  // 小画面では characterSize を1段階下げる
  const characterSize = scale < 0.85
    ? (message.characterSize === 'large' ? 'medium' : 'small')
    : message.characterSize;
  const streakMessage = currentStreak > 1 ? `${currentStreak}日連続達成中！` : null;

  const handleGoHome = () => router.replace('/(tabs)');
  const handleRetry = () => router.replace('/quiz');

  // スケールに応じた動的スタイル
  const scoreFontSize = Math.round(56 * scale);
  const scoreLineHeight = Math.round(64 * scale);
  const xpFontSize = Math.round(32 * scale);
  const s = (v: number) => Math.round(v * scale);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Confetti visible={showConfetti} duration={3000} />
      <View style={[styles.content, { padding: s(spacing.xl), paddingBottom: s(spacing.xxl) }]}>
        <Animated.View style={[styles.resultCardWrapper, { marginBottom: s(spacing.xl), marginTop: s(spacing.md) }, { transform: [{ scale: cardScale }] }]}>
          <Card style={{ ...styles.resultCard, paddingTop: s(spacing.xxl + spacing.lg), paddingBottom: s(spacing.xxl) }}>
            <View style={[styles.iconContainer, { marginBottom: s(spacing.md) }]}>
              <Character
                type={message.characterType}
                size={characterSize}
                animated={true}
                style={styles.characterIcon}
              />
            </View>
            <Text variant="h2" style={{ ...styles.message, color: message.color, marginBottom: s(spacing.xl) }}>{message.text}</Text>
            <Animated.View style={[styles.scoreContainer, { opacity: scoreOpacity, marginTop: s(spacing.md), marginBottom: s(spacing.sm), minHeight: s(70) }]}>
              <Text variant="h1" style={{ ...styles.score, fontSize: scoreFontSize, lineHeight: scoreLineHeight }}>{correct}</Text>
              <Text variant="h3" style={{ ...styles.scoreDivider, lineHeight: scoreLineHeight }}>/</Text>
              <Text variant="h2" style={{ ...styles.totalScore, lineHeight: Math.round(40 * scale) }}>{total}</Text>
            </Animated.View>
            <Text variant="body" color={colors.textLight} style={{ marginTop: s(spacing.sm) }}>
              正答率 {percentage}%
            </Text>
            <View style={[styles.xpContainer, { marginTop: s(spacing.xl) }]}>
              <Text variant="h3" style={styles.xpLabel}>獲得XP</Text>
              <View style={styles.xpValueContainer}>
                <Text variant="h1" style={{ ...styles.xpValue, fontSize: xpFontSize }}>+{xp}</Text>
              </View>
            </View>
            {streakMessage && (
              <View style={[styles.streakMessageContainer, { marginTop: s(spacing.lg) }]}>
                <Character type="streak-celebration" size="small" animated={true} style={styles.streakCharacter} />
                <Ionicons name="flame" size={20} color={colors.streak} style={styles.streakIcon} />
                <Text variant="body" style={styles.streakMessage}>{streakMessage}</Text>
              </View>
            )}
          </Card>
        </Animated.View>
        <View style={[styles.buttonContainer, { gap: s(spacing.md) }]}>
          <Button title="もう一度挑戦" onPress={handleRetry} variant="ghost" style={styles.button} />
          <Button title="ホームに戻る" onPress={handleGoHome} style={styles.button} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, justifyContent: 'center' },
  resultCardWrapper: {},
  resultCard: { alignItems: 'center', paddingHorizontal: spacing.xl, overflow: 'visible' as any },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  characterIcon: { marginBottom: spacing.xs },
  message: {},
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  score: { color: colors.primary, fontWeight: 'bold' },
  scoreDivider: { marginHorizontal: spacing.sm, color: colors.textLight },
  totalScore: { color: colors.textLight },
  xpContainer: { alignItems: 'center' },
  xpLabel: { color: colors.textLight, marginBottom: spacing.xs },
  xpValueContainer: { backgroundColor: colors.secondary + '20', borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  xpValue: { color: colors.secondary, fontWeight: 'bold' },
  streakMessageContainer: { backgroundColor: colors.streak + '20', borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  streakCharacter: { marginRight: spacing.xs },
  streakIcon: { marginRight: spacing.xs },
  streakMessage: { color: colors.streak, fontWeight: '600' },
  buttonContainer: {},
  button: { width: '100%' },
});
