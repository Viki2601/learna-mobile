import { technologies, topics } from "@/data/content";
import { ALL_TECHNOLOGIES } from "@/data/techCatalog";

describe("offline Q&A catalog", () => {
  it("includes every supplied category, module, and question", () => {
    expect(technologies).toHaveLength(33);
    expect(topics).toHaveLength(265);
    expect(topics.reduce((count, topic) => count + topic.questions.length, 0)).toBe(294);
  });

  it("keeps topic IDs unique and every topic connected to a category", () => {
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(topics.length);

    const categoryIds = new Set(technologies.map((category) => category.id));
    for (const topic of topics) {
      expect(categoryIds.has(topic.categoryId)).toBe(true);
      expect(topic.questions.length).toBeGreaterThan(0);
    }
  });

  it("only offers categories with available Q&A during onboarding", () => {
    expect(new Set(ALL_TECHNOLOGIES)).toEqual(
      new Set(technologies.map((category) => category.name))
    );
  });
});
