import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { AppText as Text } from "@/components/ui/AppText";

interface OnboardingHeaderProps {
  step: number;
  title: string;
  description: string;
  onBack?: () => void;
}

export function OnboardingHeader({ step, title, description, onBack }: OnboardingHeaderProps) {
  return (
    <Animated.View entering={FadeInDown.duration(420)}>
      <View className="mb-9 flex-row items-center justify-between">
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" className="flex-row items-center gap-2">
            <Text className="text-[18px] text-ink">‹</Text>
            <Text className="text-[13px] font-medium text-muted">Back</Text>
          </Pressable>
        ) : (
          <Text className="text-[18px] font-bold tracking-[0.5px] text-ink">
            Learna<Text className="text-gold"> ✦</Text>
          </Text>
        )}
        <View className="flex-row items-center gap-3">
          <ProgressDots total={3} current={step - 1} />
          <Text className="text-[11px] font-semibold tracking-[0.7px] text-muted">
            {String(step).padStart(2, "0")} / 03
          </Text>
        </View>
      </View>

      <View className="mb-3 self-start rounded-full border border-gold/20 bg-pale-gold px-3 py-1.5">
        <Text className="text-[10px] font-bold tracking-[1.5px] text-gold">
          YOUR JOURNEY · STEP {step}
        </Text>
      </View>
      <Text className="text-[29px] font-bold leading-[35px] tracking-[-0.8px] text-ink">
        {title}
      </Text>
      <Text className="mt-3 text-[14px] leading-[21px] text-muted">{description}</Text>
    </Animated.View>
  );
}
