import { topics } from "@/data/content";
import { buildReviewQuiz } from "@/services/reviewQuizService";

describe("review quiz generation", () => {
  it("creates one four-option question per catalog question with a correct answer", () => {
    for (const topic of topics) {
      const quiz = buildReviewQuiz(topic);
      expect(quiz).toHaveLength(topic.questions.length);
      for (let index = 0; index < quiz.length; index += 1) {
        expect(quiz[index].question).toBe(topic.questions[index].question);
        expect(quiz[index].options).toHaveLength(4);
        expect(new Set(quiz[index].options).size).toBe(4);
        expect(quiz[index].options).toContain(topic.questions[index].answer);
      }
    }
  });

  it("generates stable options for repeat reviews", () => {
    const topic = topics[0];
    expect(buildReviewQuiz(topic)).toEqual(buildReviewQuiz(topic));
  });
});
