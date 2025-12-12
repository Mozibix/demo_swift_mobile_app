import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useFocusEffect, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { formatCurrency, formatDate } from "@/utils/formatters";
import LoadingComp from "@/components/Loading";
import { AfricaTransaction, apiService, UserProfile } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/Colors";
import { showLogs } from "@/utils/logger";
import { formatAmount } from "@/utils";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";

const InternationalTransfer = () => {
  const [Loading, setLoading] = useState(true);
  const [transactions, settransactions] = useState<AfricaTransaction[]>([]);
  const [TotalVolume, setTotalVolume] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { setTransferSource } = useMultipleTransfer();
  const router = useRouter();

  const renderTransactionItem = ({ item }: { item: AfricaTransaction }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.transactionItem}
      onPress={() => {
        showLogs("item", item);
        router.push({
          pathname: "/TransactionReceipt",
          params: {
            currentTransaction: JSON.stringify(item),
            fromHistory: "true",
            fromSendAfrica: "true",
          },
        });
      }}
    >
      <Image source={{ uri: item.profile_pic }} style={styles.profileImage} />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionName}>{item.account_name}</Text>
        <Text style={styles.transactionPhone}>{item.type}</Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text
          style={[
            styles.transactionAmount,
            {
              color:
                item.status == "pending"
                  ? "orange"
                  : item.status == "failed"
                  ? COLORS.danger
                  : COLORS.greenText,
            },
          ]}
        >
          ₦{formatAmount(+item.amount)}
        </Text>
        <Text style={styles.transactionPhone}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  // Function to share the referral link
  const shareReferralLink = async () => {
    try {
      const result = await Share.share({
        message:
          "Join SwiftPay and start sending money internationally with ease! Use my referral link to sign up: https://swiftpay.com/referral-code",
        title: "SwiftPay Referral",
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Activity type on iOS
        } else {
          // Shared successfully
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sharing referral link:", error.message);
      } else {
        console.error("An unknown error occurred");
      }
    }
  };

  const fetchCryptoData = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await apiService.getSendAfricaPage();
      // showLogs("response", response.data);
      setTotalVolume(response.data.totalVolume);
      settransactions(response.data.transfers);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to fetch page data",
        text2: error.response?.data?.message || "An error occurred",
        position: "bottom",
      });
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return router.push("/login");
      }
      router.back();
      console.error("Error fetching crypto buy page:", error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      setUserProfile(response);
      console.log(response);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch profile"
      );
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
      fetchCryptoData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView className="mx-2" showsVerticalScrollIndicator={false}>
        <LoadingComp visible={Loading} />
        {/* Dashboard Card */}
        <ImageBackground
          source={require("../assets/background.png")}
          style={styles.dashboardCard}
          resizeMode="contain"
          imageStyle={{
            borderRadius: 10,
            alignSelf: "flex-end",
            left: 179,
            width: "65%",
            height: "65%",
            top: -10,
          }}
        >
          <View style={styles.dashboardContent}>
            <View style={styles.flexTitle}>
              <View>
                <Text style={styles.balanceTitle}>SwiftPay Balance</Text>
                <Text style={styles.subTitle}>International Transfers</Text>
              </View>
            </View>
            <View style={styles.flex}>
              <Text style={styles.balanceAmount}>
                ₦{formatCurrency(userProfile ? userProfile?.wallet_balance : 0)}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.depositButton}
              onPress={() => router.push("/AddMoney")}
            >
              <Text style={styles.depositButtonText}>Deposit</Text>
            </TouchableOpacity>
            <View style={styles.transactionVolumeContainer}>
              <Text style={styles.transactionVolumeTitle}>
                Transaction Volume
              </Text>
              <View style={styles.flexVolume}>
                <Text style={styles.subttext}>Total Transfer</Text>
                <Text style={styles.transactionVolumeAmount}>
                  ₦{formatCurrency(TotalVolume)}
                </Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.actionButton}
                onPress={() => {
                  router.push("/(tabs)/transfer");
                  setTransferSource("send_to_africa");
                }}
              >
                <Ionicons name="paper-plane-outline" size={16} color="#000" />
                <Text style={styles.actionButtonText}>Send Money</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.actionButton}
                onPress={() => router.push("SendAfricaReceiveMoney")}
              >
                <MaterialCommunityIcons
                  name="call-received"
                  size={16}
                  color="#000"
                />
                <Text style={styles.actionButtonText}>Receive Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Recent Transactions */}
        <Text style={styles.recentTransactionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.reference}
          style={styles.transactionList}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-6">
              <Image
                source={require("../assets/payments/1.png")}
                style={{ height: 100, width: 100 }}
              />
              <Text className="font-semibold text-[20px]">
                No recent transactions
              </Text>
              <Text className="text-[15px] text-gray-200">
                Any transaction you make will show here
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default InternationalTransfer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  dashboardCard: {
    width: "100%",
    height: 300,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: "#0000ff",
    // marginTop: 40,
    resizeMode: "contain",
  },
  dashboardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  balanceTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  subTitle: {
    fontSize: 14,
    color: "#fff",
  },
  balanceAmount: {
    fontSize: 21,
    color: "#fff",
    fontWeight: "700",
  },
  depositButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: -15,
  },
  depositButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0000ff",
  },
  transactionVolumeContainer: {
    backgroundColor: "#1FF4",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "column",
  },
  transactionVolumeTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  transactionVolumeAmount: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    marginLeft: 8,
    fontWeight: "bold",
  },
  recentTransactionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#0000ff",
    width: 160,
    borderRadius: 5,
  },
  transactionList: {
    marginVertical: 10,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 3,
    borderColor: "#ccc",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontWeight: "bold",
  },
  transactionPhone: {
    color: "#888",
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontWeight: "bold",
    fontSize: 16,
  },
  transactionStatus: {
    fontSize: 12,
  },
  flex: {
    flexDirection: "row",
    marginBottom: 10,
    marginRight: 10,

    gap: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  flexTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  flexVolume: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  subttext: {
    color: "#fff",
  },
});
