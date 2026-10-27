import type { Topic } from "@/types";
import { technologies, topics } from "./content";

export const getTopicsByCategory = (categoryId: string): Topic[] =>
    topics.filter((topic) => topic.categoryId === categoryId);

export const getCategoryById = (categoryId: string) =>
    technologies.find((category) => category.id === categoryId);

export const getTopicById = (id: string): Topic | undefined =>
    topics.find((topic) => topic.id === id);