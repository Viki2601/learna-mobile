import { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { CareerGoal, ProfessionalStatus, UserProfile } from "@/types";
import { AuthConfigError } from "@/services/authService";

function ensureConfigured() {
    if (!isSupabaseConfigured) throw new AuthConfigError();
}

type ProfileRow = Omit<UserProfile, "technologies"> & { technologies: string[] | null };

function mapRow(row: ProfileRow): UserProfile {
    return {
        ...row,
        technologies: row.technologies ?? [],
    };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
    ensureConfigured();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as ProfileRow) : null;
}

export async function ensureProfile(user: User): Promise<UserProfile> {
    ensureConfigured();
    const existing = await fetchProfile(user.id);
    if (existing) return existing;

    const metadata = (user.user_metadata ?? {}) as { full_name?: string };
    const fullName = metadata.full_name ?? user.email?.split("@")[0] ?? "Learner";

    const { data, error } = await supabase
        .from("profiles")
        .upsert(
            {
                id: user.id,
                full_name: fullName,
                email: user.email ?? "",
                auth_provider: user.app_metadata?.provider === "google" ? "google" : "email",
            },
            { onConflict: "id" }
        )
        .select()
        .single();
    if (error) throw error;
    return mapRow(data as ProfileRow);
}

export async function saveProfessionalStatus(userId: string, status: ProfessionalStatus): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
        .from("profiles")
        .update({ professional_status: status, updated_at: new Date().toISOString() })
        .eq("id", userId);
    if (error) throw error;
}

export async function saveCareerGoal(userId: string, goal: CareerGoal): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
        .from("profiles")
        .update({ career_goal: goal, updated_at: new Date().toISOString() })
        .eq("id", userId);
    if (error) throw error;
}

export async function saveTechnologies(userId: string, technologies: string[], complete: boolean): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
        .from("profiles")
        .update({
            technologies,
            ...(complete ? { onboarding_complete: true } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    if (error) throw error;
}

export type EditableProfile = Pick<
    UserProfile,
    | "full_name"
    | "phone_number"
    | "github_url"
    | "portfolio_url"
    | "avatar_path"
    | "professional_status"
    | "career_goal"
    | "technologies"
>;

export async function updateProfile(userId: string, patch: Partial<EditableProfile>): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", userId);
    if (error) throw error;
}

export async function uploadAvatar(userId: string, uri: string, mimeType: string | null): Promise<string> {
    ensureConfigured();
    const response = await fetch(uri);
    if (!response.ok) throw new Error("Unable to read the selected profile photo.");
    const file = await response.blob();
    const normalizedMimeType = mimeType ?? "image/jpeg";
    if (!/^image\/(jpeg|png|webp)$/.test(normalizedMimeType)) {
        throw new Error("Choose a JPG, PNG, or WebP profile photo.");
    }
    const extension = normalizedMimeType.split("/")[1] === "jpeg" ? "jpg" : normalizedMimeType.split("/")[1];
    const path = `${userId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: normalizedMimeType,
        upsert: false,
    });
    if (error) {
        if (error.message.toLowerCase().includes("bucket not found")) {
            throw new Error("Profile photo storage is not set up. Apply the latest Supabase migrations, then try again.");
        }
        throw error;
    }
    return path;
}

export async function removeAvatar(path: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase.storage.from("avatars").remove([path]);
    if (error) throw error;
}

export async function getAvatarUrl(path: string): Promise<string> {
    ensureConfigured();
    const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
}

export type OnboardingStep = "status" | "goals" | "technologies" | "done";

export function nextOnboardingStep(profile: UserProfile | null): OnboardingStep {
    if (!profile) return "status";
    if (!profile.professional_status) return "status";
    if (!profile.career_goal) return "goals";
    if (!profile.onboarding_complete) return "technologies";
    return "done";
}
