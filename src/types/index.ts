export type Difficulty = "beginner" | "intermediate" | "advanced";

// Static content (ships the app)
export interface Technology {
    id: string;
    name: string;
}

export interface TopicQuestion {
    question: string;
    answer: string;
    explanation?: string;
    example?: string;
    language?: string;
}

export interface Topic {
    id: string;
    categoryId: string;
    title: string;
    difficulty: Difficulty;
    questions: TopicQuestion[];
}

export interface CardProgress {
    topicId: string;
    easeFaxctor: number;
    intervalDays: number;
    repetitions: number;
    dueAt: number;
    lastReviewedAt?: number;
}

// Auth & profile
export type ProfessionalStatus = "student" | "employed";
export type CareerGoal = "job_search" | "skill_improvement" | "quick_revision";
export type AuthProvider = "email" | "google";

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    auth_provider: AuthProvider;
    phone_number: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    avatar_path: string | null;
    deactivated_at: string | null;
    professional_status: ProfessionalStatus | null;
    career_goal: CareerGoal | null;
    technologies: string[];
    onboarding_complete: boolean;
    created_at: string;
    updated_at: string;
}