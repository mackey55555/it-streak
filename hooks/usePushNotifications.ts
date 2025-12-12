import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// 通知の表示方法を設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // 通知の受信リスナー
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // 通知のタップリスナー
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Push通知の登録
  const registerForPushNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // 実機でない場合はスキップ
      if (!Device.isDevice) {
        console.log('Push notifications are only available on physical devices');
        return null;
      }

      // 既存の権限を確認
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 権限がない場合はリクエスト
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('通知の許可が必要です');
        return null;
      }

      // Expo Push Tokenを取得
      // projectIdは省略可能（Expo Goや開発ビルドでは自動検出）
      const token = await Notifications.getExpoPushTokenAsync();

      setExpoPushToken(token.data);

      // Supabaseに保存
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ push_token: token.data })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error saving push token:', updateError);
        }
      }

      // Android用のチャンネル設定
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error: any) {
      console.error('Error registering for push notifications:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ローカル通知のスケジュール
  const scheduleLocalNotification = async (title: string, body: string, trigger: Date) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // すべての通知をキャンセル
  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  return {
    expoPushToken,
    loading,
    error,
    registerForPushNotifications,
    scheduleLocalNotification,
    cancelAllNotifications,
  };
};

