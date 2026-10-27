import AsyncStorage from "@react-native-async-storage/async-storage";

function storageKey(userId: string): string {
    if (!userId.trim()) throw new Error("A user ID is required to store recent reading activity.");
    return `learna:recent-topic:${userId}`;
}

export function getLastOpenedTopicId(userId: string): Promise<string | null> {
    return AsyncStorage.getItem(storageKey(userId));
}

export function saveLastOpenedTopicId(userId: string, topicId: string): Promise<void> {
    if (!topicId.trim()) throw new Error("A topic ID is required to store recent reading activity.");
    return AsyncStorage.setItem(storageKey(userId), topicId);
}
