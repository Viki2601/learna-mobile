import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ReviewResult {
  topicId: string;
  score: number;
  total: number;
  attempts: number;
  completedAt: string;
}

const pendingWrites = new Map<string, Promise<void>>();

function storageKey(userId: string): string {
  if (!userId.trim()) throw new Error("A user ID is required to store review results.");
  return `learna:review-results:${userId}`;
}

function isReviewResult(value: unknown): value is ReviewResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<ReviewResult>;
  return (
    typeof result.topicId === "string" &&
    typeof result.score === "number" &&
    typeof result.total === "number" &&
    typeof result.attempts === "number" &&
    typeof result.completedAt === "string"
  );
}

async function readResults(key: string): Promise<ReviewResult[]> {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error("Saved review results have an invalid format.");
  return parsed.filter(isReviewResult);
}

export async function getReviewResults(userId: string): Promise<ReviewResult[]> {
  const key = storageKey(userId);
  await pendingWrites.get(key);
  return readResults(key);
}

export async function saveReviewResult(
  userId: string,
  topicId: string,
  score: number,
  total: number
): Promise<ReviewResult[]> {
  if (!topicId.trim()) throw new Error("A topic ID is required to save a review result.");
  if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) {
    throw new Error("Review score must be a valid score out of the quiz total.");
  }
  const key = storageKey(userId);
  const previousWrite = pendingWrites.get(key) ?? Promise.resolve();
  let result: ReviewResult[] = [];
  const write = previousWrite.then(async () => {
    const current = await readResults(key);
    const previous = current.find((item) => item.topicId === topicId);
    const updated: ReviewResult = {
      topicId,
      score,
      total,
      attempts: (previous?.attempts ?? 0) + 1,
      completedAt: new Date().toISOString(),
    };
    result = [updated, ...current.filter((item) => item.topicId !== topicId)];
    await AsyncStorage.setItem(key, JSON.stringify(result));
  });
  const queuedWrite = write.then(() => undefined, () => undefined);
  pendingWrites.set(key, queuedWrite);
  try {
    await write;
    return result;
  } finally {
    if (pendingWrites.get(key) === queuedWrite) pendingWrites.delete(key);
  }
}
