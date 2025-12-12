import { useState } from "react";
import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useReferralsPage } from "@/hooks/useApi";
import { formatAmount, formatBalance, getInitials } from "@/utils";
import { showLogs } from "@/utils/logger";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  FontAwesome6,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IS_ANDROID_DEVICE } from "@/constants";

export default function SendAfricaReceiveMoney() {
  const router = useRouter();
  const [copyLinkText, setCopyLinkText] = useState("Copy Link");
  const [copyRCText, setCopyRCText] = useState("Copy Referral Code");
  const {
    isLoading,
    isPending,
    isError,
    data: referrals,
    refetch,
  } = useReferralsPage();

  if (isLoading || isPending) {
    return <LoadingComp visible />;
  }

  if (isError) {
    <View className="flex-1 h-screen items-center justify-center">
      <Text className="font-bold text-[20px]">Something went wrong</Text>
      <Text className="text-[17px] text-gray-700">Let's try this again</Text>
      <Button text="Retry" onPress={refetch} />
    </View>;
  }

  function handleCopy(type: "link" | "code") {
    const itemToCopy =
      type === "link"
        ? referrals?.data.referral_link
        : referrals?.data.ajo_savings_referral_code;

    Clipboard.setStringAsync(itemToCopy || "");

    if (type === "link") {
      setCopyLinkText("Copied!");
    } else {
      setCopyRCText("Copied!");
    }

    setTimeout(() => {
      setCopyLinkText("Copy Link");
      setCopyRCText("Copy Referral Code");
    }, 3000);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: IS_ANDROID_DEVICE ? 30 : 0, paddingLeft: 10 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
          marginHorizontal: 15,
          paddingTop: IS_ANDROID_DEVICE ? 30 : 0,
        }}
      >
        <View className="flex-row items-start">
          <Text className="text-[17px] max-w-[80%]">
            Share your referral link with your friends and earn{" "}
            <Text style={{ fontWeight: "700" }}>
              ₦{formatAmount(referrals?.data.referral_bonus_amount ?? 0)}
            </Text>{" "}
            for each successful referral
          </Text>
          <Image
            source={require("../assets/referral-icon.webp")}
            style={{ width: 100, height: 100 }}
          />
        </View>

        <View className="mt-5">
          <Card>
            <Text className="text-[17px] font-medium">
              SwiftPay Referral Link
            </Text>

            <TextInput
              style={styles.input}
              value={referrals?.data.referral_link}
              editable={false}
            />

            <Button
              asChild
              onPress={() => handleCopy("link")}
              classNames="flex-row items-center justify-center gap-3 -mt-2 p-4"
            >
              <Feather name="copy" size={22} color="#fff" />
              <Text className="text-white text-[17px] font-bold">
                {copyLinkText}
              </Text>
            </Button>
          </Card>
        </View>

        <View className="mt-5">
          <Card>
            <Text className="text-[17px] font-medium">
              Ajo Savings Referral Code
            </Text>

            <TextInput
              style={styles.input}
              value={referrals?.data.ajo_savings_referral_code}
              editable={false}
            />

            <Button
              asChild
              outlined
              onPress={() => handleCopy("code")}
              classNames="flex-row items-center justify-center gap-3 -mt-2 p-4"
            >
              <FontAwesome5 name="copy" size={22} color="#1400FB" />
              <Text className="text-swiftPayBlue text-[17px] font-bold">
                {copyRCText}
              </Text>
            </Button>
          </Card>
        </View>

        <View className="mt-5">
          <Card>
            <Text className="text-[17px] font-medium">Total Earnings</Text>
            <Text className="text-[28px] font-bold text-swiftPayBlue">
              ₦{formatBalance(referrals?.data.amount_earned ?? 0)}
            </Text>
          </Card>
        </View>

        <View className="mt-5">
          <Text className="text-[20px] font-medium">Referrals</Text>

          <Card classNames="mt-2">
            <FlatList
              data={referrals?.data.referrals}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: referral }) => (
                <View className="flex-row items-center mb-4">
                  {referral.profile_photo ? (
                    <Image
                      source={{
                        uri: referral.profile_photo,
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 50,
                        marginRight: 6,
                      }}
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-[#c6d9ff] justify-center items-center mr-3">
                      <Text className="text-[#0000ff] font-semibold text-[17px]">
                        {getInitials(
                          referral.first_name + " " + referral.last_name
                        )}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text className="text-[16px] font-semibold text-black">
                      {referral.first_name + " " + referral.last_name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      @{referral.username}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <View className="items-center justify-center">
                  <FontAwesome6 name="users" size={34} color="#444" />
                  <Text className="mt-3 font-medium text-[17px]">
                    You have no referrals yet
                  </Text>
                </View>
              )}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: "#f7f7f7",
    borderRadius: 10,
    padding: 18,
    marginVertical: 10,
    backgroundColor: "#f7f7f7",
    marginBottom: 20,
    fontWeight: "500",
    fontSize: 15,
  },
});
