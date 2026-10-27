import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
    name: IconName;
    color: ColorValue;
    size: number;
};

export function TabIcon({ name, color, size }: Props) {
    return <Ionicons name={name} color={color as string} size={size} />;
}