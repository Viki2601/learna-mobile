import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { AppText as Text } from "@/components/ui/AppText";

interface SelectCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  animationDelay?: number;
}

export function SelectCard({ icon, title, description, selected, onPress, animationDelay = 0 }: SelectCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(animationDelay).duration(380)} layout={LinearTransition.springify().damping(18)}>
      <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} className={`min-h-[112px] flex-row items-center gap-4 rounded-[24px] border p-5 active:opacity-90 ${selected ? "border-gold bg-pale-gold" : "border-line bg-white"}`}>
        <View className={`h-[54px] w-[54px] items-center justify-center rounded-[18px] ${selected ? "bg-gold" : "bg-paper"}`}>
          <Ionicons name={icon} size={25} color={selected ? "#FFFFFF" : "#77736C"} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-[16px] font-semibold text-ink">{title}</Text>
            <View className={`h-[22px] w-[22px] items-center justify-center rounded-full border ${selected ? "border-gold bg-gold" : "border-line bg-white"}`}>
              {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
            </View>
          </View>
          <Text className="mt-1.5 text-[12px] leading-[18px] text-muted">{description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}