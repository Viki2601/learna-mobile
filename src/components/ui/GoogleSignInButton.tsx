import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { isSupabaseConfigured } from "@/lib/supabase";

export function isGoogleSignInConfigured(): boolean {
  return isSupabaseConfigured;
}

interface ConfiguredProps {
  onSuccess: (session: Session) => void;
}

function ConfiguredGoogleButton({ onSuccess }: ConfiguredProps) {
  const { promptSignIn, loading, error } = useGoogleSignIn(onSuccess);

  return (
    <View className="gap-2">
      <Button label="Continue with Google" variant="secondary" onPress={promptSignIn} loading={loading} />
      {error ? <Text className="text-center text-[12px] text-rose-600">{error}</Text> : null}
    </View>
  );
}

interface GoogleSignInButtonProps {
  onSuccess: (session: Session) => void;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  if (!isGoogleSignInConfigured()) {
    return (
      <View className="items-center gap-1 rounded-2xl border border-line bg-white/60 px-4 py-3">
        <Text className="text-[12px] font-medium text-muted">Continue with Google</Text>
        <Text className="text-center text-[10px] leading-[14px] text-muted">
          Google sign-in needs your Supabase keys in .env. Copy .env.example to .env to enable it.
        </Text>
      </View>
    );
  }
  return <ConfiguredGoogleButton onSuccess={onSuccess} />;
}
