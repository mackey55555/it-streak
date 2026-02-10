/**
 * タブバー上に固定表示するバナー広告（タブレイアウト専用）
 * Expo Go ではマウントしないこと。
 */
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adUnitIds } from '../../lib/ads';

export function BannerAdFixed() {
  if (Platform.OS === 'web') return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitIds.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: 'transparent',
  },
});
