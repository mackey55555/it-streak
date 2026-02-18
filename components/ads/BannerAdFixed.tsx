/**
 * タブバー上に固定表示するバナー広告（タブレイアウト専用）
 * Expo Go ではマウントしないこと。
 *
 * 公式推奨: useForeground + ref で iOS WKWebView 復帰時にリロード
 * https://docs.page/invertase/react-native-google-mobile-ads/displaying-ads
 */
import { useRef } from 'react';
import { Platform } from 'react-native';
import { BannerAd, BannerAdSize, useForeground } from 'react-native-google-mobile-ads';
import { adUnitIds } from '../../lib/ads';

export function BannerAdFixed() {
  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  if (Platform.OS === 'web') return null;

  return (
    <BannerAd
      ref={bannerRef}
      unitId={adUnitIds.banner}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      onAdFailedToLoad={(error) => {
        console.error('[BannerAd] Failed to load:', error.code, error.message);
      }}
    />
  );
}
