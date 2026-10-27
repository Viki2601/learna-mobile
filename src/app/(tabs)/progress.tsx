import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText as Text } from "@/components/ui/AppText";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { getCategoryById, getTopicById } from "@/data/selectors";
import { useAuth } from "@/context/AuthContext";
import { getTopicProgress, type TopicProgress } from "@/services/topicProgressService";
import { getReviewResults, type ReviewResult } from "@/services/reviewProgressService";
import { ReviewQuizLink } from "@/components/ReviewQuizLink";

export default function Progress() {
    const { user } = useAuth();
    const userId = user?.id;
    const [progress, setProgress] = useState<TopicProgress[] | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [reviewResults, setReviewResults] = useState<Map<string, ReviewResult>>(new Map());

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            Promise.all([
                Promise.resolve().then(() => (userId ? getTopicProgress(userId) : [])),
                Promise.resolve().then(() => (userId ? getReviewResults(userId) : [])),
            ])
                .then(([items, results]) => {
                    if (isActive) {
                        setProgress(items);
                        setReviewResults(new Map(results.map((result) => [result.topicId, result])));
                        setLoadError(false);
                    }
                })
                .catch((error: unknown) => {
                    console.error("Failed to load topic progress:", error);
                    if (isActive) {
                        setProgress([]);
                        setLoadError(true);
                    }
                });

            return () => {
                isActive = false;
            };
        }, [userId])
    );

    const entries = useMemo(
        () =>
            (progress ?? []).flatMap((item) => {
                const topic = getTopicById(item.topicId);
                return topic ? [{ progress: item, topic, category: getCategoryById(topic.categoryId) }] : [];
            }),
        [progress]
    );
    const completedCount = entries.filter((entry) => entry.progress.completed).length;
    const overallProgress = entries.length > 0 ? Math.round(entries.reduce((total, entry) => total + entry.progress.percentage, 0) / entries.length) : 0;
    const emptyState =
        progress !== null ? (
            <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                    <Ionicons name="bar-chart-outline" size={22} color="#B8860B" />
                </View>
                <Text className="mt-4 text-base font-bold text-slate-900">
                    No modules opened yet
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
                    Open a topic and your progress will appear here automatically.
                </Text>
                <Link href="/topics" asChild>
                    <Pressable className="mt-5 min-h-11 flex-row items-center justify-center rounded-xl bg-slate-900 px-5 active:opacity-80">
                        <Text className="text-sm font-semibold text-white">Browse topics</Text>
                    </Pressable>
                </Link>
            </View>
        ) : undefined;

    return (
        <View className="flex-1 bg-slate-50">
            <FlatList
                className="flex-1"
                data={entries}
                keyExtractor={(entry) => entry.topic.id}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                ListHeaderComponent={
                    <View className="mb-2 gap-4 px-4 pt-20 bg-black rounded-b-3xl">
                        <View>
                            <Text className="text-2xl font-bold tracking-tight text-slate-50">Your progress</Text>
                            <Text className="mt-1 text-sm text-slate-100">Pick up any module right where you left off.</Text>
                        </View>
                        {loadError ? (
                            <View className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <Text className="text-sm text-rose-800">Progress could not be loaded from this device. Please try again.</Text>
                            </View>
                        ) : null}
                        {progress === null && !loadError ? (
                            <View className="rounded-2xl border border-slate-200 bg-white p-5">
                                <Text className="text-sm text-slate-500">Loading your progress…</Text>
                            </View>
                        ) : null}
                        {entries.length > 0 ? (
                            <View className="flex-row gap-3">
                                <SummaryCard label="Modules opened" value={String(entries.length)} />
                                <SummaryCard label="Completed" value={String(completedCount)} />
                                <SummaryCard label="Overall" value={`${overallProgress}%`} />
                            </View>
                        ) : null}
                        {entries.length > 0 ? (
                            <Text className="mt-1 text-base font-bold text-slate-900">Your modules</Text>
                        ) : null}
                    </View>
                }
                ListEmptyComponent={emptyState}
                renderItem={({ item }) => (
                    <View className="rounded-2xl border border-slate-200 bg-white mx-4 my-2 p-4">
                        <Link href={{ pathname: "/topic/[id]", params: { id: item.topic.id } }} asChild>
                            <Pressable accessibilityRole="link" className="active:opacity-75">
                                <View className="flex-row items-start justify-between gap-3">
                                    <View className="flex-1">
                                        <Text className="text-base font-bold leading-5 text-slate-900">
                                            {item.topic.title}
                                        </Text>
                                        {item.category ? (
                                            <Text className="mt-1 text-xs text-slate-500">
                                                {item.category.name}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <DifficultyBadge level={item.topic.difficulty} />
                                </View>
                                <View className="mt-4 flex-row items-center justify-between">
                                    <Text className="text-xs font-semibold text-slate-600">
                                        {item.progress.completed ? "Completed" : "In progress"}
                                    </Text>
                                    <Text className="text-sm font-bold text-slate-900">
                                        {item.progress.percentage}%
                                    </Text>
                                </View>
                                <View
                                    accessibilityRole="progressbar"
                                    accessibilityValue={{
                                        min: 0,
                                        max: 100,
                                        now: item.progress.percentage,
                                    }}
                                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                                >
                                    <View
                                        className={`h-full rounded-full ${item.progress.completed ? "bg-emerald-500" : "bg-amber-500"
                                            }`}
                                        style={{ width: `${item.progress.percentage}%` }}
                                    />
                                </View>
                                <Text className="mt-2 text-right text-xs font-semibold text-amber-700">
                                    Continue →
                                </Text>
                            </Pressable>
                        </Link>
                        {item.progress.completed ? (
                            <View className="mt-3">
                                <ReviewQuizLink
                                    topicId={item.topic.id}
                                    result={reviewResults.get(item.topic.id)}
                                    compact
                                />
                            </View>
                        ) : null}
                    </View>
                )}
            />
        </View>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <View className="min-h-[78px] flex-1 justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3">
            <Text className="text-xl font-bold text-slate-900">{value}</Text>
            <Text className="mt-1 text-[10px] leading-3 text-slate-800">{label}</Text>
        </View>
    );
}