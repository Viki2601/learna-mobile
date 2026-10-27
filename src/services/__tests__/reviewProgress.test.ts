import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReviewResults, saveReviewResult } from "@/services/reviewProgressService";

jest.mock("@react-native-async-storage/async-storage", () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
      clear: jest.fn(async () => { values.clear(); }),
    },
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("review result storage", () => {
  it("stores latest score and increments attempts per topic", async () => {
    await saveReviewResult("review-user", "topic-one", 1, 2);
    await saveReviewResult("review-user", "topic-one", 2, 2);

    await expect(getReviewResults("review-user")).resolves.toMatchObject([
      { topicId: "topic-one", score: 2, total: 2, attempts: 2 },
    ]);
  });

  it("isolates scores by user", async () => {
    await saveReviewResult("review-user", "topic-one", 1, 2);
    await saveReviewResult("another-user", "topic-two", 2, 2);

    await expect(getReviewResults("review-user")).resolves.toMatchObject([
      { topicId: "topic-one", score: 1 },
    ]);
  });
});
