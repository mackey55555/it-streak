import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

// スプラッシュスクリーンの自動非表示を防ぐ
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, loading } = useAuth();
  const { registerForPushNotifications } = usePushNotifications();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  // アプリの準備が整ったかどうかを管理（認証読み込み完了 + 最低2秒経過）
  useEffect(() => {
    async function prepare() {
      try {
        // 最低2秒間スプラッシュスクリーンを表示
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // 認証の読み込みが完了し、かつ2秒経過したら準備完了
        if (!loading) {
          setAppIsReady(true);
        }
      }
    }

    if (!loading) {
      prepare();
    }
  }, [loading]);

  // アプリの準備が整ったらスプラッシュスクリーンを非表示
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // 未認証でauth以外にいる場合、ログイン画面へ
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // 認証済みでauth画面にいる場合、ホームへ
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // 認証済みユーザーがいる場合、Push通知を登録
  useEffect(() => {
    if (user && !loading) {
      registerForPushNotifications();
    }
  }, [user, loading]);

  if (!appIsReady || loading) {
    return null; // スプラッシュスクリーンが表示されている間は何も表示しない
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="quiz" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

