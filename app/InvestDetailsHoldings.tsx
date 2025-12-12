import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useLocalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { showLogs } from "@/utils/logger";
import { _TSFixMe, formatAmount } from "@/utils";
import Button from "@/components/ui/Button";
import { Line } from "react-native-svg";
import AssetChart from "@/components/AssetChart";
import LoadingComp from "@/components/Loading";

interface Currency {
  id: number;
  code: string;
  rate: number;
  created_at: string;
  updated_at: string;
}

interface Metal {
  id: number;
  metal: string;
  price: number;
  updated_at: string;
}

interface Holding {
  id: number;
  user_id?: number;
  asset_name?: string;
  asset_symbol: string;
  asset_amount: number;
  amount?: number;
  end_date?: string;
  naira_start_rate?: number;
  status: string;
  amount_earned?: number;
  created_at?: string;
  updated_at?: string;
}

interface HoldingData {
  holding: Holding;
  current_rate: number;
  possible_earnings: number;
  earnings: number;
}

interface AssetResponse {
  success: boolean;
  data: {
    price_range: number[];
    currency?: Currency;
    metal?: Metal;
    prices: number[];
    dates: string[];
    holding?: HoldingData;
  };
}

const InvestDetailsHoldings = () => {
  const params = useLocalSearchParams();
  const { type, symbol, holdingId, hold } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssetResponse | null>(null);

  useEffect(() => {
    fetchAssetDetails();
  }, []);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
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
        type === "fiat" && hold === "false"
          ? `https://swiftpaymfb.com/api/holdings/fiats/show/${symbol}`
          : `https://swiftpaymfb.com/api/holdings/metals/show/${symbol}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: holdingId ? { holding: holdingId } : undefined,
      });

      // showLogs("Response data:", response.data);

      if (response.data?.status === "success") {
        setData(response.data);
      } else {
        setError("Invalid response format");
      }
    } catch (error: any) {
      const errMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.message || "An error occurred"
          : "Network error. Please try again.";
      setError(errMessage);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errMessage,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingComp visible />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "No data available"}</Text>
      </View>
    );
  }

  const holding: _TSFixMe = data;
  const assetInfo: _TSFixMe =
    type === "fiat" ? data.data.currency : data.data.metal;
  // showLogs("holding asset", holding);
  // showLogs("assetInfo", assetInfo);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()}>
          <AntDesign name="left" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "fiat" ? assetInfo?.code : assetInfo?.metal}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{
                  uri:
                    assetInfo?.logo_url || "https://swiftpaymfb.com/metal.png",
                }}
                style={styles.icon}
              />

              <View>
                <Text style={styles.priceText}>
                  {assetInfo?.currency ||
                    holding.data.currency.metal?.toUpperCase()}
                </Text>
                <Text style={styles.priceSubText}>
                  ₦
                  {formatAmount(
                    assetInfo?.rate || holding.data.currency.price || 0
                  )}
                </Text>
              </View>
              {/* <Text style={styles.priceText}>
                {type === "fiat"
                  ? `₦${assetInfo?.price}`
                  : `₦${assetInfo?.price?.toFixed(2)}`}
              </Text> */}
            </View>

            <View>
              <Button
                text="Invest"
                classNames="p-3 -mt-3"
                onPress={() =>
                  router.push({
                    pathname: "/HoldingsSaveInHardCurrency",
                    params: {
                      assetInfo:
                        JSON.stringify(assetInfo) || JSON.stringify(holding),
                      type,
                    },
                  })
                }
              />
            </View>
          </View>
        </View>

        <AssetChart data_changes={holding.data.price_range} />

        {holding && hold !== "false" && (
          <View style={styles.walletContainer}>
            <View style={styles.walletRow}>
              <View>
                <Text style={styles.walletSubAmount}>Amount Invested</Text>
                <Text style={styles.label}>
                  ₦ {holding.holding.amount?.toLocaleString() || "0"}
                </Text>
              </View>
              <View>
                <Text style={styles.walletSubAmount}>Possible Earnings</Text>
                <Text style={styles.value}>
                  ₦ {holding.possible_earnings?.toLocaleString() || "0"}
                </Text>
              </View>
            </View>

            <View style={styles.walletRow}>
              <View>
                <Text style={styles.walletSubAmount}>Initial Rate</Text>
                <Text style={styles.value}>
                  {holding.holding.naira_start_rate?.toLocaleString() || "0"} %
                </Text>
              </View>
              <View>
                <Text style={styles.walletSubAmount}>Current Rate</Text>
                <Text style={styles.red}>
                  {holding.current_rate?.toLocaleString() || "0"}
                </Text>
              </View>
            </View>

            <View style={styles.walletRow}>
              <View>
                <Text style={styles.walletSubAmount}>Holding Status</Text>
                <Text style={styles.status}>
                  {holding.holding.status || "Unknown"}
                </Text>
              </View>
              <View>
                <Text style={styles.walletSubAmount}>Asset Invested</Text>
                <Text style={styles.value}>
                  {holding.holding.asset_amount?.toLocaleString() || "0"} (
                  {holding.holding.asset_symbol})
                </Text>
              </View>
            </View>

            <View style={{ alignItems: "flex-start", marginBottom: 10 }}>
              <Text style={styles.walletSubAmount}>End Date</Text>
              <Text style={styles.date}>
                {holding.holding.end_date || "Not specified"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default InvestDetailsHoldings;

const additionalStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    alignSelf: "center",
  },
  priceContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "flex-start",
    marginVertical: 15,
  },
  priceRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    width: 60,
    height: 30,
    marginRight: 10,
    borderRadius: 2,
    objectFit: "cover",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "600",
  },
  priceSubText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#555",
  },
  percentageRow: {
    flexDirection: "row",
    backgroundColor: "#d9fdf0",
    padding: 10,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  percentageText: {
    fontSize: 16,
    color: "#0cbc8b",
  },

  walletTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#666",
  },
  walletPriceContainer: {
    alignItems: "flex-end",
  },
  walletPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  walletPercentage: {
    color: "green",
  },
  placeholder: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  price: {
    borderWidth: 1,
    padding: 10,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderColor: "#ddd",
    marginVertical: 20,
    left: 200,
    marginBottom: -10,
  },
  amount: {
    color: "#0000ff",
    fontSize: 20,
    fontWeight: "bold",
    alignSelf: "center",
  },
  walletContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    backgroundColor: "#ECF6FF",
    borderRadius: 10,
    marginBottom: 20,
  },
  walletRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  walletSubAmount: {
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    textAlign: "right",
  },
  red: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
    textAlign: "right",
  },
  status: {
    fontSize: 14,
    color: "#0074BB",
    backgroundColor: "#DFF1FC",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  chartContainer: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  ...additionalStyles,
});
