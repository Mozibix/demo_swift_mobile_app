import { View, Text, SafeAreaView, ScrollView } from "react-native";
import { MaterialIcons, Feather, Entypo } from "@expo/vector-icons";
import { COLORS } from "@/constants/Colors";
import Button from "@/components/ui/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { showLogs } from "@/utils/logger";
import { useState } from "react";

export default function AjoContibutionCreated() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const ajoData = JSON.parse(data as string);
  const [text, setText] = useState(ajoData.hash_id);
  const [linkText, setLinkText] = useState("Copy Link");

  // showLogs("ajoData", ajoData);

  function handleCopy(type: "link" | "code") {
    const code = ajoData.hash_id;
    console.log("code", code);
    const link = `https://swiftpaymfb.com/ajo-contributions/join?code=${code}`;
    Clipboard.setStringAsync(
      type === "link" ? link.toString() : code.toString()
    );
    type === "link" ? setLinkText("Copied!") : setText("Copied!");
    setTimeout(
      () =>
        type === "link" ? setLinkText("Copy Link") : setText(ajoData.hash_id),
      2000
    );
  }

  function navigateToAjoDetails() {
    router.push({
      pathname: "/AjoDetails",
      params: {
        id: ajoData.id,
        name: ajoData.name,
        description: ajoData.description,
        status: ajoData.status,
        start_date: ajoData.start_date,
        amount: ajoData.amount,
        type: ajoData.type,
        frequency: ajoData.frequency,
        no_of_members: ajoData.no_of_members,
        current_round: ajoData.current_round,
        next_round_date: ajoData.next_round_date,
        hash_id: ajoData.hash_id,
        pivot: ajoData.pivot ?? {},
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="mx-5">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 150,
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-3 bg-[#F2F2F2] rounded-lg">
            <Feather name="thumbs-up" size={70} color={COLORS.swiftPayBlue} />
          </View>
          <Text className="font-bold text-[20px] mt-5">
            Ajo Contribution Created
          </Text>
          <Text className="text-gray-600 mt-2 mb-6 text-[17px] text-center">
            Use the code below to invite your friends to join the group
          </Text>
          <Button
            outlined
            asChild
            full
            text={ajoData.hash_id}
            onPress={() => handleCopy("code")}
            classNames="flex-row items-center justify-center gap-x-3 w-full"
          >
            <Text className="font-bold text-[17px] text-swiftPayBlue">
              {text}
            </Text>
            <MaterialIcons
              name="content-copy"
              size={24}
              color={COLORS.swiftPayBlue}
            />
          </Button>

          <Button
            full
            asChild
            onPress={() => handleCopy("link")}
            classNames="flex-row items-center justify-center gap-x-3"
          >
            <Entypo name="link" size={26} color="#fff" />
            <Text className="text-white font-bold text-[17px] uppercase mr-5">
              {linkText}
            </Text>
          </Button>
          <Button
            outlined
            full
            text="Proceed to Group"
            uppercased
            onPress={navigateToAjoDetails}
            classNames="mt-[35px]"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
