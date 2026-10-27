import { useAuth } from "@/context/AuthContext";
import { nextOnboardingStep } from "@/services/profileService";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, } from "react-native-reanimated";

function LoadingScreen() {
  const reveal = useSharedValue(0);
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    reveal.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic), });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    rotation.value = withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1);
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    return () => {
      cancelAnimation(reveal);
      cancelAnimation(pulse);
      cancelAnimation(rotation);
      cancelAnimation(progress);
    };
  }, [progress, pulse, reveal, rotation]);

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 14 }],
  }));
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 108 }],
  }));

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.topGlow} />
      <View pointerEvents="none" style={styles.bottomGlow} />

      <View style={styles.content}>
        <Animated.View style={[styles.brandBlock, wordmarkStyle]}>
          <Text style={styles.brand}>
            Learna<Text style={styles.brandSpark}> ✦</Text>
          </Text>
          <Text style={styles.tagline}>MAKE EVERY DAY COUNT</Text>
        </Animated.View>

        <View style={styles.loadingBlock}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressShimmer, progressStyle]} />
          </View>
          <Text style={styles.loadingLabel}>PREPARING YOUR NEXT SESSION</Text>
        </View>
      </View>

      <Text style={styles.footer}>LEARN  ·  GROW  ·  REPEAT</Text>
    </View>
  );
}

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;

  const step = nextOnboardingStep(profile);
  if (step === "status") return <Redirect href="/(onboarding)/status" />;
  if (step === "goals") return <Redirect href="/(onboarding)/goals" />;
  if (step === "technologies") return <Redirect href="/(onboarding)/technologies" />;

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#F8F7F4", },
  topGlow: { position: "absolute", top: -190, width: 370, height: 370, borderRadius: 185, backgroundColor: "#FDF1DD", opacity: 0.7, },
  bottomGlow: { position: "absolute", bottom: -240, width: 420, height: 420, borderRadius: 210, backgroundColor: "#FDF1DD", opacity: 0.45, },
  content: { alignItems: "center", paddingHorizontal: 24, },
  brandBlock: { alignItems: "center", },
  brand: { color: "#25231F", fontFamily: "NexaBold", fontSize: 34, letterSpacing: 1, },
  brandSpark: { color: "#B8860B", },
  tagline: { marginTop: 10, color: "#8C8372", fontFamily: "NexaBold", fontSize: 10, letterSpacing: 3, },
  loadingBlock: { alignItems: "center", marginTop: 42, },
  progressTrack: { width: 152, height: 4, overflow: "hidden", borderRadius: 2, backgroundColor: "#E9E4DA", },
  progressShimmer: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#B8860B", },
  loadingLabel: { marginTop: 14, color: "#9A9489", fontFamily: "NexaBold", fontSize: 9, letterSpacing: 2, },
  footer: { position: "absolute", bottom: 30, color: "#ADA69B", fontFamily: "NexaBold", fontSize: 9, letterSpacing: 2.5, },
});