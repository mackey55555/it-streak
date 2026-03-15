/**
 * AdMob 広告ユニットID
 * 環境分岐: __DEV__ のときテストID（TestIds 相当）、本番ビルドでは本番IDを使用。
 * ※ react-native-google-mobile-ads の TestIds は Expo Go でクラッシュするためここでは import せず、同値で定義。
 */
import { Platform } from 'react-native';
import { IS_IPASS } from './variant';

const useTestIds = __DEV__;

// テスト用ID（react-native-google-mobile-ads の TestIds と同じ値）
const TEST_IDS = Platform.select({
  android: {
    ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  },
  ios: {
    ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174',
    REWARDED: 'ca-app-pub-3940256099942544/1712485313',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
  },
  default: {
    ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  },
})!;

// 本番用ID（汎用版）
const PRODUCTION_DEFAULT = {
  BANNER: 'ca-app-pub-3556606235552037/4675664336',
  REWARDED: 'ca-app-pub-3556606235552037/5572252532',
  INTERSTITIAL: 'ca-app-pub-3556606235552037/5453958763',
};

// 本番用ID（ITパスポート版）
const PRODUCTION_IPASS = {
  BANNER: 'ca-app-pub-3556606235552037/8378161073',
  REWARDED: 'ca-app-pub-3556606235552037/8120108371',
  INTERSTITIAL: 'ca-app-pub-3556606235552037/1993683727',
};

const PRODUCTION = IS_IPASS ? PRODUCTION_IPASS : PRODUCTION_DEFAULT;

export const adUnitIds = {
  banner: useTestIds ? TEST_IDS.ADAPTIVE_BANNER : PRODUCTION.BANNER,
  rewarded: useTestIds ? TEST_IDS.REWARDED : PRODUCTION.REWARDED,
  interstitial: useTestIds ? TEST_IDS.INTERSTITIAL : PRODUCTION.INTERSTITIAL,
};

export const appIds = {
  ios: PRODUCTION.APP_ID_IOS,
  android: PRODUCTION.APP_ID_ANDROID,
};
