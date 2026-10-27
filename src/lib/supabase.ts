import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const isServer = typeof window === "undefined";

const storage = {
  getItem: (key: string) =>
    isServer ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    isServer ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    isServer ? Promise.resolve() : AsyncStorage.removeItem(key),
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: false,
      },
    })
    : (null as unknown as ReturnType<typeof createClient>);