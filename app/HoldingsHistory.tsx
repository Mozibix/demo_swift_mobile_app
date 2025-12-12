import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Collapsible from "react-native-collapsible";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useHoldingsHistory } from "../hooks/useApi";
import { router } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { showLogs } from "@/utils/logger";
import { _TSFixMe, formatDateShort } from "@/utils";
import LoadingComp from "@/components/Loading";

const HoldingsHistory = () => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data, isLoading, error } = useHoldingsHistory();
  let holdingHistoryData = (data?.data as _TSFixMe)?.completed_holdings;

  // showLogs("Holding History:", holdingHistoryData);

  const toggleCollapse = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  const getAssetIcon = (assetType: string) => {
    if (assetType.toLowerCase() === "fiat") {
      return require("../assets/icons/bitcoin.png");
    }
    if (assetType.toLowerCase() === "metal") {
      return require("../assets/icons/gold.png");
    }
  };

  const renderCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.6}
        style={styles.cardHeader}
        onPress={() => toggleCollapse(item.id.toString())}
      >
        <Image source={{ uri: item.icon_url }} style={styles.icon} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.asset_name}</Text>
          <Text style={styles.cardType}>{item.asset_type}</Text>
        </View>
        <Icon
          name={
            activeId === item.id.toString()
              ? "keyboard-arrow-up"
              : "keyboard-arrow-down"
          }
          size={22}
          color="#757575"
        />
      </TouchableOpacity>
      <Collapsible collapsed={activeId !== item.id.toString()}>
        <View style={styles.cardBody}>
          <View style={styles.flex}>
            <View style={styles.bodyText}>
              <Text style={styles.label}>Amount Invested</Text>
              <Text style={styles.value}>₦{item.amount.toLocaleString()}</Text>
            </View>
            <View style={[styles.bodyText, { alignItems: "flex-end" }]}>
              <Text style={styles.label}>Asset Amount</Text>
              <Text style={styles.value}>
                {item.asset_amount} ({item.asset_symbol})
              </Text>
            </View>
          </View>

          <View style={styles.flex}>
            <View style={styles.bodyText}>
              <Text style={styles.label}>Amount Returned</Text>
              <Text
                style={[
                  styles.value,
                  {
                    color:
                      item.amount_earned > item.amount ? "#046c4e" : "#c81e1e",
                  },
                ]}
              >
                ₦{item.amount_earned.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.bodyText, { alignItems: "flex-end" }]}>
              <Text style={styles.label}>Profit/Lost</Text>
              <Text
                style={[
                  styles.value,
                  {
                    color:
                      item.amount_earned > item.amount ? "#046c4e" : "#c81e1e",
                  },
                ]}
              >
                {(item.amount_earned - item.amount).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.flex}>
            <View style={styles.bodyText}>
              <Text style={styles.label}>Initial Rate</Text>
              <Text style={styles.value}>
                ₦{item.naira_start_rate.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.bodyText, { alignItems: "flex-end" }]}>
              <Text style={styles.label}>End Rate</Text>
              <Text
                style={[
                  styles.value,
                  {
                    color:
                      item.naira_end_rate > item.naira_start_rate
                        ? "#046c4e"
                        : "#c81e1e",
                  },
                ]}
              >
                ₦{item.naira_end_rate.toLocaleString()}
              </Text>
            </View>
            {/* <View style={styles.bodyText}>
              <Text style={styles.label}>Status</Text>
              <Text
                style={[
                  styles.statusText,
                  item.status.toLowerCase() === "completed" &&
                    styles.completedStatus,
                ]}
              >
                {item.status}
              </Text>
            </View> */}
          </View>

          <View style={styles.bodyText}>
            <Text style={styles.label}>Date Completed</Text>
            <Text style={styles.value}>{formatDateShort(item.end_date)}</Text>
          </View>
        </View>
      </Collapsible>
    </View>
  );

  if (isLoading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load holdings history</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={{ marginBottom: 15 }}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <AntDesign name="left" size={20} />
          </TouchableOpacity>
          <Text style={styles.heading}>Your Holdings History</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {holdingHistoryData && holdingHistoryData.length > 0 ? (
            <FlatList
              data={holdingHistoryData}
              renderItem={renderCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          ) : (
            <View className="flex items-center justify-center mt-14">
              <Image
                source={require("../assets/payments/6.png")}
                style={{
                  width: 180,
                  height: 180,
                  resizeMode: "cover",
                }}
              />
              <Text style={styles.noDataText}>
                No holdings history available
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HoldingsHistory;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    // justifyContent: "",
    // paddingVertical: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
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
  },
  cardBody: {
    padding: 16,
  },
  bodyText: {
    // fontSize: 11,
    marginBottom: 5,
    flexDirection: "column",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  flex: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingVertical: 3,
  },
  value: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000000",
  },
  icon: {
    height: 35,
    width: 35,
    borderRadius: 50,
    objectFit: "fill",
    marginRight: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 5,
    textAlign: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  completedStatus: {
    backgroundColor: "#00DE4B21",
    color: "#0CBC8B",
  },
});
