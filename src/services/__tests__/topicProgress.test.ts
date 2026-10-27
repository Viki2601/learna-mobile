import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTopicProgress,
  getTopicProgressById,
  recordTopicProgress,
} from "@/services/topicProgressService";

jest.mock("@react-native-async-storage/async-storage", () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      clear: jest.fn(async () => {
        values.clear();
      }),
    },
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("topic progress storage", () => {
  it("tracks opened modules and keeps the furthest progress", async () => {
    await recordTopicProgress("progress-user", "javascript-closures", 20);
    await recordTopicProgress("progress-user", "javascript-closures", 10);

    await expect(getTopicProgressById("progress-user", "javascript-closures")).resolves.toMatchObject({
      topicId: "javascript-closures",
      percentage: 20,
      completed: false,
    });
  });

  it("marks completion as 100 percent and keeps it completed", async () => {
    await recordTopicProgress("progress-user", "react-hooks", 85);
    await recordTopicProgress("progress-user", "react-hooks", 0, true);
    await recordTopicProgress("progress-user", "react-hooks", 10);

    await expect(getTopicProgressById("progress-user", "react-hooks")).resolves.toMatchObject({
      percentage: 100,
      completed: true,
    });
  });

  it("isolates progress by user and returns most recently opened modules first", async () => {
    await recordTopicProgress("progress-user", "first-topic", 10);
    await recordTopicProgress("another-user", "private-topic", 50);
    await recordTopicProgress("progress-user", "second-topic", 40);

    await expect(getTopicProgress("another-user")).resolves.toHaveLength(1);
    await expect(getTopicProgress("progress-user")).resolves.toMatchObject([
      { topicId: "second-topic", percentage: 40 },
      { topicId: "first-topic", percentage: 10 },
    ]);
  });

  it("preserves every module when progress is written concurrently", async () => {
    await Promise.all([
      recordTopicProgress("concurrent-user", "topic-one", 15),
      recordTopicProgress("concurrent-user", "topic-two", 35),
      recordTopicProgress("concurrent-user", "topic-three", 65),
    ]);

    await expect(getTopicProgress("concurrent-user")).resolves.toHaveLength(3);
  });
});
