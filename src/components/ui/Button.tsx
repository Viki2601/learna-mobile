import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  arrow?: boolean;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, arrow }: ButtonProps) {
  const isDisabled = disabled || loading;

  const base = "min-h-[54px] w-full flex-row items-center justify-center rounded-2xl px-6 active:opacity-85";
  const variants = {
    primary: "bg-ink",
    secondary: "border border-line bg-white",
    ghost: "bg-transparent",
  };

  const textVariants = {
    primary: "text-[15px] font-semibold text-white",
    secondary: "text-[15px] font-semibold text-ink",
    ghost: "text-[14px] font-medium text-muted",
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${isDisabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#171613"} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className={textVariants[variant]}>{label}</Text>
          {arrow ? <Text className={variant === "primary" ? "text-[17px] text-gold-light" : "text-[16px] text-gold"}>→</Text> : null}
        </View>
      )}
    </Pressable>
  );
}
