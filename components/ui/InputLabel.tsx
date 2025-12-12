import { View, Text } from "react-native";

export default function InputLabel({
  label,
  isRequired = true,
}: {
  label: string;
  isRequired?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between mb-2">
      <Text className="text-[15px] font-semibold text-[#444]">
        {label} {!isRequired && <Text>(optional)</Text>}
      </Text>
    </View>
  );
}
