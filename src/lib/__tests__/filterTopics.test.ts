import filterTopics from "@/lib/filterTopics";
import type { Topic } from "@/types";

const sampleTopics: Topic[] = [
  {
    id: "javascript-closures",
    categoryId: "javascript",
    title: "Closures & Scope",
    difficulty: "intermediate",
    questions: [
      {
        question: "What is a closure?",
        answer: "A function remembers its lexical environment.",
        explanation: "This enables private state.",
      },
    ],
  },
  {
    id: "react-hooks",
    categoryId: "react",
    title: "Hooks Fundamentals",
    difficulty: "beginner",
    questions: [
      {
        question: "Why do hooks need a stable order?",
        answer: "React associates hook state with call order.",
      },
    ],
  },
];

describe("filterTopics", () => {
  it("filters topics by category and difficulty", () => {
    expect(filterTopics(sampleTopics, "", "beginner", "react").map((topic) => topic.id)).toEqual([
      "react-hooks",
    ]);
  });

  it("searches questions and answers", () => {
    expect(filterTopics(sampleTopics, "lexical environment", "all").map((topic) => topic.id)).toEqual([
      "javascript-closures",
    ]);
  });
});
