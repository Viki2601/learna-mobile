import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { friendlyAuthError, sendPasswordReset } from "@/services/authService";
import { validateEmail } from "@/lib/validation";
import { AppText as Text } from "@/components/ui/AppText";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(friendlyAuthError(e));
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
            <Text className="mt-2 text-[13px] leading-[19px] text-muted">
              Enter your email and we’ll send you a link to reset your password.
            </Text>

            {sent ? (
              <View className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <Text className="text-[14px] font-semibold text-emerald-800">Check your inbox</Text>
                <Text className="mt-2 text-[12px] leading-[18px] text-emerald-700">
                  If an account exists for {email.trim()}, a reset link is on its way.
                </Text>
              </View>
            ) : (
              <View className="mt-8 gap-4">
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={emailError}
                />
                {error ? <Text className="text-[12px] text-rose-600">{error}</Text> : null}
                <Button label="Send reset link" onPress={handleSubmit} loading={loading} arrow />
              </View>
            )}

            <View className="mt-10 flex-row items-center justify-center gap-1.5">
              <Text className="text-[13px] text-muted">Remembered it?</Text>
              <Link href="/(auth)/login" className="text-[13px] font-semibold text-ink">
                Back to login
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
