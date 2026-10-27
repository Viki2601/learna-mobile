import { useState } from "react";
import { Session } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import { completeOAuthRedirect, createAuthRedirectUrl, OAuthRedirectError } from "@/lib/oauth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { friendlyAuthError } from "@/services/authService";

interface UseGoogleSignInResult {
  promptSignIn: () => Promise<void>;
  loading: boolean;
  error: string | null;
  requestReady: boolean;
}

function toMessage(error: unknown): string {
  return error instanceof OAuthRedirectError ? error.message : friendlyAuthError(error);
}

export function useGoogleSignIn(onSuccess: (session: Session) => void): UseGoogleSignInResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function promptSignIn() {
    if (!isSupabaseConfigured) {
      setError("Authentication is not configured. Set your Supabase keys in .env.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const redirectTo = createAuthRedirectUrl();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError) throw oauthError;
      if (!data.url) {
        throw new OAuthRedirectError("Could not start Google sign-in. Please try again.");
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === "success" && "url" in result) {
        const session = await completeOAuthRedirect(result.url);
        onSuccess(session);
      }
      // cancel/dismiss: if the redirect still arrived, the auth deep-link
      // tracker and the auth-callback screen complete the sign-in instead.
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return { promptSignIn, loading, error, requestReady: true };
}
