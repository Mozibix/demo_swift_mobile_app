import React from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const TransferScreen = () => {
  return (
    <View className="flex-1 p-5 bg-white">
      <View className="items-center mb-5">
        <TouchableOpacity
          className="absolute top-[30px] -left-1 bg-[#f2f2f2] rounded-full p-4"
          onPress={() => router.push("/(tabs)")}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-base font-bold mb-10 text-center mt-[45px]">
          Transfer to Swiffpay Account
        </Text>
      </View>

      <View className="items-center mb-5">
        <Image
          source={require("../assets/icons/userx.jpg")}
          className="w-[100px] h-[100px] rounded-full mb-2.5"
        />
        <Text className="text-lg font-bold">Adeagbo Josiah Developer</Text>
        <Text className="text-sm text-[#7D7D7D]">@ajSoftware50</Text>
      </View>

      <Text className="font-medium mb-1">Amount</Text>
      <TextInput
        className="p-4 rounded-lg text-base mb-5 border border-[#ddd]"
        placeholder="10,000"
        keyboardType="numeric"
      />

      <Text className="font-medium mb-1">Remark</Text>
      <TextInput
        className="p-4 rounded-lg text-base mb-5 border border-[#ddd]"
        placeholder="What is this for"
      />

      <TouchableOpacity className="bg-[#0047FF] py-4 rounded-lg items-center mt-[70px]">
        <Text className="text-white font-bold text-base">Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TransferScreen;
