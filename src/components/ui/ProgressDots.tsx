import { View } from "react-native";

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${total}`}
      className="flex-row items-center gap-1.5"
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-[5px] rounded-full ${
            i === current ? "w-7 bg-gold" : i < current ? "w-4 bg-gold/45" : "w-4 bg-line"
          }`}
        />
      ))}
    </View>
  );
}
