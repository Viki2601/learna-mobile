import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { completeOAuthRedirect, getTrackedAuthUrl, OAuthRedirectError, subscribeAuthUrl } from "@/lib/oauth";
import { nextOnboardingStep } from "@/services/profileService";
import { friendlyAuthError } from "@/services/authService";
import { AppText as Text } from "@/components/ui/AppText";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_code?: string; error_description?: string }>();
  const { session, profile, profileLoaded } = useAuth();
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(() => getTrackedAuthUrl());
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => subscribeAuthUrl(setSourceUrl), []);

  const queryError = first(params.error_code) ?? first(params.error);
  const error = queryError ? first(params.error_description) ?? "Google sign-in failed. Please try again." : asyncError;

  useEffect(() => {
    if (session || error) return;

    const code = first(params.code);
    const url = sourceUrl ?? (code ? `auth-callback?code=${encodeURIComponent(code)}` : null);
    if (!url || attemptedRef.current === url) return;

    attemptedRef.current = url;
    completeOAuthRedirect(url).catch((err) => { setAsyncError(err instanceof OAuthRedirectError ? err.message : friendlyAuthError(err)); });
  }, [session, error, sourceUrl, params]);

  useEffect(() => {
    if (!session || !profileLoaded || error) return;

    const step = nextOnboardingStep(profile);
    if (step === "status") router.replace("/(onboarding)/status");
    else if (step === "goals") router.replace("/(onboarding)/goals");
    else if (step === "technologies") router.replace("/(onboarding)/technologies");
    else router.replace("/(tabs)");
  }, [session, profile, profileLoaded, error]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-paper px-8">
        <View className="items-center gap-2">
          <Text className="text-center text-[15px] font-semibold text-ink">{error}</Text>
          <Text className="text-center text-[13px] text-muted">You can try signing in again.</Text>
        </View>
        <View className="mt-6">
          <Button label="Back to sign in" onPress={() => router.replace("/(auth)/login")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-paper">
      <ActivityIndicator size="large" color="#B8860B" />
      <Text className="mt-4 text-[14px] text-muted">Finishing sign-in…</Text>
    </SafeAreaView>
  );
}