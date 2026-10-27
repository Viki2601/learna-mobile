import { Pressable, View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import type { DifficultyFilter } from "@/lib/filterTopics";

const options: { value: DifficultyFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

type Props = {
    value: DifficultyFilter;
    onChange: (value: DifficultyFilter) => void;
};

export function FilterChips({ value, onChange }: Props) {
    return (
        <View className="flex-row flex-wrap gap-2">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <Pressable key={o.value} onPress={() => onChange(o.value)} className={`rounded-full border px-3 py-1.5 ${active ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"}`}>
                        <Text className={`text-sm font-medium ${active ? "text-white" : "text-slate-700"}`}>
                            {o.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}