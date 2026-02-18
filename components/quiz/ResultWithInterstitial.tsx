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
  const [adDone, setAdDone] = useState(Platform.OS === 'web');
  const [readyToAnimate, setReadyToAnimate] = useState(Platform.OS === 'web');
  const hasTriedShowAd = useRef(false);
  const adIsShowing = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallback = () => {
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  };

  // 広告が閉じられたとき → 広告完了
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (interstitial.isClosed) {
      adIsShowing.current = false;
      clearFallback();
      setAdDone(true);
    }
  }, [interstitial.isClosed]);

  // 広告エラー時（表示中のエラーでなければスキップ扱い）
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (interstitial.error && !adIsShowing.current) {
      clearFallback();
      setAdDone(true);
    }
  }, [interstitial.error]);

  // マウント時にインタースティシャルを読み込み
  // 5秒以内に読み込めなければスキップ（ただし広告表示開始後はキャンセル）
  useEffect(() => {
    if (Platform.OS === 'web') return;
    interstitial.load();
    fallbackTimer.current = setTimeout(() => {
      if (!adIsShowing.current) {
        setAdDone(true);
      }
    }, 5000);
    return clearFallback;
  }, [interstitial.load]);

  // 広告が読み込まれたら表示（1回だけ）
  useEffect(() => {
    if (Platform.OS === 'web' || adDone || hasTriedShowAd.current) return;
    if (interstitial.isLoaded) {
      hasTriedShowAd.current = true;
      adIsShowing.current = true;
      clearFallback();
      interstitial.show();
    }
  }, [interstitial.isLoaded, adDone, interstitial.show]);

  // adDone になったらアニメーション開始（広告フェードアウトの余裕を持つ）
  useEffect(() => {
    if (!adDone || readyToAnimate) return;
    const timer = setTimeout(() => setReadyToAnimate(true), 400);
    return () => clearTimeout(timer);
  }, [adDone, readyToAnimate]);

  if (!adDone) {
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

  return <ResultContent readyToAnimate={readyToAnimate} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { marginTop: spacing.sm },
});
