# Authentication & Onboarding Setup

Learna uses [Supabase](https://supabase.com) for email/password auth, Google OAuth, and profile storage (Postgres with Row Level Security).

## 1. Create a Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql` (creates the `profiles` table, RLS policies, and a signup trigger).
3. If the project was already initialized, apply [`20261027000000_profile_settings_cleanup.sql`](../supabase/migrations/20261027000000_profile_settings_cleanup.sql) from `supabase/migrations/` in the SQL Editor. This creates or updates the profile-photo bucket and policies, ensures the profile settings columns exist, and removes retired profile fields.
4. In **Project Settings → API**, copy the Project URL and anon key.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |

Restart the dev server after changing `.env`.

## 3. Google OAuth setup

Google sign-in runs through Supabase's OAuth endpoint, so the app only needs a deep-link
redirect — no Google client IDs in `.env`.

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth client of type **Web application**.
2. Add the Supabase OAuth redirect URL under **Authorized redirect URIs**:
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   (plus the project's JavaScript origin `https://YOUR_PROJECT.supabase.co`).
3. In Supabase **Authentication → Providers → Google**, enable Google and paste the web client ID + secret.
4. In Supabase **Authentication → URL Configuration → Redirect URLs**, add:
   - `exp://**` — lets Supabase redirect back to Expo Go during development
   - `learnamobile://**` — lets Supabase redirect back to development/production builds (app scheme from `app.json`)

   Without these entries the browser flow dead-ends at Supabase with "Redirect URL not allowed".
5. In the Google Cloud OAuth consent screen, add your app and test users (while in testing mode).

Flow: the app opens the browser at Supabase's `/auth/v1/authorize` → Google consent →
Supabase callback (the only URL Google sees, so it must be the registered HTTPS one) →
Supabase redirects back to the app's deep link → the app completes the sign-in
(`src/lib/oauth.ts`) and the `auth-callback` screen shows progress.

Note: for a later native build you can switch to `@react-native-google-signin/google-signin`
(Expo's current recommendation; needs a development build). The current browser flow works in
Expo Go as configured above.

## 4. Password reset deep link

The app scheme is `learnamobile` (see `app.json`). Password reset emails redirect to `learnamobile://reset-password`. In Supabase **Authentication → URL Configuration**, add `learnamobile://**` to the redirect allow-list, and set the Site URL as needed.

## 5. Run

```bash
npx expo start          # dev server
npm test                # unit tests (validation + onboarding state)
npx tsc --noEmit        # typecheck
```

## Flow

- App launch → loading screen while the saved session and profile are restored → `login` (with a link to `signup`) when signed out, or the appropriate onboarding step/home when signed in
- Authenticated, onboarding incomplete → forced to `status` → `goals` → `technologies` (resumes at the first incomplete step)
- Onboarding complete → `(tabs)` home
- Settings (`settings.tsx`): edit preferences, logout

Sessions persist via AsyncStorage (Supabase client config); users stay logged in across restarts. Tokens are never stored in plain localStorage, and passwords only ever transit to Supabase auth.
