import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { friendlyAuthError, signInWithEmail } from "@/services/authService";
import { validateEmail } from "@/lib/validation";
import { AppText as Text } from "@/components/ui/AppText";

export default function Login() {
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const goToApp = () => router.replace("/(tabs)");

  async function handleLogin() {
    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    if (emailErr) return;
    if (!password) {
      setFormError("Password is required.");
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      goToApp();
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-10">
            <Text className="text-[26px] font-bold tracking-[1.2px] text-ink">
              Learna<Text className="text-gold"> ✦</Text>
            </Text>
            <Text className="mt-2 text-[13px] text-muted">Welcome back. Let’s keep the streak going.</Text>

            {!configured ? (
              <View className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-[12px] leading-[18px] text-amber-800">
                  Auth is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file, then restart the dev server.
                </Text>
              </View>
            ) : null}

            <View className="mt-8 gap-4">
              <Input
                label="Email"
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(null); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={emailError}
              />
              <Input
                label="Password"
                value={password}
                onChangeText={(t) => { setPassword(t); setFormError(null); }}
                placeholder="Your password"
                secure
                autoComplete="password"
                textContentType="password"
              />

              {formError ? <Text className="text-[12px] text-rose-600">{formError}</Text> : null}

              <Link href="/(auth)/forgot-password" className="self-end text-[12px] font-semibold text-gold">
                Forgot password?
              </Link>

              <View className="mt-1 gap-3">
                <Button label="Log in" onPress={handleLogin} loading={loading} arrow />
                <GoogleSignInButton onSuccess={goToApp} />
              </View>
            </View>

            <View className="mt-10 flex-row items-center justify-center gap-1.5">
              <Text className="text-[13px] text-muted">New to Learna?</Text>
              <Link href="/(auth)/signup" className="text-[13px] font-semibold text-ink">Create an account</Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}