import { View, Text } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { COLORS } from "@/constants/Colors";

export default function ErrorInfo({
  message,
  classNames,
}: {
  message: string;
  classNames?: string;
}) {
  return (
    <View
      className={`flex-row items-center gap-2 bg-[#fde8e8] p-[8px] rounded-lg mb-3 ${classNames}`}
      style={{ backgroundColor: "#fde8e8" }}
    >
      <FontAwesome6 name="info" size={15} color={COLORS.danger} />
      <Text className="text-danger">{message}</Text>
    </View>
  );
}
