import { getLastOpenedTopicId, saveLastOpenedTopicId } from "@/services/recentTopicService";

jest.mock("@react-native-async-storage/async-storage", () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    },
  };
});

describe("recent topic storage", () => {
  it("stores and retrieves the most recently opened topic for a user", async () => {
    await saveLastOpenedTopicId("user-1", "javascript-closures-scope");

    await expect(getLastOpenedTopicId("user-1")).resolves.toBe("javascript-closures-scope");
  });

  it("keeps recent topics isolated between users", async () => {
    await saveLastOpenedTopicId("user-2", "react-hooks-fundamentals");

    await expect(getLastOpenedTopicId("user-1")).resolves.toBe("javascript-closures-scope");
    await expect(getLastOpenedTopicId("user-2")).resolves.toBe("react-hooks-fundamentals");
  });
});
