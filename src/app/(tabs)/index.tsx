import { Link, router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming, } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { topics, technologies } from "@/data/content";
import { getCategoryById, getTopicById } from "@/data/selectors";
import { useAuth } from "@/context/AuthContext";
import { AppText as Text } from "@/components/ui/AppText";
import { getLastOpenedTopicId } from "@/services/recentTopicService";
import { getTopicProgress } from "@/services/topicProgressService";
import { getReviewResults } from "@/services/reviewProgressService";
import { ReviewQuizLink } from "@/components/ReviewQuizLink";

const statusLabels: Record<string, string> = { student: "Student", employed: "Employed" };
const goalLabels: Record<string, string> = {
  job_search: "Looking for a Job",
  skill_improvement: "Upgrading Skills",
  quick_revision: "Quick Revision",
};

const steps = [
  { number: "01", title: "Choose a topic", detail: "Browse by technology or search for exactly what you need." },
  { number: "02", title: "Recall out loud", detail: "Answer before you peek — that's where the learning happens." },
  { number: "03", title: "Walk in ready", detail: "Show up calm, sharp, and sure of what you know." },
];

const footerLinks = ["About", "Privacy", "Terms", "Contact"];

function getTimeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning,";
  if (hour >= 12 && hour < 17) return "Good afternoon,";
  if (hour >= 17 && hour < 21) return "Good evening,";
  return "Good night,";
}

function ContinueReadingCue({ variant }: { variant: "glow" | "arrow" }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true, undefined, ReduceMotion.System);
    return () => cancelAnimation(progress);
  }, [progress]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.04 + progress.value * 0.08, transform: [{ scale: 0.88 + progress.value * 0.24 }], }));
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 3 }, { scale: 1 + progress.value * 0.06 }], }));

  if (variant === "glow") {
    return (
      <Animated.View pointerEvents="none" accessible={false} style={glowStyle} className="absolute -right-6 -top-6 h-[80px] w-[80px] rounded-full bg-gold-light" />
    );
  }

  return (
    <Animated.View pointerEvents="none" accessible={false} style={arrowStyle} className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#2C2A25]">
      <Text className="text-[15px] text-gold-light">↗</Text>
    </Animated.View>
  );
}

export default function Home() {
  const { profile, user } = useAuth();
  const userId = user?.id;
  const [lastOpenedTopicId, setLastOpenedTopicId] = useState<string | null>(null);
  const [reviewPromptTopicId, setReviewPromptTopicId] = useState<string | null>(null);
  const displayName = profile?.full_name?.trim() || "Learner";
  const userTechs = profile?.technologies?.slice(0, 6) ?? [];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (!userId) {
        setLastOpenedTopicId(null);
        setReviewPromptTopicId(null);
        return () => { isActive = false; };
      }

      getLastOpenedTopicId(userId).then((topicId) => {
        if (isActive) setLastOpenedTopicId(topicId);
      }).catch((error: unknown) => {
        console.error("Failed to load the last opened topic:", error);
      });
      Promise.all([getTopicProgress(userId), getReviewResults(userId)])
        .then(([progress, results]) => {
          if (!isActive) return;
          const reviewedIds = new Set(results.map((result) => result.topicId));
          const nextPrompt = progress.find((item) => item.completed && !reviewedIds.has(item.topicId));
          setReviewPromptTopicId(nextPrompt?.topicId ?? null);
        })
        .catch((error: unknown) => {
          console.error("Failed to load completed topic reviews:", error);
        });

      return () => {
        isActive = false;
      };
    }, [userId])
  );

  const lastOpenedTopic = lastOpenedTopicId ? getTopicById(lastOpenedTopicId) : undefined;
  const lastOpenedCategory = lastOpenedTopic ? getCategoryById(lastOpenedTopic.categoryId) : undefined;
  const reviewPromptTopic = reviewPromptTopicId ? getTopicById(reviewPromptTopicId) : undefined;
  const reviewPromptCategory = reviewPromptTopic ? getCategoryById(reviewPromptTopic.categoryId) : undefined;
  const questionCount = topics.reduce((count, topic) => count + topic.questions.length, 0);

  return (
    <View className="flex-1 bg-paper">
      <View  className="flex-row items-center justify-between px-5 pb-4 pt-20 bg-black">
        <View>
          <Text className="text-[8px] font-semibold uppercase tracking-[1.6px] text-muted">Learn a little. Remember a lot.</Text>
          <Text className="mt-0.5 text-[24px] font-bold tracking-[1px] text-paper">
            Learna<Text className="text-gold"> ✦</Text>
          </Text>
        </View>
        <Pressable onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Profile settings" className="h-[42px] w-[42px] items-center justify-center rounded-full border border-[#F1DFC0] bg-pale-gold active:opacity-85">
          <Text className="text-[15px] font-bold text-gold">
            {(profile?.full_name ?? "L").charAt(0).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <StatusBar style="inverted" />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-b-[36px] bg-black px-5 pb-7 pt-2">
          <Text className="text-[30px] font-bold leading-[36px] tracking-[-0.8px] text-paper">
            {getTimeGreeting(new Date().getHours())}
          </Text>
          <Text className="mt-1 text-[24px] font-bold leading-[30px] text-gold-light">
            {displayName}
          </Text>

          {profile?.professional_status || profile?.career_goal ? (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {profile.professional_status ? (
                <View className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5">
                  <Text className="text-[10px] font-semibold text-gold-light">{statusLabels[profile.professional_status]}</Text>
                </View>
              ) : null}
              {profile.career_goal ? (
                <View className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5">
                  <Text className="text-[10px] font-semibold text-gold-light">{goalLabels[profile.career_goal]}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {reviewPromptTopic ? (
          <View className="mt-5 px-5">
            <View className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <Text className="text-[10px] font-bold tracking-[1.2px] text-amber-800">
                MODULE COMPLETE
              </Text>
              <Text className="mt-1.5 text-[17px] font-bold text-ink">
                Ready to test your {reviewPromptCategory?.name ?? "topic"} skills?
              </Text>
              <Text className="mt-1 mb-3 text-[12px] leading-[18px] text-muted">
                You completed {reviewPromptTopic.title}. Take a quick review quiz while it’s fresh.
              </Text>
              <ReviewQuizLink topicId={reviewPromptTopic.id} compact />
            </View>
          </View>
        ) : null}

        {userTechs.length > 0 ? (
          <View className="mt-5 px-5">
            <Text className="text-[10px] font-bold tracking-[1.4px] text-gold">YOUR FOCUS</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {userTechs.map((name) => (
                <View key={name} className="rounded-full border border-line bg-white px-3 py-1.5">
                  <Text className="text-[11px] font-medium text-ink">{name}</Text>
                </View>
              ))}
              {(profile?.technologies?.length ?? 0) > 6 ? (
                <Pressable onPress={() => router.push("/settings")} className="rounded-full border border-line bg-white px-3 py-1.5">
                  <Text className="text-[11px] font-medium text-gold">
                    +{profile!.technologies.length - 6} more
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View className="mt-7 flex-row items-center justify-between px-5">
          <Text className="text-[17px] font-semibold tracking-[-0.2px] text-ink">
            Continue reading
          </Text>
          <Text className="text-[9px] font-bold tracking-[1.2px] text-gold">YOUR LAST TOPIC</Text>
        </View>

        <View className="mt-3 px-5">
          {lastOpenedTopic ? (
            <Link href={{ pathname: "/topic/[id]", params: { id: lastOpenedTopic.id } }} asChild>
              <Pressable className="min-h-[190px] justify-between overflow-hidden rounded-[20px] bg-ink p-5 active:opacity-85">
                <ContinueReadingCue variant="glow" />

                <View className="flex-row items-center justify-between">
                  <View className="rounded-full bg-[#322F28] px-3 py-1.5">
                    <Text className="text-[10px] font-semibold text-gold-light">
                      {lastOpenedCategory?.name ?? "Topic"}
                    </Text>
                  </View>
                  <Text className="text-[8px] tracking-[1.2px] text-[#A7A29A]">CONTINUE WHERE YOU LEFT OFF</Text>
                </View>

                <View className="mt-5">
                  <Text className="text-[13px] pb-2 font-semibold text-gold-light">
                    {lastOpenedTopic.title}
                  </Text>
                  <Text className="text-[18px] font-semibold leading-[28px] text-white line-clamp-2">
                    {lastOpenedTopic.questions[0]?.question}
                  </Text>
                  <Text className="mt-1.5 text-[12px] text-[#A7A29A]">
                    {lastOpenedTopic.questions.length}{" "}
                    {lastOpenedTopic.questions.length === 1 ? "question" : "questions"} · Tap to continue
                  </Text>
                </View>

                <View className="mt-5 flex-row items-center justify-between">
                  <Text className="text-[10px] text-[#A7A29A]">Pick up where you left off</Text>
                  <ContinueReadingCue variant="arrow" />
                </View>
              </Pressable>
            </Link>
          ) : (
            <Link href="/topics" asChild>
              <Pressable className="min-h-[150px] justify-between overflow-hidden rounded-[20px] bg-ink p-5 active:opacity-85">
                <Text className="text-[10px] font-semibold tracking-[1.2px] text-gold-light">
                  START EXPLORING
                </Text>
                <View>
                  <Text className="text-[21px] font-semibold leading-[28px] text-white">
                    Your last opened topic will appear here.
                  </Text>
                  <Text className="mt-1.5 text-[12px] text-[#A7A29A]">Browse topics to get started</Text>
                </View>
              </Pressable>
            </Link>
          )}
        </View>

        <View className="mt-3 flex-row gap-3 px-5">
          <Link href="/topics" asChild>
            <Pressable className="min-h-[108px] flex-1 rounded-2xl border border-line bg-white p-4 active:opacity-85">
              <Text className="text-[9px] font-bold tracking-[1.2px] text-gold">01</Text>
              <Text className="mt-2.5 text-[14px] font-semibold text-ink">Browse topics</Text>
              <Text className="mt-1 text-[11px] text-muted">Find your focus ↗</Text>
            </Pressable>
          </Link>
          <Link href="/review" asChild>
            <Pressable className="min-h-[108px] flex-1 rounded-2xl border border-line bg-white p-4 active:opacity-85">
              <Text className="text-[9px] font-bold tracking-[1.2px] text-gold">02</Text>
              <Text className="mt-2.5 text-[14px] font-semibold text-ink">Quick review</Text>
              <Text className="mt-1 text-[11px] text-muted">Keep it fresh ↗</Text>
            </Pressable>
          </Link>
        </View>

        <View className="mt-8 flex-row items-stretch rounded-2xl border border-line bg-white mx-5">
          {[
            { value: String(technologies.length), label: "categories" },
            { value: String(topics.length), label: "modules" },
            { value: String(questionCount), label: "questions" },
          ].map((stat, index) => (
            <View key={stat.label} className={`flex-1 px-4 py-4 ${index > 0 ? "border-l border-line" : ""}`}>
              <Text className="text-[18px] font-bold text-ink">{stat.value}</Text>
              <Text className="mt-0.5 text-[10px] text-muted">{stat.label}</Text>
            </View>
          ))}
        </View>

        <View className="mt-10 px-5">
          <Text className="text-[9px] font-bold tracking-[1.8px] text-gold">HOW IT WORKS</Text>
          <Text className="mt-2 text-[24px] font-semibold leading-[30px] tracking-[-0.5px] text-ink">
            Three steps. That’s it.
          </Text>

          <View className="mt-4">
            {steps.map((step, index) => (
              <View key={step.number} className={`flex-row items-start gap-3 py-4 ${index < steps.length - 1 ? "border-b border-line" : ""}`}>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-ink">
                  <Text className="text-[10px] font-bold text-gold-light">{step.number}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-ink">{step.title}</Text>
                  <Text className="mt-1 pr-2 text-[12px] leading-[17px] text-muted">{step.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-5 mt-8 overflow-hidden rounded-[22px] bg-ink">
          <View className="px-6 pb-7 pt-8">
            <Text className="text-[11px] font-semibold tracking-[1.5px] text-gold-light">
              READY WHEN YOU ARE
            </Text>
            <Text className="mt-3 text-[24px] font-semibold leading-[30px] tracking-[-0.5px] text-white">
              One question is all it takes to start.
            </Text>
            <Link href="/topics" asChild>
              <Pressable className="mt-5 min-h-[50px] flex-row items-center justify-between rounded-2xl bg-white px-5 active:opacity-85">
                <Text className="text-[14px] font-semibold text-ink">Browse all topics</Text>
                <Text className="text-[17px] text-gold">→</Text>
              </Pressable>
            </Link>
          </View>
          <View className="absolute -bottom-10 -right-10 h-[120px] w-[120px] rounded-full bg-gold/10" />
          <View className="absolute -bottom-4 right-16 h-[60px] w-[60px] rounded-full bg-gold/5" />
        </View>

        <View className="mt-10 border-t border-line px-5 pt-8">
          <Text className="text-[32px] font-bold tracking-[1px] text-ink">
            Learna<Text className="text-gold"> ✦</Text>
          </Text>
          <Text className="mt-2 max-w-[260px] text-[12px] leading-[17px] text-muted">
            A sharper hour. A stronger interview. Small sessions, built for the moment before.
          </Text>

          <View className="mt-5 flex-row flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <Text key={link} className="text-[12px] font-medium text-ink/70">{link}</Text>
            ))}
          </View>

          <View className="mt-6 flex-row items-center gap-2 border-t border-line pt-5">
            <Text className="text-[11px] text-muted">✦</Text>
            <Text className="text-[10px] tracking-[0.5px] text-muted">© 2026 Learna · Prep with purpose</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}