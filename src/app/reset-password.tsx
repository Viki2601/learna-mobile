import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { friendlyAuthError, updatePassword } from "@/services/authService";
import { validatePassword } from "@/lib/validation";
import { AppText as Text } from "@/components/ui/AppText";

const strengthColors = ["bg-line", "bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwCheck = validatePassword(password);

  async function handleSubmit() {
    if (!pwCheck.valid) {
      setError(pwCheck.message);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(friendlyAuthError(err));
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
            <Text className="mt-2 text-[13px] text-muted">Set a new password for your account.</Text>

            {done ? (
              <View className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <Text className="text-[14px] font-semibold text-emerald-800">Password updated</Text>
                <Text className="mt-2 text-[12px] leading-[18px] text-emerald-700">
                  You can now use your new password to log in.
                </Text>
                <View className="mt-4">
                  <Button label="Back to login" onPress={() => router.replace("/(auth)/login")} />
                </View>
              </View>
            ) : (
              <View className="mt-8 gap-4">
                <View className="gap-1.5">
                  <Input
                    label="New password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    secure
                    autoComplete="password-new"
                    textContentType="newPassword"
                  />
                  {password.length > 0 ? (
                    <View className="flex-row items-center gap-2">
                      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <View className={`h-full rounded-full ${strengthColors[pwCheck.score]}`} style={{ width: `${pwCheck.score * 25}%` }} />
                      </View>
                      <Text className="text-[10px] font-semibold text-muted">{pwCheck.label}</Text>
                    </View>
                  ) : null}
                </View>
                <Input
                  label="Confirm new password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat your password"
                  secure
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                {error ? <Text className="text-[12px] text-rose-600">{error}</Text> : null}
                <Button label="Update password" onPress={handleSubmit} loading={loading} arrow />
              </View>
            )}

            <Pressable onPress={() => router.back()} className="mt-6 self-center" accessibilityRole="button">
              <Text className="text-[12px] text-muted">← Go back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
