import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import type { ReviewResult } from "@/services/reviewProgressService";

export function ReviewQuizLink({
  topicId,
  result,
  compact = false,
}: {
  topicId: string;
  result?: ReviewResult;
  compact?: boolean;
}) {
  return (
    <Link href={{ pathname: "/review", params: { topicId } }} asChild>
      <Pressable
        accessibilityRole="link"
        className={`flex-row items-center justify-between rounded-xl border border-amber-200 bg-amber-50 active:opacity-75 ${
          compact ? "px-3 py-2.5" : "px-4 py-3"
        }`}
      >
        <View className="flex-1 pr-3">
          <Text className="text-xs font-bold text-amber-900">
            {result ? "Review quiz" : "Take review quiz"}
          </Text>
          {result ? (
            <Text className="mt-0.5 text-[10px] text-amber-800">
              Latest score: {result.score}/{result.total} · Retake anytime
            </Text>
          ) : (
            <Text className="mt-0.5 text-[10px] leading-4 text-amber-800">
              Topic complete — check what you remember.
            </Text>
          )}
        </View>
        <Text className="text-xs font-bold text-amber-900">Quiz →</Text>
      </Pressable>
    </Link>
  );
}
