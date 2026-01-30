/**
 * プッシュ通知メッセージ定義（PUSH_NOTIFICATION_DESIGN.md 準拠）
 */

export type SlotType =
  | 'morning'
  | 'lunch'
  | 'evening'
  | 'night'
  | 'final'
  | 'deadline'
  | 'recovery';

export type StreakPriority = 'veryHigh' | 'high' | 'medium' | 'low';

export interface PushMessage {
  id: string;
  title: string;
  body: string;
  streakPriority?: StreakPriority;
  requiresGoal?: boolean;
}

export const MESSAGES: Record<SlotType, PushMessage[]> = {
  morning: [
    { id: 'M01', title: '🌅 おはよう！', body: '今日も{streak}日目を積み上げよう！', streakPriority: 'high' },
    { id: 'M02', title: '☀️ 新しい1日！', body: '朝の5分が合格への近道だよ', streakPriority: 'low' },
    { id: 'M03', title: '🐱 すとりーより', body: 'おはよ！今日も一緒に頑張ろうね', streakPriority: 'low' },
    { id: 'M04', title: '📚 朝活のチャンス', body: '通勤前にサクッと1問どう？', streakPriority: 'low' },
    { id: 'M05', title: '🔥 {streak}日連続！', body: 'この調子で今日も続けよう！', streakPriority: 'high' },
    { id: 'M06', title: '💪 Good Morning!', body: 'IT資格、今日も一歩前進しよう', streakPriority: 'low' },
  ],
  lunch: [
    { id: 'L01', title: '🍱 ランチタイム！', body: '食後の3分で1問解いてみない？' },
    { id: 'L02', title: '☕ 休憩中？', body: 'ちょっとだけIT Streakやろ！' },
    { id: 'L03', title: '🐱 すとりーだよ', body: 'お昼休み、一緒に勉強しよ？' },
    { id: 'L04', title: '📱 スキマ時間に', body: '今日の学習、まだ間に合うよ！' },
    { id: 'L05', title: '🎯 今日の目標', body: 'あと{remaining}問で達成！', requiresGoal: true },
  ],
  evening: [
    { id: 'E01', title: '🏠 おかえり！', body: '今日の学習、まだだよ？', streakPriority: 'low' },
    { id: 'E02', title: '📱 忘れてない？', body: '{streak}日のストリーク、守ろう！', streakPriority: 'high' },
    { id: 'E03', title: '🐱 すとりーより', body: '今日まだ会えてないよ...？', streakPriority: 'low' },
    { id: 'E04', title: '⏰ 夜になる前に', body: '5問だけやっておこう！', streakPriority: 'low' },
    { id: 'E05', title: '🔥 ストリーク継続中', body: 'あと5時間、今のうちに！', streakPriority: 'high' },
    { id: 'E06', title: '💼 お疲れさま！', body: '疲れた日こそ1問だけ！', streakPriority: 'low' },
  ],
  night: [
    { id: 'N01', title: '⚠️ あと2時間半！', body: '{streak}日のストリークが...！', streakPriority: 'veryHigh' },
    { id: 'N02', title: '😿 すとりーが心配', body: '今日の学習、忘れてない...？', streakPriority: 'medium' },
    { id: 'N03', title: '🔥 ストリーク危機', body: 'まだ間に合う！今すぐタップ！', streakPriority: 'low' },
    { id: 'N04', title: '⏰ 時間がないよ', body: '{streak}日間の努力、無駄にしないで', streakPriority: 'veryHigh' },
    { id: 'N05', title: '📉 このままだと...', body: 'ストリークがリセットされちゃう', streakPriority: 'veryHigh' },
    { id: 'N06', title: '🐱 すとりーより', body: 'ねえ、今日も頑張ったって言いたいな...', streakPriority: 'low' },
  ],
  final: [
    { id: 'F01', title: '🚨 あと45分！', body: '{streak}日のストリーク、消えちゃう！', streakPriority: 'high' },
    { id: 'F02', title: '😭 すとりーより', body: 'お願い...今日が終わっちゃう...', streakPriority: 'medium' },
    { id: 'F03', title: '⏰ ラストチャンス！', body: '1問だけでいい、タップして！', streakPriority: 'low' },
    { id: 'F04', title: '💔 {streak}日間が...', body: 'あと少しで全部消えちゃうよ', streakPriority: 'high' },
    { id: 'F05', title: '🆘 緊急！', body: '今すぐ開いて！間に合う！', streakPriority: 'low' },
    { id: 'F06', title: '🐱 すとりー泣いてる', body: '今日も一緒に頑張りたかったのに...', streakPriority: 'medium' },
  ],
  deadline: [
    { id: 'D01', title: '🚨 あと10分！！', body: '今すぐ開いて！！', streakPriority: 'low' },
    { id: 'D02', title: '😭 お願い...！', body: '{streak}日が消えちゃう...！', streakPriority: 'high' },
    { id: 'D03', title: '⏰ 10分で終わる', body: '1問だけ！今すぐ！', streakPriority: 'low' },
    { id: 'D04', title: '💔 すとりーより', body: '最後のお願い...開いて...', streakPriority: 'medium' },
    { id: 'D05', title: '🆘 {streak}日間！', body: '全部消える前に...！', streakPriority: 'high' },
    { id: 'D06', title: '😿 間に合って...！', body: 'あと10分しかないよ...！', streakPriority: 'low' },
  ],
  recovery: [
    { id: 'R01', title: '🐱 すとりーより', body: 'また一緒に始めよう！待ってるよ' },
    { id: 'R02', title: '🌱 新しいスタート！', body: '今日から新しいストリークを作ろう' },
    { id: 'R03', title: '💪 大丈夫！', body: '何度でもやり直せる！今日から再開しよう' },
  ],
};
