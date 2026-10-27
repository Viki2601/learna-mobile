import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import type { Difficulty } from "@/types";

const styles: Record<Difficulty, { box: string; text: string; label: string }> = {
    beginner: { box: "bg-green-100", text: "text-green-700", label: "Beginner" },
    intermediate: { box: "bg-amber-100", text: "text-amber-700", label: "Intermediate" },
    advanced: { box: "bg-red-100", text: "text-red-700", label: "Advanced" },
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
    const s = styles[level];
    return (
        <View className={`rounded-full px-2.5 py-1 ${s.box}`}>
            <Text className={`text-xs font-semibold ${s.text}`}>{s.label}</Text>
        </View>
    );
}