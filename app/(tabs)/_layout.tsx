import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, StyleSheet } from 'react-native';
import { Suspense, lazy } from 'react';
import Constants from 'expo-constants';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { colors } from '../../constants/theme';
import { impactMedium } from '../../lib/haptics';

const isExpoGo = Constants.appOwnership === 'expo';

const BannerAdFixed = lazy(() =>
  import('../../components/ads/BannerAdFixed').then((m) => ({ default: m.BannerAdFixed }))
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 24,
          height: 72,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarButton: (props) => {
          const { onPress, ...rest } = props;
          return (
            <Pressable
              {...rest}
              onPress={(e) => {
                impactMedium();
                onPress?.(e);
              }}
            />
          );
        },
        tabBar: (props) => (
          <View style={styles.tabBarContainer}>
            {!isExpoGo && (
              <Suspense fallback={null}>
                <BannerAdFixed />
              </Suspense>
            )}
            <BottomTabBar {...props} />
          </View>
        ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="stats" 
        options={{
          title: '統計',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="settings" 
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});