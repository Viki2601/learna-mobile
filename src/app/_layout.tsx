import "../../global.css";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { nextOnboardingStep } from "@/services/profileService";

const PUBLIC_ROUTES = ["(auth)", "auth-callback"];
const ONBOARDING_ROUTES = ["(onboarding)"];

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const rootSegment = segments[0] as string | undefined;
    const isPublicRoute = !rootSegment || PUBLIC_ROUTES.includes(rootSegment);
    const isOnboardingRoute = rootSegment !== undefined && ONBOARDING_ROUTES.includes(rootSegment);

    if (!session) {
      // Not signed in: only allow public routes.
      if (!isPublicRoute) router.replace("/(auth)/login");
      return;
    }

    // Signed in.
    const step = nextOnboardingStep(profile);

    if (step !== "done" && !isOnboardingRoute) {
      // Onboarding incomplete: force the correct step.
      if (step === "status") router.replace("/(onboarding)/status");
      else if (step === "goals") router.replace("/(onboarding)/goals");
      else router.replace("/(onboarding)/technologies");
      return;
    }

    if (step === "done" && isPublicRoute) {
      // Onboarding complete: never allow back into auth screens.
      router.replace("/(tabs)");
    }
    // Note: authenticated users may open (onboarding) routes to edit preferences later.
  }, [session, profile, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [, fontError] = useFonts({
    NexaLight: require("../../assets/fonts/NexaLight.ttf"),
    NexaBold: require("../../assets/fonts/NexaBold.ttf"),
  });

  useEffect(() => {
    if (fontError) console.error("Failed to load Nexa fonts:", fontError);
  }, [fontError]);

  return (
    <AuthProvider>
      <NavigationGuard>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="topic/[id]" options={{ title: "Topic" }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
          <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        </Stack>
      </NavigationGuard>
    </AuthProvider>
  );
}
