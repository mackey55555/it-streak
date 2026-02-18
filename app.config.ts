import { ExpoConfig, ConfigContext } from 'expo/config';

// AdMob App ID
const ADMOB_IOS_APP_ID = 'ca-app-pub-3556606235552037~5046764657';
const ADMOB_ANDROID_APP_ID = 'ca-app-pub-3556606235552037~5046764658';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'IT Streak',
  slug: 'quizapp',
  version: '1.1.1',
  description: '基本情報技術者試験対策のための、ゲーミフィケーション要素を取り入れた学習アプリ。ストリーク機能で毎日の学習を継続し、4択クイズで実力をアップ。',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FEFCF9',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.techguild.itstreak',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSUserNotificationsUsageDescription: '学習リマインダーを受け取るために通知の許可が必要です。',
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FEFCF9',
    },
    package: 'com.techguild.itstreak',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        color: '#7A8A70',
        sounds: [],
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: ADMOB_IOS_APP_ID,
        androidAppId: ADMOB_ANDROID_APP_ID,
        userTrackingUsageDescription:
          '広告のパーソナライズとアプリの改善のため、お客様に最適な広告を表示するために使用します。',
      },
    ],
  ],
  scheme: 'quizapp',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '85460826-6e7d-4356-a9cf-9fc93a6704d2',
    },
  },
});

