import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// EAS Buildでは、環境変数はapp.config.tsのextraセクションから読み込まれる
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Supabase URL and Anon Key are required. Please set them in EAS Secrets or .env.local';
  console.error(errorMessage);
  console.error('supabaseUrl:', supabaseUrl ? 'set' : 'missing');
  console.error('supabaseAnonKey:', supabaseAnonKey ? 'set' : 'missing');
  console.error('Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

