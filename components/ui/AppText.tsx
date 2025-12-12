import { Text as RNText, TextStyle } from "react-native";
import { ReactNode } from "react";
import { cn } from "@/utils";

export default function Text({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: TextStyle;
}) {
  return (
    <RNText
      className={cn("", className)}
      //   style={[{ fontFamily: "SatoshiRegular" }, style]}
      style={[style]}
      //
    >
      {children}
    </RNText>
  );
}
