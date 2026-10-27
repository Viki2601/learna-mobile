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
import { saveCareerGoal } from "@/services/profileService";
import { CareerGoal } from "@/types";
import { AppText as Text } from "@/components/ui/AppText";

export default function OnboardingGoals() {
  const { user, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<CareerGoal | null>(profile?.career_goal ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = Boolean(profile?.onboarding_complete);

  async function handleContinue() {
    if (!selected || !user) return;
    setSaving(true);
    setError(null);
    try {
      await saveCareerGoal(user.id, selected);
      await refreshProfile();
      if (editing) router.back();
      else router.push("/(onboarding)/technologies");
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
            step={2}
            onBack={() => router.back()}
            title="What would you like to achieve?"
            description="Choose the goal that matters most right now. You can update it whenever you need."
          />

          <View className="mt-8 gap-3.5">
            <SelectCard
              icon="rocket-outline"
              title="Looking for a Job"
              description="Prepare for interviews, improve your resume, and become job-ready."
              selected={selected === "job_search"}
              onPress={() => setSelected("job_search")}
              animationDelay={80}
            />
            <SelectCard
              icon="trending-up-outline"
              title="Upgrading My Skills"
              description="Learn new technologies and strengthen my existing skills."
              selected={selected === "skill_improvement"}
              onPress={() => setSelected("skill_improvement")}
              animationDelay={150}
            />
            <SelectCard
              icon="flash-outline"
              title="Quick Revision"
              description="Refresh important concepts and practice what I already know."
              selected={selected === "quick_revision"}
              onPress={() => setSelected("quick_revision")}
              animationDelay={220}
            />
          </View>

          {error ? (
            <Animated.View entering={FadeInUp.duration(220)} className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Text className="text-[12px] leading-[18px] text-rose-700">{error}</Text>
            </Animated.View>
          ) : null}

          <View className="mt-auto border-t border-line/70 bg-paper pb-2 pt-5">
            <Button label="Continue" onPress={handleContinue} disabled={!selected} loading={saving} arrow />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
