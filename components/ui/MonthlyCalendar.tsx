import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface MonthlyCalendarProps {
  data: Array<{ date: string; completed: boolean; answerCount: number }>;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color={colors.textLight}>
          データがありません
        </Text>
      </View>
    );
  }

  // 週ごとにグループ化（7日ごと）
  const weeks: Array<Array<{ date: string; completed: boolean; answerCount: number }>> = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // 色の強度を計算（回答数に基づく）
  const getIntensity = (answerCount: number) => {
    if (answerCount === 0) return 0;
    if (answerCount <= 5) return 1;
    if (answerCount <= 10) return 2;
    if (answerCount <= 20) return 3;
    return 4;
  };

  const getColor = (intensity: number) => {
    const baseColor = colors.primary;
    const opacity = intensity === 0 ? 0 : 0.2 + (intensity * 0.2);
    return baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
  };

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>月間学習カレンダー</Text>
      <View style={styles.calendarContainer}>
        {/* 曜日ヘッダー */}
        <View style={styles.weekRow}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text variant="caption" color={colors.textLight} style={styles.dayHeaderText}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* カレンダーグリッド */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const date = new Date(day.date);
              const dayNumber = date.getDate();
              const intensity = getIntensity(day.answerCount);
              const backgroundColor = getColor(intensity);
              
              // 今日の日付をローカル時間で取得
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const isToday = day.date === todayStr;

              return (
                <View
                  key={`${weekIndex}-${dayIndex}`}
                  style={[
                    styles.dayCell,
                    { backgroundColor },
                    isToday && styles.todayCell,
                  ]}
                >
                  <Text
                    variant="caption"
                    style={[
                      styles.dayNumber,
                      day.completed && styles.dayNumberCompleted,
                      isToday && styles.dayNumberToday,
                    ]}
                  >
                    {dayNumber}
                  </Text>
                  {day.answerCount > 0 && (
                    <View style={styles.dot} />
                  )}
                </View>
              );
            })}
            {/* 週が7日未満の場合、空のセルを追加 */}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
          </View>
        ))}
      </View>

      {/* 凡例 */}
      <View style={styles.legend}>
        <Text variant="caption" color={colors.textLight} style={styles.legendLabel}>
          凡例:
        </Text>
        <View style={styles.legendItems}>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <View key={intensity} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: getColor(intensity) },
                ]}
              />
              <Text variant="caption" color={colors.textLight} style={styles.legendText}>
                {intensity === 0 ? 'なし' : intensity === 1 ? '1-5問' : intensity === 2 ? '6-10問' : intensity === 3 ? '11-20問' : '21問以上'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
    color: colors.text,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumberCompleted: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayNumberToday: {
    color: colors.secondary,
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  legend: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legendLabel: {
    marginRight: spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.xs,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: 10,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
