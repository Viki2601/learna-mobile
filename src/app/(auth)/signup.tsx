import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { friendlyAuthError, signUpWithEmail } from "@/services/authService";
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/validation";
import { AppText as Text } from "@/components/ui/AppText";

const strengthColors = ["bg-line", "bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

export default function Signup() {
  const { configured } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goToApp = () => router.replace("/(tabs)");

  const pwCheck = validatePassword(password);

  async function handleSignup() {
    const nextErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password).valid ? null : validatePassword(password).message,
      confirm: validateConfirmPassword(password, confirm),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setFormError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const session = await signUpWithEmail(fullName, email, password);
      if (session) {
        goToApp();
      } else {
        setInfoMessage("Almost there — check your inbox to confirm your email, then log in.");
      }
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
            <Text className="mt-2 text-[13px] text-muted">Create your account. It takes less than a minute.</Text>

            {!configured ? (
              <View className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-[12px] leading-[18px] text-amber-800">
                  Auth is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file, then restart the dev server.
                </Text>
              </View>
            ) : null}

            <View className="mt-8 gap-4">
              <Input
                label="Full name"
                value={fullName}
                onChangeText={(t) => setFullName(t)}
                placeholder="Ada Lovelace"
                autoComplete="name"
                textContentType="name"
                error={errors.fullName}
              />
              <Input
                label="Email"
                value={email}
                onChangeText={(t) => setEmail(t)}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={errors.email}
              />
              <View className="gap-1.5">
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secure
                  autoComplete="password-new"
                  textContentType="newPassword"
                  error={errors.password}
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
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat your password"
                secure
                autoComplete="password-new"
                textContentType="newPassword"
                error={errors.confirm}
              />

              {formError ? <Text className="text-[12px] text-rose-600">{formError}</Text> : null}
              {infoMessage ? <Text className="text-[12px] leading-[17px] text-emerald-700">{infoMessage}</Text> : null}

              <View className="mt-1 gap-3">
                <Button label="Create account" onPress={handleSignup} loading={loading} arrow />
                <GoogleSignInButton onSuccess={goToApp} />
              </View>
            </View>

            <View className="mt-10 flex-row items-center justify-center gap-1.5">
              <Text className="text-[13px] text-muted">Already have an account?</Text>
              <Link href="/(auth)/login" className="text-[13px] font-semibold text-ink">
                Log in
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
