import { ExpoConfig, ConfigContext } from 'expo/config';

// ---------------------------------------------------------------------------
// App Variant（ビルド時に APP_VARIANT 環境変数で切り替え）
// ---------------------------------------------------------------------------
const APP_VARIANT = (process.env.APP_VARIANT ?? 'default') as 'default' | 'ipass';

// ---------------------------------------------------------------------------
// バリアント別の設定
// ---------------------------------------------------------------------------
const variantConfig = {
  default: {
    name: 'IT Streak',
    slug: 'quizapp',
    scheme: 'quizapp',
    description:
      'IT資格試験対策のための、ゲーミフィケーション要素を取り入れた学習アプリ。ストリーク機能で毎日の学習を継続し、4択クイズで実力をアップ。',
    icon: './assets/icon.png',
    adaptiveIcon: './assets/adaptive-icon.png',
    splashIcon: './assets/splash-icon.png',
    bundleIdentifier: 'com.techguild.itstreak',
    packageName: 'com.techguild.itstreak',
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '85460826-6e7d-4356-a9cf-9fc93a6704d2',
    admobIosAppId: 'ca-app-pub-3556606235552037~5046764657',
    admobAndroidAppId: 'ca-app-pub-3556606235552037~5046764658',
  },
  ipass: {
    name: 'ITパスポート対策',
    slug: 'ipass-quizapp',
    scheme: 'ipass-quizapp',
    description:
      'ITパスポート試験対策の学習アプリ。ストリーク機能で毎日の学習を継続し、4択クイズで実力をアップ。',
    icon: './assets/ipass/icon.png',
    adaptiveIcon: './assets/ipass/adaptive-icon.png',
    splashIcon: './assets/ipass/splash-icon.png',
    bundleIdentifier: 'com.techguild.ipass',
    packageName: 'com.techguild.ipass',
    projectId: process.env.EXPO_PUBLIC_IPASS_PROJECT_ID || '',
    admobIosAppId: process.env.ADMOB_IPASS_IOS_APP_ID || 'ca-app-pub-3556606235552037~5046764657',
    admobAndroidAppId: process.env.ADMOB_IPASS_ANDROID_APP_ID || 'ca-app-pub-3556606235552037~5046764658',
  },
} as const;

const vc = variantConfig[APP_VARIANT];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: vc.name,
  slug: vc.slug,
  version: '1.1.7',
  description: vc.description,
  orientation: 'portrait',
  icon: vc.icon,
  userInterfaceStyle: 'light',
  splash: {
    image: vc.splashIcon,
    resizeMode: 'contain',
    backgroundColor: '#FEFCF9',
  },
  assetBundlePatterns: ['**/*'],
  updates: {
    enabled: true,
    url: `https://u.expo.dev/${vc.projectId}`,
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD' as const,
  },
  runtimeVersion: {
    policy: 'appVersion' as const,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: vc.bundleIdentifier,
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
      foregroundImage: vc.adaptiveIcon,
      backgroundColor: '#FEFCF9',
    },
    package: vc.packageName,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-updates',
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
        iosAppId: vc.admobIosAppId,
        androidAppId: vc.admobAndroidAppId,
        userTrackingUsageDescription:
          '広告のパーソナライズとアプリの改善のため、お客様に最適な広告を表示するために使用します。',
      },
    ],
  ],
  scheme: vc.scheme,
  extra: {
    appVariant: APP_VARIANT,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    eas: {
      projectId: vc.projectId,
    },
  },
});

