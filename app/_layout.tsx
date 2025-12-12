import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { user, loading } = useAuth();
  const { registerForPushNotifications } = usePushNotifications();
  const segments = useSegments();
  const router = useRouter();

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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

