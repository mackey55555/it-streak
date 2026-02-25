/**
 * ホーム画面用の広告セクション（ストリーク復活リワード広告ボタン）
 * Expo Go ではこのコンポーネントはマウントしないこと（react-native-google-mobile-ads が使えないため）
 */
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRewardedAd } from 'react-native-google-mobile-ads';
import { useEffect } from 'react';
import { Text } from '../ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { adUnitIds } from '../../lib/ads';

type Props = {
  reviveDaysRemaining: number;
  previousStreak: number;
  onEarnedReward: () => void;
};

export function HomeAdSection({ reviveDaysRemaining, previousStreak, onEarnedReward }: Props) {
  const rewardedAd = useRewardedAd(Platform.OS === 'web' ? null : adUnitIds.rewarded);

  useEffect(() => {
    if (rewardedAd.isEarnedReward) {
      onEarnedReward();
    }
  }, [rewardedAd.isEarnedReward, onEarnedReward]);

  const handleRevivePress = () => {
    if (rewardedAd.isLoaded) {
      rewardedAd.show();
    } else {
      rewardedAd.load();
      Alert.alert(
        '広告を読み込み中',
        'しばらくお待ちください。読み込み完了後、もう一度ボタンを押してください。'
      );
    }
  };

  if (Platform.OS === 'web') return null;
  if (reviveDaysRemaining <= 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="body" style={styles.motivationText}>
        {previousStreak}日連続の記録を復活させよう！
      </Text>
      <View style={styles.progressRow}>
        {Array.from({ length: reviveDaysRemaining }).map((_, i) => (
          <View key={`remaining-${i}`} style={styles.dotEmpty} />
        ))}
      </View>
      <Text variant="caption" style={styles.remainingText}>
        あと {reviveDaysRemaining} 回広告を見ると復活
      </Text>
      <TouchableOpacity
        style={styles.reviveButton}
        onPress={handleRevivePress}
        activeOpacity={0.7}
      >
        <Ionicons name="videocam-outline" size={20} color="#fff" style={styles.reviveIcon} />
        <Text variant="body" style={styles.reviveButtonText}>
          広告を見て1日分回復
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.streak + '15',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.streak + '30',
  },
  motivationText: {
    color: colors.streak,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dotEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.streak,
    backgroundColor: 'transparent',
  },
  remainingText: {
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  reviveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.streak,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  reviveIcon: {
    marginRight: spacing.sm,
  },
  reviveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
