import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View, type ScrollViewInstance } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { getCategoryById, getTopicById } from "@/data/selectors";
import { AppText as Text } from "@/components/ui/AppText";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { useAuth } from "@/context/AuthContext";
import { saveLastOpenedTopicId } from "@/services/recentTopicService";
import { recordTopicProgress } from "@/services/topicProgressService";
import { ReviewQuizLink } from "@/components/ReviewQuizLink";

export default function TopicDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const topic = getTopicById(id);
    const topicId = topic?.id;
    const { user } = useAuth();
    const scrollViewRef = useRef<ScrollViewInstance | null>(null);
    const [questionPosition, setQuestionPosition] = useState<{ topicId: string; index: number } | null>(null);
    const [completionState, setCompletionState] = useState<{ topicId: string; completed: boolean } | null>(null);
    const [completionSaving, setCompletionSaving] = useState(false);
    const [completionError, setCompletionError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id || !topicId) return;

        saveLastOpenedTopicId(user.id, topicId).catch((error: unknown) => {
            console.error("Failed to save the last opened topic:", error);
        });
    }, [topicId, user?.id]);

    const questionIndex = questionPosition && questionPosition.topicId === topicId ? Math.min(questionPosition.index, (topic?.questions.length ?? 1) - 1) : 0;

    useEffect(() => {
        if (!user?.id || !topicId || !topic) return;

        const percentage = Math.floor(((questionIndex + 1) / topic.questions.length) * 100);
        recordTopicProgress(user.id, topicId, percentage)
            .then((progress) => {
                const saved = progress.find((item) => item.topicId === topicId);
                setCompletionState({ topicId, completed: saved?.completed ?? false });
            })
            .catch((error: unknown) => {
                console.error("Failed to save module progress:", error);
            });
    }, [questionIndex, topic, topicId, user?.id]);

    if (!topic) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 px-8">
                <Text className="text-lg font-bold text-slate-900">Topic not found</Text>
                <Text className="mt-2 text-center text-sm text-slate-500">This study topic may have been removed from the catalog.</Text>
            </View>
        );
    }

    const category = getCategoryById(topic.categoryId);
    const question = topic.questions[questionIndex];
    const moduleCompleted = completionState?.topicId === topic.id && completionState.completed;
    const isLastQuestion = questionIndex === topic.questions.length - 1;

    async function finishModule() {
        if (!user?.id || !topic || completionSaving || moduleCompleted) return;

        setCompletionSaving(true);
        setCompletionError(null);
        try {
            await recordTopicProgress(user.id, topic.id, 100, true);
            setCompletionState({ topicId: topic.id, completed: true });
        } catch (error) {
            console.error("Failed to complete module:", error);
            setCompletionError("Could not save completion. Please try again.");
        } finally {
            setCompletionSaving(false);
        }
    }

    return (
        <>
            <Stack.Screen options={{ title: category?.name ?? "Topic", headerStyle: { backgroundColor: "#000000" }, headerTintColor: "#FFFFFF", headerTitleStyle: { color: "#FFFFFF", fontWeight: "600" }, }} />
            <ScrollView ref={scrollViewRef} className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
                <View className="rounded-3xl bg-slate-900 p-5">
                    <Text className="text-xs font-bold uppercase tracking-widest text-amber-300">
                        {category?.name ?? "Study topic"}
                    </Text>
                    <Text className="mt-2 text-2xl font-bold leading-8 text-white">{topic.title}</Text>
                    <View className="mt-4 flex-row items-center justify-between">
                        <DifficultyBadge level={topic.difficulty} />
                        <Text className="text-xs text-slate-300">
                            {topic.questions.length}{" "}
                            {topic.questions.length === 1 ? "question" : "questions"}
                        </Text>
                    </View>
                </View>
                <View className="gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <View>
                        <Text className="text-xs font-bold uppercase tracking-widest text-amber-700">
                            Question {questionIndex + 1} of {topic.questions.length}
                        </Text>
                        <Text className="mt-2 text-lg font-bold leading-6 text-slate-900">
                            {question.question}
                        </Text>
                    </View>
                    <View className="h-px bg-slate-100" />
                    <View>
                        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Answer</Text>
                        <Text selectable className="text-[15px] leading-6 text-slate-700">{formatReadableText(question.answer)}</Text>
                    </View>
                    {question.explanation ? (
                        <View className="rounded-xl bg-amber-50 p-4">
                            <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-800">Key takeaway</Text>
                            <Text className="text-sm leading-5 text-slate-700">{formatReadableText(question.explanation)}</Text>
                        </View>
                    ) : null}
                    {question.example ? (
                        <View className="overflow-hidden rounded-xl bg-slate-950">
                            <View className="border-b border-white/10 px-4 py-2.5">
                                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Example{question.language ? ` · ${question.language}` : ""}</Text>
                            </View>
                            <Text selectable className="px-4 py-4 text-xs leading-5 text-slate-100" style={{ fontFamily: "monospace" }}>
                                {question.example}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <View className="gap-3">
                    {moduleCompleted ? <ReviewQuizLink topicId={topic.id} compact /> : null}
                    {isLastQuestion ? (
                        <>
                            <Pressable onPress={finishModule} disabled={moduleCompleted || completionSaving} accessibilityRole="button" accessibilityState={{ disabled: moduleCompleted || completionSaving }} className={`min-h-12 flex-row items-center justify-center rounded-xl ${moduleCompleted ? "bg-emerald-700" : "bg-slate-900 active:opacity-80"}`}>
                                <Text className="text-sm font-semibold text-white">
                                    {moduleCompleted ? "Module completed ✓" : completionSaving ? "Saving progress..." : "Finish module"}
                                </Text>
                            </Pressable>
                            {completionError ? (
                                <Text className="text-center text-sm font-medium text-rose-700">{completionError}</Text>
                            ) : null}
                        </>
                    ) : null}
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={() => {
                                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                setQuestionPosition({ topicId: topic.id, index: Math.max(questionIndex - 1, 0), });
                            }}
                            disabled={questionIndex === 0}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: questionIndex === 0 }}
                            className={`min-h-12 flex-1 flex-row items-center justify-center rounded-xl border ${questionIndex === 0 ? "border-slate-200 bg-slate-100" : "border-slate-300 bg-white active:opacity-75"}`}
                        >
                            <Text className={`text-sm font-semibold ${questionIndex === 0 ? "text-slate-400" : "text-slate-700"}`}>
                                ← Previous
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                setQuestionPosition({ topicId: topic.id, index: Math.min(questionIndex + 1, topic.questions.length - 1), });
                            }}
                            disabled={questionIndex === topic.questions.length - 1}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: questionIndex === topic.questions.length - 1 }}
                            className={`min-h-12 flex-1 flex-row items-center justify-center rounded-xl ${questionIndex === topic.questions.length - 1 ? "bg-slate-300" : "bg-slate-900 active:opacity-80"}`}
                        >
                            <Text className="text-sm font-semibold text-white">Next →</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

function formatReadableText(value: string): string {
    return value.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}