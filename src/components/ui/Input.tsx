import { useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";

interface InputProps extends TextInputProps {
  label: string;
  error?: string | null;
  secure?: boolean;
}

export function Input({ label, error, secure, ...rest }: InputProps) {
  const [hidden, setHidden] = useState(secure ?? false);

  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold tracking-[0.3px] text-ink">{label}</Text>
      <View
        className={`flex-row items-center rounded-2xl border bg-white px-4 ${
          error ? "border-rose-400" : "border-line focus:border-ink/40"
        }`}
      >
        <TextInput
          className="min-h-[52px] flex-1 py-3 text-[15px] text-ink"
          style={{ fontFamily: "NexaLight" }}
          placeholderTextColor="#A5A199"
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...rest}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            className="pl-2"
          >
            <Text className="text-[12px] font-semibold text-gold">{hidden ? "Show" : "Hide"}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-[11px] text-rose-600">{error}</Text> : null}
    </View>
  );
}
