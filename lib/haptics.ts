/**
 * ハプティクス（バイブレーション）の共通ユーティリティ
 * Web・未対応環境ではエラーを握りつぶして安全に動作
 */
import * as Haptics from 'expo-haptics';

/** ボタン押下など軽いタップ用 */
export async function impactLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Web・未対応環境では無視
  }
}

/** やや強めのフィードバック用 */
export async function impactMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Web・未対応環境では無視
  }
}

/** 正解・成功時 */
export async function notificationSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Web・未対応環境では無視
  }
}

/** 不正解・エラー時 */
export async function notificationError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Web・未対応環境では無視
  }
}

/** 警告時 */
export async function notificationWarning(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Web・未対応環境では無視
  }
}

/** 選択肢タップなど軽い選択フィードバック用 */
export async function selection(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Web・未対応環境では無視
  }
}
