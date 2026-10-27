import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams, Stack } from "expo-router";
import { AppText as Text } from "@/components/ui/AppText";
import { getCategoryById, getTopicById } from "@/data/selectors";
import { topics } from "@/data/content";
import { useAuth } from "@/context/AuthContext";
import { buildReviewQuiz } from "@/services/reviewQuizService";
import { getReviewResults, saveReviewResult, type ReviewResult } from "@/services/reviewProgressService";
import { Ionicons } from "@expo/vector-icons";

export default function Review() {
  const { topicId: routeTopicId } = useLocalSearchParams<{ topicId?: string }>();
  const topicId = Array.isArray(routeTopicId) ? routeTopicId[0] : routeTopicId;
  const topic = topicId ? getTopicById(topicId) : undefined;

  if (topic) return <ReviewQuiz key={topic.id} topic={topic} />;
  return <ReviewLibrary />;
}

function ReviewLibrary() {
  const { user } = useAuth();
  const userId = user?.id;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Map<string, ReviewResult>>(new Map());
  const [loadError, setLoadError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) return () => { active = false; };
      getReviewResults(userId)
        .then((saved) => {
          if (!active) return;
          setResults(new Map(saved.map((result) => [result.topicId, result])));
          setLoadError(false);
        })
        .catch((error: unknown) => {
          console.error("Failed to load review quiz scores:", error);
          if (active) setLoadError(true);
        });
      return () => { active = false; };
    }, [userId])
  );

  const visibleTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return topics;
    return topics.filter((topic) => {
      const categoryName = getCategoryById(topic.categoryId)?.name ?? "";
      return `${topic.title} ${categoryName}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query]);

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={visibleTopics}
        keyExtractor={(topic) => topic.id}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-2 gap-4 px-4 pb-4 pt-20 bg-black rounded-b-3xl">
            <View className="rounded-3xl bg-slate-900 p-5">
              <Text className="text-xs font-bold uppercase tracking-widest text-amber-300">REVIEW & RECALL</Text>
              <Text className="mt-2 text-2xl font-bold leading-8 text-white">Put your knowledge to the test.</Text>
              <Text className="mt-2 text-sm leading-5 text-slate-300">
                Choose a module to start a multiple-choice quiz across its questions.
              </Text>
            </View>
            {loadError ? (
              <Text className="text-xs text-rose-700">Saved quiz scores could not be loaded. You can still take a quiz.</Text>
            ) : null}
            <View className="min-h-12 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
              <Text className="text-3xl text-slate-400">⌕</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search modules or categories"
                placeholderTextColor="#94a3b8"
                autoCorrect={false}
                autoCapitalize="none"
                className="min-h-12 flex-1 px-3 text-sm text-slate-900"
                style={{ fontFamily: "NexaLight" }}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10">
            <Text className="text-base font-semibold text-slate-800">No quizzes found</Text>
            <Text className="mt-2 text-center text-sm text-slate-500">Try another module or category name.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const category = getCategoryById(item.categoryId);
          const result = results.get(item.id);
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/review", params: { topicId: item.id } })} className="rounded-2xl border border-slate-200 bg-white mx-4 my-2 p-4 active:opacity-75">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-bold leading-5 text-slate-900">{item.title}</Text>
                  <Text className="mt-1 text-xs text-slate-500">{category?.name ?? "Study module"}</Text>
                </View>
                <Text className="text-xs font-semibold text-amber-800">
                  {result ? `${result.score}/${result.total}` : "Start →"}
                </Text>
              </View>
              <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
                <Text className="text-xs text-slate-500">
                  {item.questions.length} {item.questions.length === 1 ? "question" : "questions"}
                  {result ? ` · ${result.attempts} ${result.attempts === 1 ? "attempt" : "attempts"}` : ""}
                </Text>
                <Text className="text-xs font-bold text-amber-800">{result ? "Retake quiz →" : "Take quiz →"}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function ReviewQuiz({ topic }: { topic: NonNullable<ReturnType<typeof getTopicById>> }) {
  const { user } = useAuth();
  const category = getCategoryById(topic.categoryId);
  const quiz = useMemo(() => buildReviewQuiz(topic), [topic]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<ReviewResult | null>(null);
  const question = quiz[questionIndex];
  const correctIndex = question.options.indexOf(question.answer);
  const isLastQuestion = questionIndex === quiz.length - 1;

  async function completeQuiz() {
    if (!user?.id) {
      setError("Your session expired. Please sign in again.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await saveReviewResult(user.id, topic.id, score, quiz.length);
      setFinalResult(saved.find((result) => result.topicId === topic.id) ?? null);
    } catch (saveError) {
      console.error("Failed to save review quiz result:", saveError);
      setError("Your score could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function advance() {
    if (!revealed) {
      if (selectedOption === null) return;
      setRevealed(true);
      if (selectedOption === correctIndex) setScore((current) => current + 1);
      return;
    }
    if (isLastQuestion) {
      void completeQuiz();
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedOption(null);
    setRevealed(false);
    setError(null);
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          <Pressable onPress={() => router.replace("/review")} accessibilityRole="button" className="flex flex-row items-center gap-2 bg-black px-4 pb-4 pt-20">
            <Ionicons name="chevron-back" size={24} color="white" />
            <Text className="text-xl font-semibold text-white">All review quizzes</Text>
          </Pressable>
          {finalResult ? (
            <View className="items-center rounded-3xl bg-slate-900 px-6 py-8">
              <Text className="text-xs font-bold uppercase tracking-widest text-amber-300">QUIZ COMPLETE</Text>
              <Text className="mt-3 text-5xl font-bold text-white">
                {finalResult.score}/{finalResult.total}
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-slate-300">
                {finalResult.score === finalResult.total ? "Perfect recall. Keep it up!" : "Nice work. Review the answers and try again when you’re ready."}
              </Text>
              <Text className="mt-2 text-xs text-slate-400">Attempt {finalResult.attempts}</Text>
              <Pressable onPress={() => router.replace("/review")} className="mt-6 min-h-12 items-center justify-center rounded-xl bg-white px-5">
                <Text className="text-sm font-bold text-slate-900">Browse all quizzes</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="rounded-3xl bg-slate-900 mx-4 p-5">
                <Text className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  {category?.name ?? "REVIEW"} · {topic.difficulty.toUpperCase()}
                </Text>
                <Text className="mt-2 text-2xl font-bold leading-8 text-white">{topic.title}</Text>
                <Text className="mt-2 text-sm text-slate-300">
                  Question {questionIndex + 1} of {quiz.length}
                </Text>
                <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <View className="h-full rounded-full bg-amber-300" style={{ width: `${((questionIndex + 1) / quiz.length) * 100}%` }} />
                </View>
              </View>
              <View className="rounded-2xl border border-slate-200 bg-white mx-4 p-5">
                <Text className="text-lg font-bold leading-6 text-slate-900">{question.question}</Text>
                <Text className="mt-2 text-xs text-slate-500">Choose the best answer.</Text>
                <View className="mt-4 gap-2.5">
                  {question.options.map((option, index) => {
                    const isCorrect = index === correctIndex;
                    const isSelected = index === selectedOption;
                    const style = revealed && isCorrect ? "border-emerald-400 bg-emerald-50" : revealed && isSelected ? "border-rose-300 bg-rose-50" : isSelected ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white";
                    return (
                      <Pressable key={`${topic.id}-${questionIndex}-${index}`} onPress={() => { if (!revealed) setSelectedOption(index); }} disabled={revealed} accessibilityRole="radio" accessibilityState={{ selected: isSelected, disabled: revealed }} className={`rounded-xl border p-3.5 ${style}`}>
                        <Text className="text-sm leading-5 text-slate-800">
                          <Text className="font-bold text-slate-500">{String.fromCharCode(65 + index)}. </Text>
                          {formatAnswer(option)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {revealed ? (
                  <View className="mt-4 rounded-xl bg-slate-50 p-4">
                    <Text className={`text-xs font-bold ${selectedOption === correctIndex ? "text-emerald-800" : "text-rose-800"}`}>
                      {selectedOption === correctIndex ? "Correct" : "Not quite — review the correct answer"}
                    </Text>
                    <Text className="mt-1.5 text-sm leading-5 text-slate-700">{formatAnswer(question.answer)}</Text>
                    {question.explanation ? (
                      <Text className="mt-2 text-xs leading-5 text-slate-600">{formatAnswer(question.explanation)}</Text>
                    ) : null}
                  </View>
                ) : null}
                {error ? <Text className="mt-3 text-sm text-rose-700">{error}</Text> : null}
                <Pressable onPress={advance} disabled={(!revealed && selectedOption === null) || saving} accessibilityRole="button" accessibilityState={{ disabled: (!revealed && selectedOption === null) || saving, busy: saving }} className={`mt-5 min-h-12 items-center justify-center rounded-xl ${(!revealed && selectedOption === null) || saving ? "bg-slate-300" : "bg-slate-900 active:opacity-80"}`}>
                  <Text className="text-sm font-semibold text-white">
                    {saving ? "Saving score…" : !revealed ? "Check answer" : isLastQuestion ? "Finish quiz" : "Next question →"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatAnswer(value: string): string {
  return value.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/^\s*[-•]\s*/gm, "• ").trim();
}