import { forwardRef, type ElementRef } from "react";
import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { cssInterop } from "nativewind";

interface AppTextProps extends TextProps {
  className?: string;
}

const AppTextBase = forwardRef<ElementRef<typeof NativeText>, AppTextProps>(({ style, ...props }, ref) => {
  const resolvedStyle = StyleSheet.flatten(style);
  const weight = resolvedStyle?.fontWeight;
  const isBold =
    weight === "bold" ||
    (typeof weight === "number" && weight >= 600) ||
    (typeof weight === "string" && Number(weight) >= 600);

  return (
    <NativeText
      {...props}
      ref={ref}
      style={[
        { fontFamily: resolvedStyle?.fontFamily ?? (isBold ? "NexaBold" : "NexaLight") },
        style,
      ]}
    />
  );
});

AppTextBase.displayName = "AppText";

export const AppText = cssInterop(AppTextBase, { className: "style" });
