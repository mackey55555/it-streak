import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Card, ProgressBar, Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  
  // モックデータ
  const streakDays = 12;
  const todayProgress = 3;
  const dailyGoal = 5;
  const progressPercentage = todayProgress / dailyGoal;

  const handleStartLearning = () => {
    router.push('/quiz');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ストリーク表示 */}
        <Card style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Text variant="h1" style={styles.streakEmoji}>🔥</Text>
            <View style={styles.streakTextContainer}>
              <Text variant="h2" style={styles.streakNumber}>{streakDays}</Text>
              <Text variant="body" color={colors.textLight}>日連続！</Text>
            </View>
          </View>
        </Card>

        {/* 今日の進捗カード */}
        <Card style={styles.progressCard}>
          <Text variant="h3" style={styles.progressTitle}>今日の進捗</Text>
          <View style={styles.progressInfo}>
            <Text variant="h2" style={styles.progressText}>
              {todayProgress} / {dailyGoal} 問
            </Text>
          </View>
          <ProgressBar 
            progress={progressPercentage} 
            style={styles.progressBar}
          />
          <Text variant="caption" style={styles.progressCaption}>
            あと{dailyGoal - todayProgress}問で今日の目標達成！
          </Text>
        </Card>

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
    paddingBottom: spacing.xxl,
  },
  streakCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.streak,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
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
    fontSize: 36,
    lineHeight: 40,
  },
  progressCard: {
    marginBottom: spacing.xl,
  },
  progressTitle: {
    marginBottom: spacing.md,
  },
  progressInfo: {
    marginBottom: spacing.sm,
  },
  progressText: {
    color: colors.primary,
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
  },
  menuContent: {
    flex: 1,
    gap: spacing.xs,
  },
  menuDescription: {
    marginTop: spacing.xs,
  },
});

