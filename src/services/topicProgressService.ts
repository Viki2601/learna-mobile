import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TopicProgress {
    topicId: string;
    percentage: number;
    completed: boolean;
    lastOpenedAt: string;
}

const pendingWrites = new Map<string, Promise<void>>();

function storageKey(userId: string): string {
    if (!userId.trim()) throw new Error("A user ID is required to store topic progress.");
    return `learna:topic-progress:${userId}`;
}

export async function getTopicProgress(userId: string): Promise<TopicProgress[]> {
    const key = storageKey(userId);
    await pendingWrites.get(key);
    return readStoredProgress(key);
}

async function readStoredProgress(key: string): Promise<TopicProgress[]> {
    const value = await AsyncStorage.getItem(key);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
        throw new Error("Saved topic progress has an invalid format.");
    }

    return parsed.filter(isTopicProgress);
}

export async function getTopicProgressById(
    userId: string,
    topicId: string
): Promise<TopicProgress | undefined> {
    const progress = await getTopicProgress(userId);
    return progress.find((item) => item.topicId === topicId);
}

export async function recordTopicProgress(
    userId: string,
    topicId: string,
    percentage: number,
    completed = false
): Promise<TopicProgress[]> {
    if (!topicId.trim()) throw new Error("A topic ID is required to store topic progress.");
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        throw new Error("Topic progress must be a percentage between 0 and 100.");
    }

    const key = storageKey(userId);
    const previousWrite = pendingWrites.get(key) ?? Promise.resolve();
    let result: TopicProgress[] = [];
    const write = previousWrite.then(async () => {
        const current = await readStoredProgress(key);
        const existing = current.find((item) => item.topicId === topicId);
        const updated: TopicProgress = {
            topicId,
            percentage: completed ? 100 : Math.max(existing?.percentage ?? 0, Math.min(percentage, 99)),
            completed: completed || existing?.completed === true,
            lastOpenedAt: new Date().toISOString(),
        };
        result = [updated, ...current.filter((item) => item.topicId !== topicId)];
        await AsyncStorage.setItem(key, JSON.stringify(result));
    });
    const queuedWrite = write.then(
        () => undefined,
        () => undefined
    );
    pendingWrites.set(key, queuedWrite);
    try {
        await write;
        return result;
    } finally {
        if (pendingWrites.get(key) === queuedWrite) pendingWrites.delete(key);
    }
}

function isTopicProgress(value: unknown): value is TopicProgress {
    if (!value || typeof value !== "object") return false;
    const progress = value as Partial<TopicProgress>;
    return (
        typeof progress.topicId === "string" &&
        typeof progress.percentage === "number" &&
        typeof progress.completed === "boolean" &&
        typeof progress.lastOpenedAt === "string"
    );
}
