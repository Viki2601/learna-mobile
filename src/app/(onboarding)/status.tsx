import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { SelectCard } from "@/components/ui/SelectCard";
import { useAuth } from "@/context/AuthContext";
import { friendlyAuthError } from "@/services/authService";
import { saveProfessionalStatus } from "@/services/profileService";
import { ProfessionalStatus } from "@/types";
import { AppText as Text } from "@/components/ui/AppText";

export default function OnboardingStatus() {
  const { user, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<ProfessionalStatus | null>(profile?.professional_status ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = Boolean(profile?.onboarding_complete);

  async function handleContinue() {
    if (!selected || !user) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfessionalStatus(user.id, selected);
      await refreshProfile();
      if (editing) router.back();
      else router.push("/(onboarding)/goals");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-5 py-6">
          <OnboardingHeader
            step={1}
            title="Where are you in your journey?"
            description="We’ll tailor your learning path and interview practice to fit where you are today."
          />

          <View className="mt-8 gap-3.5">
            <SelectCard
              icon="school-outline"
              title="Student"
              description="I’m learning and building my skills for my future career."
              selected={selected === "student"}
              onPress={() => setSelected("student")}
              animationDelay={100}
            />
            <SelectCard
              icon="briefcase-outline"
              title="Employed"
              description="I’m working and looking to grow or advance my career."
              selected={selected === "employed"}
              onPress={() => setSelected("employed")}
              animationDelay={180}
            />
          </View>

          {error ? (
            <Animated.View entering={FadeInUp.duration(220)} className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Text className="text-[12px] leading-[18px] text-rose-700">{error}</Text>
            </Animated.View>
          ) : null}

          <View className="mt-auto border-t border-line/70 bg-paper pb-2 pt-5">
            <Button label="Continue" onPress={handleContinue} disabled={!selected} loading={saving} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
