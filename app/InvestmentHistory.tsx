import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Collapsible from "react-native-collapsible";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useInvestmentHistory } from "@/hooks/useApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { showLogs } from "@/utils/logger";
import { Image } from "expo-image";
import { COLORS } from "@/constants/Colors";
import LoadingComp from "@/components/Loading";
import { IS_ANDROID_DEVICE } from "@/constants";
import Animated, { LinearTransition } from "react-native-reanimated";
import { _TSFixMe, formatAmount } from "@/utils";

const getAssetIcon = (asset_type: string): any => {
  switch (asset_type.toLowerCase()) {
    case "stock":
      return require("../assets/icons/chart.png");
    case "crypto":
      return require("../assets/icons/bitcoin.png");
    case "bond":
      return require("../assets/icons/chart1.png");
    case "mutual_fund":
      return require("../assets/icons/banking.png");
    default:
      return require("../assets/icons/ethereum.png");
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const InvestmentHistory = () => {
  const { data, isLoading, error } = useInvestmentHistory();
  const [activeId, setActiveId] = useState<number | null>(null);

  // showLogs("data", data);

  const toggleCollapse = (id: number) => {
    setActiveId(activeId === id ? null : id);
  };

  const renderCard = ({ item }: { item: any }) => {
    // Calculate profit/loss amount
    const profitLoss = item.amount_earned - item.amount_invested;
    const isProfitable = profitLoss >= 0;
    // showLogs("item", item);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleCollapse(item.id)}
        >
          <Image
            source={{
              uri:
                item.asset_type === "stock"
                  ? "https://swiftpaymfb.com/trend.png"
                  : item.asset_icon_url,
            }}
            style={styles.icon}
          />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.asset_name}</Text>
            <Text style={styles.cardType}>{item.asset_type}</Text>
          </View>
          <Icon
            name={
              activeId === item.id ? "keyboard-arrow-up" : "keyboard-arrow-down"
            }
            size={24}
            color="#757575"
          />
        </TouchableOpacity>
        <Collapsible collapsed={activeId !== item.id}>
          <Animated.View layout={LinearTransition.springify().damping(14)}>
            <View style={styles.cardBody}>
              <View style={styles.flex}>
                <View style={styles.bodyText}>
                  <Text style={styles.label}>Amount Invested</Text>
                  <Text style={styles.value}>
                    ₦{formatAmount(item.amount_invested)}
                  </Text>
                </View>

                <View style={styles.bodyText}>
                  <Text style={styles.label}>Amount Returned</Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color:
                          item.amount_earned > item.amount_invested
                            ? COLORS.greenText
                            : COLORS.red,
                      },
                    ]}
                  >
                    ₦{formatAmount(item.amount_earned)}
                  </Text>
                </View>
              </View>

              <View style={styles.flex}>
                <View style={styles.bodyText}>
                  <Text style={styles.label}>Initial Rate</Text>
                  <Text style={styles.value}>{item.change_percentage}%</Text>
                </View>

                <View style={styles.bodyText}>
                  <Text style={[styles.label, { maxWidth: 100 }]}>
                    Final Percentage Change
                  </Text>
                  <Text style={styles.value}>
                    {item.final_change_percentage?.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={styles.flex}>
                <View style={styles.bodyText}>
                  <Text style={styles.label}>Profit/Loss</Text>
                  <Text
                    style={[
                      styles.value,
                      { color: isProfitable ? COLORS.greenText : COLORS.red },
                    ]}
                  >
                    ₦ {isProfitable ? "+" : "-"}
                    {formatAmount(Math.abs(profitLoss))}
                  </Text>
                </View>

                <View style={styles.bodyText}>
                  <Text style={styles.label}>Date Completed</Text>
                  <Text style={styles.value}>{formatDate(item.end_date)}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </Collapsible>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load investment history.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/InvestmentHistory")}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedInvestments =
    (data?.data as _TSFixMe)?.completed_investments || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="left" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment History</Text>
        <View style={{ width: 20 }} />
      </View>

      {completedInvestments.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Image
            source={require("../assets/payments/2.png")}
            style={{
              height: 250,
              width: 250,
            }}
          />
          <Text style={styles.noDataText}>No completed investments found.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.heading}>Your Completed Investments</Text>
          <FlatList
            data={completedInvestments}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default InvestmentHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingTop: IS_ANDROID_DEVICE ? 16 : 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardType: {
    fontSize: 14,
    color: "#757575",
    textTransform: "capitalize",
  },
  cardBody: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  bodyText: {
    marginBottom: 8,
    flexDirection: "column",
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  flex: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  value: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000000",
  },
  icon: {
    height: 30,
    width: 30,
    borderRadius: 50,
    marginRight: 12,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    fontWeight: "600",
  },
});
