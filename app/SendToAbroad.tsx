import React, { useEffect, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import {
  apiService,
  AbroadTransaction,
  SendAbroadPageResponse,
} from "../services/api";
import Toast from "react-native-toast-message";
import { formatDate } from "@/utils/formatters";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingComp from "@/components/Loading";
import { COLORS } from "@/constants/Colors";
import { formatDistanceToNow } from "date-fns";
import { formatAmount } from "@/utils";

interface Transaction {
  id: string;
  recipient_name: string;
  recipient_account_number: string;
  recipient_amount: string;
  status: string;
  statusColor: string;
  created_at: string;
  description: string;
  amount_deducted_in_local_currency: string;
  recipient_currency: string;
}

const SendToAbroad = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactionVolume, setTransactionVolume] = useState<number | null>(
    null
  );
  const [rate, setRate] = useState(0);
  const [transactions, setTransactions] = useState<AbroadTransaction[]>([]);

  useEffect(() => {
    fetchSendAbroadData();
  }, []);

  const fetchSendAbroadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSendAbroadPage();

      if (response.status === "success" && response.data) {
        // setBalance(response.data.wallet_balance || 0);
        setTransactionVolume(response.data.totalVolume || 0);
        setRate(response.data.exchange_rate || 0);
        setTransactions(response.data.transfers || []);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load data",
        });
        // Set default values when API fails
        setBalance(0);
        setTransactionVolume(0);
      }
    } catch (error) {
      // Set default values when API fails
      setBalance(0);
      setTransactionVolume(0);

      if (error instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "An unknown error occurred",
        });
      }

      // Fallback to sample data if API fails
      setTransactions([
        {
          id: 1,
          name: "Ose Ose",
          phone: "9839823930832",
          amount: "+$200",
          status: "Sent",
          statusColor: "green",
          date: "2025-03-15",
        },
        {
          id: 2,
          name: "Jane Smith",
          phone: "1234567890",
          amount: "+$350",
          status: "Pending",
          statusColor: "orange",
          date: "2025-03-14",
        },
        {
          id: 3,
          name: "John Doe",
          phone: "9876543210",
          amount: "+$175",
          status: "Failed",
          statusColor: "red",
          date: "2025-03-13",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getRandomColor = () => {
    const colors = [
      "#FF6B6B",
      "#6BCB77",
      "#4D96FF",
      "#FFB703",
      "#8338EC",
      "#FF9F1C",
      "#00B4D8",
      "#F15BB5",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const initials = getInitials(item.recipient_name);
    const bgColor = getRandomColor();

    return (
      <View style={styles.transactionItem}>
        <View
          style={[
            styles.profileImage,
            {
              backgroundColor: bgColor,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 25 }}>
            {initials}
          </Text>
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionName}>{item.recipient_name}</Text>
          <Text style={styles.transactionCreated}>
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
          </Text>
        </View>

        <View style={styles.transactionAmountContainer}>
          <Text
            style={[
              styles.transactionAmount,
              {
                color:
                  item.status === "pending"
                    ? "orange"
                    : item.status === "failed"
                    ? COLORS.red
                    : COLORS.greenText,
                fontSize: 17,
              },
            ]}
          >
            {formatAmount(+item.recipient_amount)} {item.recipient_currency}
          </Text>
          <Text
            style={[
              styles.transactionStatus,
              {
                color:
                  item.status === "pending"
                    ? "orange"
                    : item.status === "failed"
                    ? COLORS.red
                    : COLORS.greenText,
                fontSize: 15,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView className="mx-5" showsVerticalScrollIndicator={false}>
        <LoadingComp visible={loading} />

        <ImageBackground
          source={require("../assets/abroad.png")}
          style={styles.dashboardCard}
          imageStyle={{
            borderRadius: 10,
            alignSelf: "flex-end",
            left: 210,
            width: "48%",
            height: "50%",
            top: 5,
            resizeMode: "contain",
          }}
          resizeMode="contain"
        >
          <View style={styles.dashboardContent}>
            <View style={styles.flexTitle}>
              <View>
                <Text style={styles.balanceTitle}>Total Transfer</Text>
                {/* <Text style={styles.subTitle}>International Transfers</Text> */}
              </View>
            </View>
            <View style={styles.flex}>
              <Text style={styles.balanceAmount}>
                ₦{formatAmount(transactionVolume || 0)}
              </Text>
              {/* <TouchableOpacity
              style={styles.depositButton}
              onPress={() => router.push("/AddMoney")}
            >
              <Text style={styles.depositButtonText}>Deposit</Text>
            </TouchableOpacity> */}
            </View>
            <View style={styles.transactionVolumeContainer}>
              <Text style={styles.transactionVolumeTitle}>
                Transaction Volume
              </Text>
              <View style={styles.flexVolume}>
                <Text style={styles.subttext}>Total Transfer</Text>
                <Text style={styles.transactionVolumeAmount}>
                  ₦{formatAmount(transactionVolume || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.6}
                style={[
                  styles.actionButton,
                  { width: "100%", justifyContent: "center" },
                ]}
                onPress={() => router.push("/TransferAbroad")}
              >
                <Ionicons name="paper-plane-outline" size={16} color="#000" />
                <Text style={styles.actionButtonText}>Send Abroad</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
              style={styles.actionButton}
              onPress={shareReferralLink}
            >
              <MaterialCommunityIcons
                name="call-received"
                size={16}
                color="#000"
              />
              <Text style={styles.actionButtonText}>Receive Money</Text>
            </TouchableOpacity> */}
            </View>
          </View>
        </ImageBackground>

        {/* Recent Transactions */}
        <Text style={styles.recentTransactionTitle}>Recent Transactions</Text>
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.transactionList}
          />
        ) : (
          <View style={styles.noTransactionsContainer}>
            <Image
              source={require("../assets/payments/5.png")}
              style={{
                width: 150,
                height: 150,
                resizeMode: "contain",
              }}
            />
            <Text style={styles.noTransactionsText}>
              No recent transactions
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SendToAbroad;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  dashboardCard: {
    width: "100%",
    height: 300,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: "#0000ff",
    marginTop: 40,
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
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
  },
  depositButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  depositButtonText: {
    fontSize: 16,
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
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    // borderWidth: 3,
    // borderColor: "#ccc",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontWeight: "700",
    fontSize: 17,
    maxWidth: 170,
  },
  transactionCreated: {
    color: "#888",
    marginTop: 3,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontWeight: "bold",
  },
  transactionStatus: {
    fontSize: 12,
  },
  flex: {
    flexDirection: "row",
    marginBottom: 10,
    marginRight: 10,
    gap: 20,
    marginTop: -20,
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
    marginBottom: 20,
    marginTop: 20,
  },
  flexVolume: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subttext: {
    fontSize: 14,
    color: "#fff",
  },
  noTransactionsContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noTransactionsText: {
    fontSize: 16,
    color: "#666",
  },
});
