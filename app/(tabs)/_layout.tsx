import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';

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
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="stats" 
        options={{
          title: '統計',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="settings" 
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}

