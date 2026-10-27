import * as Linking from "expo-linking";
import { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export class OAuthRedirectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthRedirectError";
  }
}

const AUTH_CALLBACK_PATH = "auth-callback";

/** Deep-link URL that Supabase redirects back to after the Google flow. */
export function createAuthRedirectUrl(): string {
  return Linking.createURL(`/${AUTH_CALLBACK_PATH}`);
}

export function isAuthCallbackUrl(url: string): boolean {
  return url.includes(`/${AUTH_CALLBACK_PATH}`);
}

function parseRedirectParams(url: string): Record<string, string> {
  const parsed = new URL(url, "https://oauth-redirect.local");
  const params: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  if (parsed.hash) {
    new URLSearchParams(parsed.hash.replace(/^#/, "")).forEach((value, key) => {
      params[key] = value;
    });
  }
  return params;
}

function redirectErrorMessage(params: Record<string, string>): string | null {
  const code = params.error_code ?? params.error;
  if (!code) return null;
  if (code === "access_denied") return "Google sign-in was cancelled.";
  return params.error_description || "Google sign-in failed. Please try again.";
}

const inflight = new Map<string, Promise<Session>>();

/**
 * Completes an OAuth redirect URL (tokens in query/hash, or a PKCE code) into a
 * Supabase session. Memoized by token/code so the browser flow, the deep-link
 * tracker, and the auth-callback screen can all call it safely.
 */
export function completeOAuthRedirect(url: string): Promise<Session> {
  const params = parseRedirectParams(url);
  const key = params.code ?? params.access_token ?? "";

  if (key) {
    const cached = inflight.get(key);
    if (cached) return cached;
  }

  const promise = (async (): Promise<Session> => {
    if (!isSupabaseConfigured) {
      throw new OAuthRedirectError(
        "Authentication is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env."
      );
    }
    const failure = redirectErrorMessage(params);
    if (failure) throw new OAuthRedirectError(failure);

    const { access_token, refresh_token, code } = params;

    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      if (!data.session) throw new OAuthRedirectError("Sign-in failed. Please try again.");
      return data.session;
    }

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (!data.session) throw new OAuthRedirectError("Sign-in failed. Please try again.");
      return data.session;
    }

    throw new OAuthRedirectError("Sign-in was interrupted. Please try again.");
  })();

  // Keep the outcome (including failures) so concurrent callers share one attempt.
  promise.catch(() => {});
  if (key) inflight.set(key, promise);
  return promise;
}

type AuthUrlListener = (url: string) => void;

const urlListeners = new Set<AuthUrlListener>();
let lastUrl: string | null = null;
let tracking = false;

function trackUrl(url: string) {
  lastUrl = url;
  urlListeners.forEach((listener) => listener(url));
  if (isAuthCallbackUrl(url)) {
    // Complete eagerly so the session lands even if no screen is mounted yet
    // (e.g. the browser result raced an app-foreground event).
    completeOAuthRedirect(url).catch(() => {});
  }
}

/**
 * Starts listening for auth deep links (warm navigation and cold-start URLs).
 * Safe to call more than once; tracking lives for the app session.
 */
export function beginAuthUrlTracking(): void {
  if (tracking) return;
  tracking = true;
  Linking.addEventListener("url", ({ url }) => trackUrl(url));
  Linking.getInitialURL()
    .then((url) => {
      if (url) trackUrl(url);
    })
    .catch(() => {});
}

export function getTrackedAuthUrl(): string | null {
  return lastUrl;
}

export function subscribeAuthUrl(listener: AuthUrlListener): () => void {
  urlListeners.add(listener);
  return () => {
    urlListeners.delete(listener);
  };
}
