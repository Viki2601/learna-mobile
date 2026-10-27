import { AuthError, Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export class AuthConfigError extends Error {
    constructor() {
        super("Authentication is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.");
        this.name = "AuthConfigError";
    }
}

function ensureConfigured() {
    if (!isSupabaseConfigured) throw new AuthConfigError();
}

export function friendlyAuthError(error: unknown): string {
    if (error instanceof AuthConfigError) return error.message;
    if (error instanceof AuthError) {
        switch (error.message) {
            case "Invalid login credentials":
                return "Incorrect email or password.";
            case "User already registered":
                return "An account with this email already exists. Try logging in.";
            case "Email not confirmed":
                return "Please confirm your email before logging in.";
            case "Password should be at least 6 characters.":
                return "Password must be at least 8 characters.";
            default:
                return error.message || "Something went wrong. Please try again.";
        }
    }
    if (error instanceof Error && /network|fetch/i.test(error.message)) {
        return "Network error. Check your connection and try again.";
    }
    return "Something went wrong. Please try again.";
}

export async function signUpWithEmail(fullName: string, email: string, password: string): Promise<Session | null> {
    ensureConfigured();
    const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw error;
    // Session is null when email confirmation is required.
    return data.session;
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
    ensureConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    });
    if (error) throw error;
    return data.session;
}

export async function sendPasswordReset(email: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: "learnamobile://reset-password",
    });
    if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}

export async function signOut(scope: "global" | "local" | "others" = "global"): Promise<void> {
    ensureConfigured();
    const { error } = await supabase.auth.signOut({ scope });
    if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
    ensureConfigured();
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export function onAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
    ensureConfigured();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session, session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
}
