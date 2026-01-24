import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { Text } from './Text';
import { colors, spacing } from '../../constants/theme';

interface LineChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  yAxisLabel?: string;
  color?: string;
  showArea?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - spacing.lg * 2 - spacing.xl * 2; // padding分を引く

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  yAxisLabel,
  color = colors.primary,
  showArea = false,
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color={colors.textLight}>
          データがありません
        </Text>
      </View>
    );
  }

  // react-native-gifted-charts用のデータ形式に変換
  // 横軸ラベルは適度な間隔で表示（最大6-7つ）
  const maxLabels = 7;
  const labelInterval = Math.max(1, Math.floor(data.length / maxLabels));
  
  // 今日の日付を取得（比較用）
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const chartData = data.map((item, index) => {
    const date = new Date(item.date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    
    // 当日はラベルを表示しない、それ以外は適度な間隔で表示
    const shouldShowLabel = !isToday && (index % labelInterval === 0 || index === data.length - 1);
    // ラベルを短くして省略されないようにする（日のみ表示）
    const labelText = shouldShowLabel ? `${date.getDate()}` : '';
    return {
      value: item.value,
      label: labelText,
      labelTextStyle: { 
        color: colors.textLight, 
        fontSize: 11,
        width: 30,
      },
    };
  });

  // Y軸の最大値を計算（少し余裕を持たせる）
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const yMax = Math.ceil(maxValue * 1.2);

  // チャートの幅を計算（データ数に応じて調整）
  const chartWidthCalculated = Math.max(chartWidth - spacing.lg * 2, 300);
  const spacingValue = chartWidthCalculated / Math.max(data.length - 1, 1);

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <GiftedLineChart
          data={chartData}
          width={chartWidthCalculated}
          height={200}
          color={color}
          thickness={2}
          curved
          areaChart={showArea}
          startFillColor={color + '30'}
          endFillColor={color + '10'}
          startOpacity={0.4}
          endOpacity={0.1}
          maxValue={yMax}
          yAxisTextStyle={{ color: colors.textLight, fontSize: 12 }}
          xAxisLabelTextStyle={{ 
            color: colors.textLight, 
            fontSize: 11,
            width: 40,
            textAlign: 'center',
          }}
          yAxisLabelSuffix={yAxisLabel || ''}
          hideYAxisText={false}
          spacing={spacingValue}
          initialSpacing={30}
          endSpacing={30}
          rulesColor={colors.border}
          rulesType="solid"
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          backgroundColor={colors.background}
          noOfSections={4}
          yAxisLabelWidth={50}
          hideRules={false}
          hideDataPoints={data.length > 30}
          xAxisLabelWidth={40}
          rotateLabel={false}
          textShiftY={-2}
          textShiftX={0}
          textFontSize={11}
          adjustToWidth={true}
        />
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
  chartContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
