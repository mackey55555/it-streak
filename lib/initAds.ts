/**
 * AdMob 初期化と iOS ATT（App Tracking Transparency）リクエスト
 * ネイティブビルド時のみ実行（Webではスキップ）
 */
import { Platform } from 'react-native';

export async function initializeAdsAndRequestATT(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const { default: mobileAds } = await import('react-native-google-mobile-ads');
    await mobileAds().initialize();
  } catch (e) {
    console.warn('AdMob initialize skipped:', e);
  }

  if (Platform.OS !== 'ios') return;

  try {
    const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    const { status } = await requestTrackingPermissionsAsync();
    if (status === 'granted') {
      // ユーザーがトラッキングを許可した場合の処理（必要に応じて）
    }
  } catch (e) {
    console.warn('ATT request skipped:', e);
  }
}
