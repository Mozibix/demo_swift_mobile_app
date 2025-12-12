import { View, Text } from "react-native";

type BadgeProps = {
  status: string; // i am using string here for the sake of having a fallback, so i cant do 'success' | 'error' | 'active' etc...
};

export default function Badge({ status }: BadgeProps) {
  const COLORS: Record<string, { bg: string; text: string }> = {
    success: {
      bg: "#def7ec",
      text: "#03543f",
    },
    successful: {
      bg: "#def7ec",
      text: "#03543f",
    },
    failed: {
      bg: "#fde8e8",
      text: "#c81e1e",
    },
    declined: {
      bg: "#fde8e8",
      text: "#c81e1e",
    },
    removed: {
      bg: "#fde8e8",
      text: "#c81e1e",
    },
    active: {
      bg: "#e1effe",
      text: "#1e429f",
    },
    inactive: {
      bg: "#e1effe",
      text: "#1e429f",
    },
  };

  const fallback = {
    bg: "#e0e0e0",
    text: "#333333",
  };

  const { bg, text } = COLORS[status] ?? fallback;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 50,
        paddingVertical: 5,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: text, fontWeight: "600" }}>
        {status || "Unknown"}
      </Text>
    </View>
  );
}
