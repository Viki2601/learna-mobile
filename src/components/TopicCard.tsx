import { Pressable, View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Link } from "expo-router";
import type { Topic } from "@/types";
import { getCategoryById } from "@/data/selectors";
import { DifficultyBadge } from "./DifficultyBadge";
import { ReviewQuizLink } from "@/components/ReviewQuizLink";
import type { ReviewResult } from "@/services/reviewProgressService";

export function TopicCard({ topic, completed = false, reviewResult, }: { topic: Topic; completed?: boolean; reviewResult?: ReviewResult; }) {
    const category = getCategoryById(topic.categoryId);
    const preview = topic.questions[0]?.question;

    return (
        <View className="rounded-2xl border border-slate-200 bg-white p-4 mx-4 my-2">
            <Link href={{ pathname: "/topic/[id]", params: { id: topic.id } }} asChild>
                <Pressable accessibilityRole="link" className="active:opacity-75">
                    <View className="flex-row items-start gap-3">
                        <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                            <Text className="text-xs font-bold uppercase text-amber-700">
                                {category?.name.slice(0, 2) ?? "QA"}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-start justify-between gap-2">
                                <Text className="flex-1 text-base font-bold leading-5 text-slate-900">
                                    {topic.title}
                                </Text>
                                <DifficultyBadge level={topic.difficulty} />
                            </View>
                            {category ? (
                                <Text className="mt-1 text-xs text-slate-500">{category.name}</Text>
                            ) : null}
                        </View>
                    </View>
                    {preview ? (
                        <Text className="mt-3 text-sm leading-5 text-slate-600" numberOfLines={2}>
                            {preview}
                        </Text>
                    ) : null}
                    <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
                        <Text className="text-xs font-medium text-slate-500">
                            {topic.questions.length} {topic.questions.length === 1 ? "question" : "questions"}
                        </Text>
                        <Text className="text-sm font-semibold text-amber-700">Read topic →</Text>
                    </View>
                </Pressable>
            </Link>
            {completed ? (
                <View className="mt-3">
                    <ReviewQuizLink topicId={topic.id} result={reviewResult} compact />
                </View>
            ) : null}
        </View>
    );
}