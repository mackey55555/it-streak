/**
 * スロット・ストリーク・過去送信履歴に基づいて1件のメッセージを選択し、変数を置換する（PUSH_NOTIFICATION_DESIGN.md 準拠）
 */

import type { SlotType, PushMessage } from './messages.ts';
import { MESSAGES } from './messages.ts';

export interface SelectMessageInput {
  slot: SlotType;
  streak: number;
  dailyGoal: number;
  todayQuestionsAnswered: number;
  recentMessageIds: string[]; // 過去3日間に送った message_id 一覧
}

function getPriorityForSlot(slot: SlotType, streak: number): 'veryHigh' | 'high' | 'medium' | 'low' | null {
  switch (slot) {
    case 'morning':
      return streak >= 5 ? 'high' : 'low';
    case 'lunch':
      return null; // 別ロジック（requiresGoal）
    case 'evening':
      return streak >= 7 ? 'high' : 'low';
    case 'night':
      if (streak >= 10) return 'veryHigh';
      if (streak >= 3) return 'medium';
      return 'low';
    case 'final':
      if (streak >= 7) return 'high';
      if (streak >= 3) return 'medium';
      return 'low';
    case 'deadline':
      if (streak >= 30) return 'veryHigh';
      if (streak >= 7) return 'high';
      return 'low';
    case 'recovery':
      return null;
    default:
      return null;
  }
}

/**
 * deadline は設計書で streak 帯ごとに候補が明示されているため、優先度ではなく streak 帯でフィルタ
 */
function filterDeadlineByStreak(messages: PushMessage[], streak: number): PushMessage[] {
  if (streak >= 30) {
    return messages.filter((m) => m.id === 'D02' || m.id === 'D05');
  }
  if (streak >= 7) {
    return messages.filter((m) => m.id === 'D02' || m.id === 'D04' || m.id === 'D05');
  }
  return messages.filter((m) => m.id === 'D01' || m.id === 'D03' || m.id === 'D06');
}

function filterByPriority(messages: PushMessage[], priority: 'veryHigh' | 'high' | 'medium' | 'low'): PushMessage[] {
  return messages.filter((m) => m.streakPriority === priority);
}

function filterByRecent(candidates: PushMessage[], recentMessageIds: string[]): PushMessage[] {
  if (recentMessageIds.length === 0) return candidates;
  const sent = new Set(recentMessageIds);
  const filtered = candidates.filter((m) => !sent.has(m.id));
  return filtered.length > 0 ? filtered : candidates;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function selectMessage(input: SelectMessageInput): PushMessage {
  const { slot, streak, dailyGoal, todayQuestionsAnswered, recentMessageIds } = input;
  let candidates = [...MESSAGES[slot]];

  if (slot === 'deadline') {
    candidates = filterDeadlineByStreak(candidates, streak);
  } else if (slot === 'lunch') {
    if (dailyGoal > 0) {
      const withGoal = candidates.filter((m) => m.requiresGoal === true);
      const withoutGoal = candidates.filter((m) => m.requiresGoal !== true);
      candidates = withGoal.length > 0 ? [...withGoal, ...withoutGoal] : candidates;
    } else {
      candidates = candidates.filter((m) => !m.requiresGoal);
    }
  } else if (slot !== 'recovery') {
    const priority = getPriorityForSlot(slot, streak);
    if (priority) {
      const byPriority = filterByPriority(candidates, priority);
      if (byPriority.length > 0) candidates = byPriority;
    }
  }

  candidates = filterByRecent(candidates, recentMessageIds);
  return pickRandom(candidates);
}

export function substituteVariables(
  title: string,
  body: string,
  streak: number,
  remaining: number
): { title: string; body: string } {
  const replace = (s: string) =>
    s.replace(/\{streak\}/g, String(streak)).replace(/\{remaining\}/g, String(remaining));
  return {
    title: replace(title),
    body: replace(body),
  };
}
