import Constants from 'expo-constants';

export type AppVariant = 'default' | 'ipass';

export const APP_VARIANT: AppVariant =
  (Constants.expoConfig?.extra?.appVariant as AppVariant) ?? 'default';

export const IS_IPASS = APP_VARIANT === 'ipass';

// ITパスポート試験の固定ID（setup-ipass.ts / import-questions.ts と同じ値）
export const IPASS_EXAM_ID = '00000000-0000-0000-0000-000000000003';
