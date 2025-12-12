import { View, Text } from "react-native";

export default function TimeBox({
  minutes,
  seconds,
}: {
  minutes: number;
  seconds: number;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <View className="bg-swiftPayBlue p-2 rounded-lg">
        <Text className="text-white font-bold text-[16px]">{minutes}</Text>
      </View>
      <Text className="font-bold text-[16px]">:</Text>
      <View className="bg-swiftPayBlue p-2 rounded-lg">
        <Text className="text-white font-bold text-[16px]">{seconds}</Text>
      </View>
    </View>
  );
}
