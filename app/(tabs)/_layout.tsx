import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'ホーム',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen 
        name="stats" 
        options={{
          title: '統計',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen 
        name="settings" 
        options={{
          title: '設定',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}

