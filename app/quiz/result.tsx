/**
 * クイズ結果画面
 * Expo Go では広告をスキップし、Development Build ではインタースティシャル表示後に結果を表示
 */
import Constants from 'expo-constants';
import { lazy, Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { ResultContent } from '../../components/quiz/ResultContent';

const ResultWithInterstitial = lazy(() =>
  import('../../components/quiz/ResultWithInterstitial').then((m) => ({ default: m.ResultWithInterstitial }))
);

const isExpoGo = Constants.appOwnership === 'expo';

export default function ResultScreen() {
  // Expo Go では広告モジュールを読み込まない（ネイティブにないためクラッシュする）
  if (isExpoGo) {
    return <ResultContent readyToAnimate={true} />;
  }

  return (
    <Suspense
      fallback={
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="body" color={colors.textLight} style={styles.loadingText}>
              読み込み中...
            </Text>
          </View>
        </SafeAreaView>
      }
    >
      <ResultWithInterstitial />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { marginTop: spacing.sm },
});
