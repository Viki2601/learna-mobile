import { topics } from "@/data/content";
import type { Topic, TopicQuestion } from "@/types";

export interface ReviewQuestion {
  question: string;
  answer: string;
  explanation?: string;
  options: string[];
}

interface AnswerSource {
  categoryId: string;
  answer: string;
}

const answerSources: AnswerSource[] = topics.flatMap((topic) =>
  topic.questions.map((question) => ({ categoryId: topic.categoryId, answer: question.answer }))
);

function answerKey(answer: string): string {
  return answer.replace(/\s+/g, " ").trim().toLowerCase();
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffled<T>(items: T[], seedValue: string): T[] {
  const result = [...items];
  let seed = stableHash(seedValue);
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const target = seed % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createOptions(
  topic: Topic,
  question: TopicQuestion,
  questionIndex: number
): string[] {
  const correctKey = answerKey(question.answer);
  const categoryDistractors = answerSources
    .filter((source) => source.categoryId === topic.categoryId && answerKey(source.answer) !== correctKey)
    .map((source) => source.answer);
  const otherDistractors = answerSources
    .filter((source) => source.categoryId !== topic.categoryId && answerKey(source.answer) !== correctKey)
    .map((source) => source.answer);
  const unique = (values: string[]) =>
    [...new Map(values.map((value) => [answerKey(value), value])).values()];
  const categoryAnswers = unique(categoryDistractors);
  const fallbackAnswers = unique(otherDistractors);
  const distractors = shuffled(
    unique([...categoryAnswers, ...fallbackAnswers]),
    `${topic.id}:${questionIndex}`
  ).slice(0, 3);

  return shuffled(
    [question.answer, ...distractors],
    `${topic.id}:${questionIndex}:options`
  );
}

export function buildReviewQuiz(topic: Topic): ReviewQuestion[] {
  return topic.questions.map((question, index) => ({
    question: question.question,
    answer: question.answer,
    ...(question.explanation ? { explanation: question.explanation } : {}),
    options: createOptions(topic, question, index),
  }));
}
