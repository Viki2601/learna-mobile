import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { beginAuthUrlTracking } from "@/lib/oauth";
import { isSupabaseConfigured } from "@/lib/supabase";
import * as authService from "@/services/authService";
import * as profileService from "@/services/profileService";
import { UserProfile } from "@/types";

const PROFILE_LOAD_TIMEOUT_MS = 10_000;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoaded: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: (scope?: "global" | "local" | "others") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      setProfileLoaded(true);
      return;
    }
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const profilePromise = profileService.ensureProfile(user);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Timed out while loading the user profile.")),
          PROFILE_LOAD_TIMEOUT_MS
        );
      });
      const p = await Promise.race([profilePromise, timeoutPromise]);
      setProfile(p);
    } catch (error) {
      console.warn("Failed to load profile:", error);
      setProfile(null);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    beginAuthUrlTracking();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;

    authService
      .getSession()
      .then(async (s) => {
        if (cancelled) return;
        setSession(s);
        userIdRef.current = s?.user?.id ?? null;
        await loadProfile(s?.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange(async (s) => {
      if (cancelled) return;
      const nextUserId = s?.user?.id ?? null;
      setSession(s);
      if (nextUserId !== userIdRef.current) {
        userIdRef.current = nextUserId;
        setProfileLoaded(false);
        await loadProfile(s?.user ?? null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user);
  }, [session, loadProfile]);

  const signOut = useCallback(async (scope: "global" | "local" | "others" = "global") => {
    await authService.signOut(scope);
    setSession(null);
    setProfile(null);
    setProfileLoaded(false);
    userIdRef.current = null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading: loading || (session !== null && !profileLoaded),
      profileLoaded,
      configured: isSupabaseConfigured,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, profileLoaded, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
