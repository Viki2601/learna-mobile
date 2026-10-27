import { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { technologies, topics } from "@/data/content";
import { TopicCard } from "@/components/TopicCard";
import filterTopics, { type DifficultyFilter } from "@/lib/filterTopics";
import { AppText as Text } from "@/components/ui/AppText";
import { useAuth } from "@/context/AuthContext";
import { getTopicProgress, type TopicProgress } from "@/services/topicProgressService";
import { getReviewResults, type ReviewResult } from "@/services/reviewProgressService";

const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
    { value: "all", label: "All levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

const categoryTopicCounts = new Map(
    technologies.map((category) => [
        category.id,
        topics.filter((topic) => topic.categoryId === category.id).length,
    ])
);

export default function Topics() {
    const { user } = useAuth();
    const userId = user?.id;
    const [query, setQuery] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
    const [categoryId, setCategoryId] = useState("all");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [reviewResults, setReviewResults] = useState<Map<string, ReviewResult>>(new Map());

    useFocusEffect(
        useCallback(() => {
            let active = true;
            if (!userId) {
                return () => { active = false; };
            }
            Promise.all([getTopicProgress(userId), getReviewResults(userId)])
                .then(([progress, results]) => {
                    if (!active) return;
                    setCompletedIds(new Set(progress.filter((item: TopicProgress) => item.completed).map((item) => item.topicId)));
                    setReviewResults(new Map(results.map((item) => [item.topicId, item])));
                })
                .catch((error: unknown) => {
                    console.error("Failed to load topic review status:", error);
                });
            return () => { active = false; };
        }, [userId])
    );

    const visible = useMemo(
        () => filterTopics(topics, query, difficulty, categoryId),
        [query, difficulty, categoryId]
    );
    const visibleQuestionCount = useMemo(
        () => visible.reduce((count, topic) => count + topic.questions.length, 0),
        [visible]
    );

    const activeFilterCount = Number(categoryId !== "all") + Number(difficulty !== "all");

    return (
        <View className="flex-1 bg-slate-50">
            <FlatList
                className="flex-1"
                data={visible}
                keyExtractor={(t) => t.id}
                keyboardShouldPersistTaps="handled"
                stickyHeaderIndices={[0]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View className="z-10 mb-2 gap-4 bg-black pb-1 pt-20 p-6 rounded-b-3xl">
                        <View>
                            <Text className="text-2xl font-bold tracking-tight text-slate-50">
                                Explore topics
                            </Text>
                            <Text className="mt-1 text-sm text-slate-200">
                                Browse {topics.length} study modules across {technologies.length} categories.
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <View className="min-h-12 flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
                                <Ionicons name="search-outline" size={18} color="#94a3b8" />
                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder="Search topics or answers"
                                    placeholderTextColor="#94a3b8"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    accessibilityLabel="Search topics and answers"
                                    className="min-h-12 flex-1 px-3 py-3 text-base text-slate-900"
                                    style={{ fontFamily: "NexaLight" }}
                                />
                                {query.length > 0 ? (
                                    <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
                                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                                    </Pressable>
                                ) : null}
                            </View>
                            <Pressable onPress={() => setFiltersOpen(true)} accessibilityRole="button" accessibilityLabel={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`} className="h-12 flex-row items-center justify-center rounded-2xl bg-slate-900 px-3.5 active:opacity-80">
                                <Ionicons name="options-outline" size={18} color="#ffffff" />
                                <Text className="ml-2 text-sm font-semibold text-white">Filter</Text>
                                {activeFilterCount > 0 ? (
                                    <View className="ml-2 h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1">
                                        <Text className="text-[10px] font-bold text-slate-900">{activeFilterCount}</Text>
                                    </View>
                                ) : null}
                            </Pressable>
                        </View>
                        <View className="flex-row items-center justify-between pb-3">
                            <Text className="text-sm font-semibold text-slate-100">
                                {visible.length} {visible.length === 1 ? "topic" : "topics"}
                            </Text>
                            <Text className="text-xs text-slate-100">
                                {visibleQuestionCount} {visibleQuestionCount === 1 ? "question" : "questions"}
                            </Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10">
                        <Text className="text-base font-semibold text-slate-800">No topics found</Text>
                        <Text className="mt-2 text-center text-sm text-slate-500">Try another search or change your category and level filters.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TopicCard topic={item} completed={completedIds.has(item.id)} reviewResult={reviewResults.get(item.id)} />
                )}
            />
            <Modal visible={filtersOpen} transparent animationType="fade" onRequestClose={() => setFiltersOpen(false)}>
                <View className="flex-1 flex-row bg-black/45">
                    <SafeAreaView edges={["top", "bottom"]} className="h-full w-[84%] max-w-[380px] bg-white">
                        <View className="flex-1">
                            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
                                <View>
                                    <Text className="text-xl font-bold text-slate-900">Filters</Text>
                                    <Text className="mt-1 text-xs text-slate-500">
                                        Narrow topics by category and level.
                                    </Text>
                                </View>
                                <Pressable onPress={() => setFiltersOpen(false)} accessibilityRole="button" accessibilityLabel="Close filters" hitSlop={10} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                    <Ionicons name="close" size={20} color="#334155" />
                                </Pressable>
                            </View>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
                                <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Category
                                </Text>
                                <FilterOption label="All categories" count={topics.length} selected={categoryId === "all"} onPress={() => setCategoryId("all")} />
                                {technologies.map((category) => (
                                    <FilterOption key={category.id} label={category.name} count={categoryTopicCounts.get(category.id) ?? 0} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
                                ))}
                                <Text className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Level
                                </Text>
                                {difficultyOptions.map((option) => (
                                    <FilterOption key={option.value} label={option.label} selected={difficulty === option.value} onPress={() => setDifficulty(option.value)} />
                                ))}
                            </ScrollView>
                            <View className="gap-3 border-t border-slate-100 px-5 py-4">
                                <Pressable onPress={() => { setCategoryId("all"); setDifficulty("all"); }} accessibilityRole="button" className="min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
                                    <Text className="text-sm font-semibold text-slate-700">Clear filters</Text>
                                </Pressable>
                                <Pressable onPress={() => setFiltersOpen(false)} accessibilityRole="button" className="min-h-12 items-center justify-center rounded-xl bg-slate-900">
                                    <Text className="text-sm font-bold text-white">
                                        Show {visible.length} {visible.length === 1 ? "topic" : "topics"}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </SafeAreaView>
                    <Pressable className="flex-1" onPress={() => setFiltersOpen(false)} accessibilityRole="button" accessibilityLabel="Close filter drawer" />
                </View>
            </Modal>
        </View>
    );
}

function FilterOption({ label, count, selected, onPress, }: { label: string; count?: number; selected: boolean; onPress: () => void; }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} className={`mb-2 min-h-11 flex-row items-center justify-between rounded-xl border px-3.5 ${selected ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <View className="flex-1 flex-row items-center">
                <Text className={`flex-1 text-sm ${selected ? "font-bold text-slate-900" : "text-slate-700"}`}>
                    {label}
                </Text>
                {count !== undefined ? (
                    <Text className="ml-2 text-xs text-slate-400">{count}</Text>
                ) : null}
            </View>
            <View className={`ml-3 h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-slate-900 bg-slate-900" : "border-slate-300 bg-white"}`}>
                {selected ? <Ionicons name="checkmark" size={12} color="#ffffff" /> : null}
            </View>
        </Pressable>
    );
}