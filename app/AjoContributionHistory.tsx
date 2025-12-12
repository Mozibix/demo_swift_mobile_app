import React, { useState, useEffect, useCallback, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingComp from "@/components/Loading";
import { showLogs } from "@/utils/logger";
import { formatAmount } from "@/utils";
import { COLORS } from "@/constants/Colors";
import Divider from "@/components/ui/Divider";
import Animated, { FadeInDown } from "react-native-reanimated";

interface ContributionItem {
  name: ReactNode;
  updated_at(arg0: string): React.ReactNode;
  id: string;
  amount: number;
  date: string;
  status: string;
  frequency: string;
  no_of_members: number;
}

const AjoContributionHistory = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [data, setData] = useState<ContributionItem[]>([]);
  const API_BASE_URL = "https://swiftpaymfb.com/api";

  const fetchContributions = async () => {
    try {
      setLoading(true);
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
        `${API_BASE_URL}/ajo-contributions/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response?.data?.status === "success") {
        const responseData =
          response.data?.data?.closed_ajo_contributions || [];
        const newData = responseData;
        setData(newData);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "",
          position: "top",
        });
      }
      setLoading(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  // showLogs("data", data);

  const navigateToAjoDetails = (item: any) => {
    router.push({
      pathname: "/AjoDetails",
      params: {
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        start_date: item.start_date,
        amount: item.amount,
        type: item.type,
        frequency: item.frequency,
        no_of_members: item.no_of_members,
        current_round: item.current_round,
        next_round_date: item.next_round_date,
        hash_id: item.hash_id,
        pivot: item.pivot,
      },
    });
  };
  const renderItem = ({
    item,
    index,
  }: {
    item: ContributionItem;
    index: number;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigateToAjoDetails(item)}
    >
      <Animated.View
        entering={FadeInDown.delay(50 * index)}
        style={styles.contributionCard}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.logo}>
            <Image
              source={require("../assets/piggy.png")}
              style={styles.image}
            />
          </View>
          <View style={styles.contributionHeader}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 3,
                maxWidth: 180,
              }}
            >
              {item.name}
            </Text>
            <Text style={styles.contributionDate} className="capitalize">
              {item.frequency} Savings Deposit
            </Text>
          </View>
        </View>

        <View style={styles.contributionAmount}>
          <Text style={styles.amount}>₦{formatAmount(item.amount)}</Text>
          <Text style={styles.amount2}>
            ₦{formatAmount(item.amount * item.no_of_members)}
          </Text>
        </View>
      </Animated.View>

      {index !== data.length - 1 && <Divider />}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <LoadingComp visible />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("../assets/payments/3.png")}
          style={{
            width: 130,
            height: 130,
            resizeMode: "cover",
          }}
        />
        <Text style={styles.emptyText}>No contribution history found</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Ajo Contribution History</Text>
      </View>

      {loading ? (
        <LoadingComp visible />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
      <Toast />
    </SafeAreaView>
  );
};

export default AjoContributionHistory;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  contributionCard: {
    borderRadius: 10,
    paddingVertical: 16,
    // marginBottom: 5,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  contributionHeader: {
    flexDirection: "column",
    marginBottom: 12,
  },
  contributionDate: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusCompleted: {
    backgroundColor: "rgba(0, 180, 0, 0.1)",
  },
  statusPending: {
    backgroundColor: "rgba(255, 180, 0, 0.1)",
  },
  statusFailed: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusTextCompleted: {
    color: "#008800",
  },
  statusTextPending: {
    color: "#CC7A00",
  },
  statusTextFailed: {
    color: "#CC0000",
  },
  contributionAmount: {},
  amountLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  amount: {
    fontSize: 17,
    marginBottom: 3,
    fontWeight: "600",
    color: COLORS.greenText,
    alignSelf: "flex-end",
  },
  amount2: {
    fontSize: 14,
    marginBottom: 3,
    alignSelf: "flex-end",
    color: "#666",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginTop: 16,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#D7E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
});
