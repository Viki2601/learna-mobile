import type { Difficulty, Topic } from "@/types";

export type DifficultyFilter = Difficulty | "all";

export default function filterTopics(
    topics: Topic[],
    query: string,
    difficulty: DifficultyFilter,
    categoryId: string = "all"
): Topic[] {
    const q = query.trim().toLowerCase();

    return topics.filter((topic) => {
        const matchesDifficulty = difficulty === "all" || topic.difficulty === difficulty;
        const matchesCategory = categoryId === "all" || topic.categoryId === categoryId;
        const searchableText = [
            topic.title,
            ...topic.questions.flatMap((item) => [item.question, item.answer, item.explanation ?? ""]),
        ]
            .join(" ")
            .toLowerCase();
        const matchesQuery = q === "" || searchableText.includes(q);
        return matchesDifficulty && matchesCategory && matchesQuery;
    });
}