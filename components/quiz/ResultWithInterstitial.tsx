/**
 * インタースティシャル広告表示後に結果コンテンツを表示するラッパー
 * Expo Go ではこのコンポーネントは読み込まない（react-native-google-mobile-ads が使えないため）
 */
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { Text } from '../ui';
import { colors, spacing } from '../../constants/theme';
import { adUnitIds } from '../../lib/ads';
import { ResultContent } from './ResultContent';
import { useEffect, useState, useRef } from 'react';

export function ResultWithInterstitial() {
  const interstitial = useInterstitialAd(Platform.OS === 'web' ? null : adUnitIds.interstitial);
  const [showContent, setShowContent] = useState(Platform.OS === 'web');
  const hasTriedShowAd = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (interstitial.isClosed) setShowContent(true);
  }, [interstitial.isClosed]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (interstitial.error && !showContent) setShowContent(true);
  }, [interstitial.error, showContent]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    interstitial.load();
    const fallback = setTimeout(() => setShowContent(true), 5000);
    return () => clearTimeout(fallback);
  }, [interstitial.load]);

  useEffect(() => {
    if (Platform.OS === 'web' || showContent || hasTriedShowAd.current) return;
    if (interstitial.isLoaded) {
      hasTriedShowAd.current = true;
      interstitial.show();
    }
  }, [interstitial.isLoaded, showContent, interstitial.show]);

  if (!showContent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color={colors.textLight} style={styles.loadingText}>
            読み込み中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <ResultContent showContent={true} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { marginTop: spacing.sm },
});
