/**
 * クイズ結果の表示コンテンツ（広告表示の有無に依存しない共通UI）
 */
import { View, StyleSheet, Animated, useWindowDimensions, TouchableOpacity, Text as RNText, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text, Confetti, Character } from '../ui';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';
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
    if (percentage >= 80) return { icon: 'trophy', text: 'すごいにゃ！', color: colors.secondary, characterType: 'result-high' as const, characterSize: 'large' as const };
    if (percentage >= 60) return { icon: 'thumbs-up', text: 'いい調子にゃ！', color: colors.primary, characterType: 'result-good' as const, characterSize: 'medium' as const };
    if (percentage >= 40) return { icon: 'fitness', text: 'もう少しにゃ！', color: colors.streak, characterType: 'result-medium' as const, characterSize: 'medium' as const };
    return { icon: 'book', text: '復習するにゃ！', color: colors.textLight, characterType: 'result-low' as const, characterSize: 'medium' as const };
  };

  const message = getMessage();
  // 小画面では characterSize を1段階下げる
  const characterSize = scale < 0.85
    ? (message.characterSize === 'large' ? 'medium' : 'small')
    : message.characterSize;
  const streakMessage = currentStreak > 1 ? `${currentStreak}日連続達成中！` : null;

  const handleGoHome = () => router.replace('/(tabs)');
  const handleRetry = () => router.replace('/quiz');

  const handleShareOnX = () => {
    const emoji = percentage === 100 ? '🎉' : percentage >= 80 ? '✨' : percentage >= 60 ? '💪' : '📖';
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const catMessage = percentage === 100 ? pick([
      'パーフェクトだにゃ！🐱✨',
      '満点にゃ！天才だにゃ〜！🐱✨',
      '完璧だにゃ！誇っていいにゃ！🐱✨',
      'すごすぎるにゃ！尊敬するにゃ！🐱✨',
      '全問正解！神だにゃ〜！🐱✨',
      'ミスなしだにゃ！かっこいいにゃ！🐱✨',
      '100点満点だにゃ！最高にゃ！🐱✨',
      'パーフェクト達成だにゃ！感動にゃ！🐱✨',
      '文句なしの満点にゃ！🐱✨',
      '全問正解とは…恐れ入ったにゃ！🐱✨',
    ]) : percentage >= 80 ? pick([
      'すごいにゃ！この調子だにゃ！🐱',
      'さすがだにゃ〜！🐱',
      'かなりデキるにゃ！🐱',
      'いい点数だにゃ！自信もっていいにゃ！🐱',
      '実力がついてきたにゃ！🐱',
      'お見事だにゃ〜！🐱',
      '高得点にゃ！頼もしいにゃ！🐱',
      'バッチリだにゃ！合格間違いなしにゃ！🐱',
      'ここまでできれば上出来にゃ！🐱',
      '安定感がすごいにゃ！🐱',
    ]) : percentage >= 60 ? pick([
      'いい感じだにゃ！🐱',
      'まずまずだにゃ！あと一歩にゃ！🐱',
      '着実に成長してるにゃ！🐱',
      '悪くないにゃ！次はもっといけるにゃ！🐱',
      'この調子で続けるにゃ！🐱',
      '合格ラインが見えてきたにゃ！🐱',
      'コツコツが大事だにゃ！🐱',
      'あとちょっとで高得点にゃ！🐱',
      'がんばってるにゃ〜！🐱',
      '伸びしろたっぷりにゃ！🐱',
    ]) : pick([
      '次はもっとがんばるにゃ！🐱',
      'ドンマイにゃ！復習するにゃ！🐱',
      '大丈夫にゃ！繰り返せば覚えるにゃ！🐱',
      'まだまだこれからにゃ！🐱',
      'くじけないにゃ！応援してるにゃ！🐱',
      '苦手を見つけたにゃ！チャンスにゃ！🐱',
      '失敗は成功のもとだにゃ！🐱',
      '復習あるのみにゃ！一緒にがんばるにゃ！🐱',
      'ここから巻き返すにゃ！🐱',
      '諦めなければ大丈夫にゃ！🐱',
    ]);
    const lines = [
      `IT Streakでの学習記録📚`,
      `${total}問中${correct}問正解（正答率${percentage}%）${emoji}`,
      `「${catMessage}」`,
      ...(currentStreak > 0 ? [`🔥現在のストリーク：${currentStreak}日連続`] : []),
      '',
      '#基本情報技術者試験 #IT資格勉強',
      'https://apps.apple.com/app/id6758322757',
    ];
    const text = lines.join('\n');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  // スケールに応じた動的スタイル
  const scoreFontSize = Math.round(56 * scale);
  const scoreLineHeight = Math.round(64 * scale);

  const s = (v: number) => Math.round(v * scale);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Confetti visible={showConfetti} duration={3000} />
      <View style={[styles.content, { padding: s(spacing.xl), paddingBottom: s(spacing.xxl) }]}>
        <Animated.View style={[styles.resultCardWrapper, { marginBottom: s(spacing.lg), marginTop: s(spacing.sm) }, { transform: [{ scale: cardScale }] }]}>
          <Card style={{ ...styles.resultCard, paddingTop: s(spacing.xxl), paddingBottom: s(spacing.xl) }}>
            <TouchableOpacity style={styles.closeButton} onPress={handleGoHome} activeOpacity={0.7} accessibilityLabel="閉じる" accessibilityRole="button">
              <Ionicons name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
            <View style={[styles.iconContainer, { marginBottom: s(spacing.sm) }]}>
              <Character
                type={message.characterType}
                size={characterSize}
                animated={true}
                style={styles.characterIcon}
              />
            </View>
            <Text variant="h2" style={{ ...styles.message, color: message.color, marginBottom: s(spacing.lg) }}>{message.text}</Text>
            <Animated.View style={[styles.scoreContainer, { opacity: scoreOpacity, marginTop: s(spacing.sm), marginBottom: s(spacing.xs), minHeight: s(60) }]}>
              <Text variant="h1" style={{ ...styles.score, fontSize: scoreFontSize, lineHeight: scoreLineHeight }}>{correct}</Text>
              <Text variant="h3" style={{ ...styles.scoreDivider, lineHeight: scoreLineHeight }}>/</Text>
              <Text variant="h2" style={{ ...styles.totalScore, lineHeight: Math.round(40 * scale) }}>{total}</Text>
            </Animated.View>
            <View style={[styles.xpRow, { marginTop: s(spacing.md) }]}>
              <Text variant="body" color={colors.textLight}>獲得XP</Text>
              <View style={styles.xpValueContainer}>
                <Text variant="h3" style={styles.xpValue}>+{xp}</Text>
              </View>
            </View>
            {streakMessage && (
              <View style={[styles.streakMessageContainer, { marginTop: s(spacing.md) }]}>
                <Character type="streak-celebration" size="small" animated={true} style={styles.streakCharacter} />
                <Ionicons name="flame" size={20} color={colors.streak} style={styles.streakIcon} />
                <Text variant="body" style={styles.streakMessage}>{streakMessage}</Text>
              </View>
            )}
          </Card>
        </Animated.View>
        <View style={[styles.buttonContainer, { gap: s(spacing.sm) }]}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareOnX} activeOpacity={0.8} accessibilityLabel="Xでシェア" accessibilityRole="button">
            <RNText style={styles.shareButtonText}>𝕏 でシェア</RNText>
          </TouchableOpacity>
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
  resultCard: { alignItems: 'center', paddingHorizontal: spacing.xl, overflow: 'visible' as any, position: 'relative' as const },
  closeButton: { position: 'absolute' as const, top: spacing.md, right: spacing.md, zIndex: 1, padding: spacing.xs },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  characterIcon: { marginBottom: spacing.xs },
  message: {},
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  score: { color: colors.primary, fontWeight: 'bold' },
  scoreDivider: { marginHorizontal: spacing.sm, color: colors.textLight },
  totalScore: { color: colors.textLight },
  xpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  xpValueContainer: { backgroundColor: colors.secondary + '20', borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  xpValue: { color: colors.secondary, fontWeight: 'bold' },
  streakMessageContainer: { backgroundColor: colors.streak + '20', borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  streakCharacter: { marginRight: spacing.xs },
  streakIcon: { marginRight: spacing.xs },
  streakMessage: { color: colors.streak, fontWeight: '600' },
  shareButton: {
    backgroundColor: '#000000',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: 'bold' as const,
  },
  buttonContainer: {},
  button: { width: '100%' },
});
