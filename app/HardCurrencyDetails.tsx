import { AntDesign } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Toast from "react-native-toast-message";
import { LineChart } from "react-native-chart-kit";
import LoadingComp from "@/components/Loading";
import { Image } from "expo-image";
import { showLogs } from "@/utils/logger";
import { COLORS } from "@/constants/Colors";
import { formatAmount, formatDateShort } from "@/utils";
import AssetChart from "@/components/AssetChart";

const screenWidth = Dimensions.get("window").width;

const HardCurrencyDetails = () => {
  const { id, assetType, assetName, assetSymbol } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [assetData, setAssetData] = useState<any>(null);

  console.log({ assetSymbol, assetName, assetType });

  const FetchHoldingAsset = async () => {
    try {
      setIsLoading(true);

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      const endpoint =
        assetType === "fiat"
          ? `https://swiftpaymfb.com/api/holdings/fiats/show/${assetSymbol}?holding_id=${id}`
          : `https://swiftpaymfb.com/api/holdings/metals/show/${assetName}?holding_id=${id}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data?.status === "success") {
        let processedData = response.data?.data || {};

        processedData.earnings = parseFloat(processedData.earnings || 0);
        if (isNaN(processedData.earnings)) processedData.earnings = 0;

        if (processedData.holding && processedData.holding.amount) {
          processedData.holding.amount = parseFloat(
            processedData.holding.amount
          );
          if (isNaN(processedData.holding.amount))
            processedData.holding.amount = 0;
        } else {
          processedData.holding = { amount: 0, ...processedData.holding };
        }

        processedData.price_range = Array.isArray(processedData.price_range)
          ? processedData.price_range
          : [];

        processedData.dates = Array.isArray(processedData.dates)
          ? processedData.dates
          : [];

        showLogs("processedData:", processedData);

        setAssetData(processedData);
      }
    } catch (error: any) {
      const errMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.message || "An error occurred"
          : "Network error. Please try again.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errMessage,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (assetType) {
      FetchHoldingAsset();
    }
  }, [assetType]);

  if (isLoading || !assetData) {
    return <LoadingComp visible />;
  }

  const earnings = assetData?.earnings || 0;
  const holdingAmount = assetData?.holding?.amount || 0;
  const Balance = earnings + holdingAmount;

  // showLogs("assetData", assetData);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        <View style={styles.flex}>
          <Image
            source={{
              uri:
                assetData?.currency?.logo_url ||
                "https://swiftpaymfb.com/metal.png",
            }}
            style={styles.icon}
          />
          <View>
            <Text style={styles.assetName}>{assetName}</Text>
          </View>
        </View>

        <View style={styles.balanceContainer}>
          <View>
            <Text style={styles.heading}>Current Price</Text>
            <Text style={styles.price}>
              ₦
              {formatAmount(
                assetData.currency.rate || assetData.currency.price
              )}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: -20 }}>
          <AssetChart data_changes={assetData.price_range} />
        </View>

        <View style={[styles.walletContainer, { marginTop: 20 }]}>
          <View style={styles.walletRow}>
            <View>
              <Text style={styles.walletSubAmount}>Amount Invested</Text>
              <Text style={styles.value}>
                ₦ {formatAmount(holdingAmount) || "0.00"}
              </Text>
            </View>
            <View>
              <Text style={styles.walletSubAmount}>Possible Earnings</Text>
              <Text
                style={[
                  styles.text,
                  {
                    color:
                      assetData?.possible_earnings > holdingAmount
                        ? COLORS.greenText
                        : COLORS.red,
                    alignSelf: "flex-end",
                  },
                ]}
              >
                ₦{formatAmount(assetData?.possible_earnings) || "0.00"}
              </Text>
            </View>
          </View>

          <View style={styles.walletRow}>
            <View>
              <Text
                style={[styles.walletSubAmount, { alignSelf: "flex-start" }]}
              >
                Initial Rate
              </Text>
              {assetData.holding.asset_type === "metal" ? (
                <Text style={styles.value}>
                  ₦{formatAmount(assetData?.holding.naira_start_rate) || "0.00"}
                </Text>
              ) : (
                <Text style={styles.value}>
                  {Number(assetData?.holding.naira_start_rate).toFixed(2) ||
                    "0.00"}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.walletSubAmount}>Current Rate</Text>
              <Text
                style={[
                  styles.text,
                  {
                    color:
                      assetData?.current_rate >
                      assetData?.holding.naira_start_rate
                        ? COLORS.greenText
                        : COLORS.red,
                    alignSelf: "flex-end",
                  },
                ]}
              >
                {assetData.holding.asset_type === "metal"
                  ? "₦" + formatAmount(assetData?.current_rate || 0)
                  : Number(assetData?.current_rate).toFixed(2) || "0.00"}
              </Text>
            </View>
          </View>

          <View style={styles.walletRow}>
            <View>
              <Text style={styles.walletSubAmount}>Holding Status</Text>
              <Text style={styles.status}>
                {assetData?.holding?.status || "inactive"}
              </Text>
            </View>
            <View>
              <Text style={styles.walletSubAmount}>Asset Invested</Text>
              <Text style={[styles.value, { alignSelf: "flex-end" }]}>
                {assetData.holding.asset_type === "metal"
                  ? Number(assetData?.holding?.asset_amount)
                  : formatAmount(assetData?.holding?.asset_amount)}{" "}
                <Text
                  style={[styles.walletSubAmount, { alignSelf: "flex-end" }]}
                >
                  ({assetData?.holding?.asset_symbol})
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.walletRow}>
            <View>
              <Text
                style={[styles.walletSubAmount, { alignSelf: "flex-start" }]}
              >
                End Date
              </Text>
              <Text style={styles.value}>
                {formatDateShort(assetData?.holding?.end_date)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default HardCurrencyDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  menu: {
    fontSize: 24,
  },
  gainsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 20,
  },
  gainBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  gainCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  gainText: {
    fontSize: 14,
    color: "#666",
  },
  gainAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  balanceContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 40,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 5,
  },
  percentage: {
    fontSize: 14,
    color: "#00c851",
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },
  activeFilter: {
    backgroundColor: "#ff4444",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 8,
  },
  loadingChart: {
    height: 220,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  walletContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
  },
  walletSubAmount: {
    color: "#888",
    fontSize: 16,
    marginBottom: 4,
    alignSelf: "flex-end",
  },
  value: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#000",
  },
  text: {
    fontSize: 19,
    fontWeight: "bold",
    color: "red",
  },
  status: {
    fontSize: 14,
    color: "#0074BB",
    backgroundColor: "#DFF1FC",
    padding: 4,
    borderRadius: 16,
    textAlign: "center",
  },
  chartContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    gap: 8,
  },
  candleContainer: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  line: {
    width: 2,
    borderRadius: 1,
  },
  bar: {
    width: 10,
    borderRadius: 2,
  },
  candleLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#333",
  },
  label: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 25,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 50,
    // resizeMode: "center",
  },
  assetName: {
    fontSize: 19,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginTop: 2,
  },
  heading: {
    fontSize: 17,
    color: "#555",
  },
  price: {
    fontSize: 25,
    fontWeight: "700",
  },
});
