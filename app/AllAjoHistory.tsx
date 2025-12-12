import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { AntDesign, Ionicons, Fontisto } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import LoadingComp from "@/components/Loading";
import { Image } from "expo-image";
import { COLORS } from "@/constants/Colors";
import { showLogs } from "@/utils/logger";
import { formatAmount, formatDateAgo } from "@/utils";
import Card from "@/components/ui/Card";

interface AjoSaving {
  id: number;
  type: string;
  amount: number;
  balance: number;
  end_date: string;
  status: string;
  payment_method: string;
  amount_earned: number;
  created_at: string;
  days_left: number;
  duration: number;
}

interface SectionData {
  title: string;
  data: AjoSaving[];
}

const AllAjoHistory = () => {
  const [transactions, setTransactions] = useState<AjoSaving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
        });
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        "https://swiftpaymfb.com/api/ajo-savings/history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showLogs("Saving history:", response?.data?.data);

      setTransactions(response?.data?.data);
      setError(null);
    } catch (error: any) {
      setError("Failed to fetch transactions");
      Toast.show({
        type: "error",
        text1:
          error.response?.data?.message || "Failed to fetch savings details",
        text2: "Oops, something went wrong",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const openSavings = transactions.filter((item) => item.status !== "closed");
  const closedSavings = transactions.filter((item) => item.status === "closed");

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchTransactions}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTransactionItem = ({ item: saving }: { item: AjoSaving }) => (
    <View key={saving.id} style={styles.transactionItem}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ flex: 1, flexDirection: "row" }}
        onPress={() =>
          router.push({
            pathname: "/AjoSavingsDetails",
            params: { hash_id: saving.id },
          })
        }
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: COLORS.swiftPayBlue },
          ]}
        >
          {saving.status === "closed" ? (
            <Image
              source={{ uri: "https://swiftpaymfb.com/ajo-savings-icon.png" }}
              style={{ height: 30, width: 30 }}
            />
          ) : (
            <Ionicons
              name={"checkmark-circle"}
              size={24}
              color={getIconColor(saving.status)}
            />
          )}
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.title}>{saving.type} Ajo Savings</Text>
          <Text style={styles.date}>
            Amount Earned:{" "}
            <Text className="font-semibold">
              ₦{formatAmount(saving.amount_earned)}
            </Text>
          </Text>
          <Text style={styles.date}>
            Closed {formatDateAgo(saving.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSection = ({ item }: { item: SectionData }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      {item.data.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Image
            source={require("../assets/payments/4.png")}
            style={{
              height: 150,
              width: 150,
            }}
          />
          <Text style={styles.emptyStateText}>
            No {item.title.toLowerCase()} found
          </Text>
        </View>
      ) : (
        item.data.map((saving: AjoSaving) => (
          <React.Fragment key={saving.id}>
            {renderTransactionItem({ item: saving })}
          </React.Fragment>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <GestureHandlerRootView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()}>
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajo Savings History</Text>
          <View style={styles.headerSpace} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.container}
        >
          {transactions.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Image
                source={require("../assets/payments/4.png")}
                style={{
                  height: 150,
                  width: 150,
                }}
              />
              <Text style={styles.emptyStateText}>No savings found</Text>
            </View>
          ) : (
            <FlatList
              data={[
                { title: "Open Savings", data: openSavings },
                { title: "Closed Savings", data: closedSavings },
              ]}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderSection}
              contentContainerStyle={styles.flatListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ScrollView>
      </GestureHandlerRootView>
      <Toast />
    </SafeAreaView>
  );
};

// Helper functions for colors
const getAmountColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "#00C851";
    case "failed":
      return "#FF4444";
    case "pending":
      return "#FFBB33";
    default:
      return "#000";
  }
};

const getIconColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "green";
    case "failed":
      return "grey";
    case "closed":
      return "grey";
    default:
      return "#000";
  }
};
const getBgColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "#00C851";
    case "failed":
      return "#FF4444";
    case "closed":
      return "#FFE896";
    default:
      return "#000";
  }
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  headerSpace: {
    width: 24,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#0000ff",
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 9,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginTop: 4,
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  transactionStatus: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    padding: 4,
    paddingHorizontal: 20,
    borderRadius: 5,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  flatListContent: {
    padding: 16,
  },
});

export default AllAjoHistory;
