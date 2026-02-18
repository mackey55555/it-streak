/**
 * ホーム画面用の広告セクション（ストリーク復活リワード広告ボタンのみ。バナーはタブレイアウトで固定表示）
 * Expo Go ではこのコンポーネントはマウントしないこと（react-native-google-mobile-ads が使えないため）
 */
import { StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRewardedAd } from 'react-native-google-mobile-ads';
import { useEffect } from 'react';
import { Text } from '../ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { adUnitIds } from '../../lib/ads';

type Props = {
  currentStreak: number;
  onEarnedReward: () => void;
};

export function HomeAdSection({ currentStreak, onEarnedReward }: Props) {
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

  return (
    <>
      {/* ストリークが切れている場合のみ「広告で復活」ボタン */}
      {currentStreak === 0 && (
        <TouchableOpacity
          style={styles.reviveStreakButton}
          onPress={handleRevivePress}
          activeOpacity={0.7}
        >
          <Ionicons name="videocam-outline" size={20} color={colors.primary} style={styles.reviveStreakIcon} />
          <Text variant="body" style={styles.reviveStreakText}>
            広告を見てストリークを復活
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  reviveStreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviveStreakIcon: {
    marginRight: spacing.sm,
  },
  reviveStreakText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
