export interface TechCategory {
    id: string;
    name: string;
    items: string[];
}

export const TECH_CATALOG: TechCategory[] = [
    {
        id: "languages",
        name: "Programming Languages",
        items: [
            "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "C", "Go",
            "Rust", "HTML5", "CSS3",
        ],
    },
    {
        id: "frontend",
        name: "Frontend Development",
        items: ["React", "Next.js", "Vue.js", "Angular", "Svelte", "Tailwind CSS"],
    },
    {
        id: "backend",
        name: "Backend and APIs",
        items: ["Node.js", "Express", "NestJS", "GraphQL"],
    },
    {
        id: "databases",
        name: "Databases",
        items: ["SQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Firebase"],
    },
    {
        id: "devops",
        name: "DevOps and Cloud",
        items: ["Docker", "Kubernetes", "Git", "Linux", "Nginx"],
    },
    {
        id: "tools",
        name: "Testing",
        items: ["Jest"],
    },
];

export const MAX_TECHNOLOGIES = 20;

export const ALL_TECHNOLOGIES: string[] = TECH_CATALOG.flatMap((c) => c.items);
