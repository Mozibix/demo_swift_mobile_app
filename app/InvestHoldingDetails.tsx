import AssetChart from "@/components/AssetChart";
import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { COLORS } from "@/constants/Colors";
import { Investment } from "@/types";
import { _TSFixMe, formatAmount, formatDateShort } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { Fragment, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.get("window").width;

type InvestmentResponse = {
  investment: {
    id: number;
    user_id: number;
    asset_name: string;
    asset_symbol: string;
    asset_icon_url: string;
    asset_type: string;
    amount_invested: number;
    amount_earned: number | null;
    change_percentage: number;
    final_change_percentage: number | null;
    end_date: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  stock: {
    id: number;
    company: string;
    symbol: string;
    change: number;
    change_percent: number;
    price: number;
    created_at: string;
    updated_at: string;
  };
  naira_to_dollar_rate: number;
  current_rate: number;
  possible_earnings: number;
  earnings: number;
};

const HardCurrencyDetails = () => {
  const { id, assetType, assetName, assetSymbol, current_earnings } =
    useLocalSearchParams();
  const [investmentInfo, setInvestmentInfo] = useState<InvestmentResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [assetData, setAssetData] = useState<any>(null);
  const [error, setError] = useState("");

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

      const assetsResponse = await axios.get(
        "https://swiftpaymfb.com/api/investments/assets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const currentCrypto = assetsResponse?.data?.data?.crypto_currencies.find(
        (c: _TSFixMe) => c.name === assetName
      );

      const endpoint =
        assetType === "stock"
          ? `https://swiftpaymfb.com/api/investments/assets/stock-details?stock_symbol=${assetSymbol}`
          : `https://swiftpaymfb.com/api/investments/assets/crypto-details?crypto_id=${currentCrypto.id}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // showLogs("fetched Assets:", response.data);

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

        // showLogs("processedData", processedData);
        setAssetData(processedData);
      }
    } catch (error: any) {
      const errMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.message || "An error occurred"
          : "Network error. Please try again.";
      showLogs("errMessage", errMessage);
      showLogs("error", error?.response);

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

  const fetchInvestment = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const endpoint =
        assetType === "stock"
          ? `https://swiftpaymfb.com/api/investments/stock-investment?investment_id=${id}`
          : `https://swiftpaymfb.com/api/investments/crypto-investment?investment_id=${id}`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showLogs("response", response.data.data);

      if (response.data.status === "success") {
        if (assetType === "stock") {
          // setInvestInfo(response?.data?.data?.investment);
          setInvestmentInfo(response?.data?.data);
        } else {
          // setInvestInfo(response?.data?.data?.investment);
          setInvestmentInfo(response?.data?.data);
        }
      }
    } catch (err: any) {
      showLogs("error", err);
      setError(
        err?.response?.data?.message || "Failed to fetch investment details"
      );
    }
  };

  useEffect(() => {
    getData();
  }, [assetType]);

  async function getData() {
    if (assetType) {
      await FetchHoldingAsset();
      await fetchInvestment();
    }
  }

  if (isLoading) {
    return <LoadingComp visible />;
  }

  if (!assetData) {
    return (
      <View className="flex-1 bg-white">
        <View className="mx-5 items-center justify-center flex-1">
          <Text className="text-[22px] font-semibold">An Error Occured</Text>
          <Text className="text-gray-200 mt-2 text-[17px]">
            {" "}
            Something went wrong. Please Try again
          </Text>
          <Button text="Retry" onPress={getData} full />
        </View>
      </View>
    );
  }

  const earnings = assetData?.earnings || 0;
  const holdingAmount = assetData?.holding?.amount || 0;
  const Balance = earnings + holdingAmount;
  const investInfo = investmentInfo?.investment;

  // showLogs("investInfo", investInfo);
  // showLogs("assetData", assetData);
  // showLogs("current_earnings", current_earnings);

  const screenWidth = Dimensions.get("window").width;

  const data = {
    labels: ["", "", "", "", "", "", ""],
    datasets: [
      {
        data: assetType === "crypto" ? assetData.crypto.changes : [],
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`, // Line color (blue)
    labelColor: () => "#999",
    propsForDots: {
      r: "0",
    },
    propsForBackgroundLines: {
      stroke: "#E3E3E3",
    },
    fillShadowGradient: "#007BFF", // fill area under line
    fillShadowGradientOpacity: 0.3,
  };

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

      <ScrollView>
        {assetType === "stock" && (
          <Fragment>
            <View style={styles.topWrap}>
              <View style={styles.flex}>
                <Image
                  source={{
                    uri: "https://swiftpaymfb.com/trend.png",
                  }}
                  style={styles.icon}
                />
                <View>
                  <Text style={styles.assetName}>{assetData?.data?.name}</Text>
                  <Text style={styles.assetSymbol}>
                    {assetData.data.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.assetSymbol,
                      {
                        color:
                          assetData.data.change < 0
                            ? COLORS.red
                            : COLORS.greenText,
                      },
                    ]}
                  >
                    {assetData.data.change} (
                    {assetData.data.change_percent.toFixed(2)}%)
                  </Text>
                </View>
              </View>
              <View>
                <Text style={styles.status}>{investInfo?.status}</Text>
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <View>
                <Text style={styles.amountSec}>
                  Current Price:{" "}
                  <Text style={styles.amountSecSub}>
                    {assetData.data.price} {assetData.data.currency}
                  </Text>
                </Text>

                <Text style={styles.amountSec}>
                  Open Price:{" "}
                  <Text style={styles.amountSecSub}>
                    {assetData.data.open} {assetData.data.currency}
                  </Text>
                </Text>

                <Text style={styles.amountSec}>
                  Market Cap:{" "}
                  <Text style={styles.amountSecSub}>
                    {formatAmount(assetData.data.company_market_cap)}{" "}
                    {assetData.data.currency}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.flex}>
              <View style={[styles.balanceContainer, { width: "48%" }]}>
                <View style={styles.flex}>
                  <View>
                    <FontAwesome5
                      name="long-arrow-alt-up"
                      size={24}
                      color={COLORS.greenText}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 17 }}>High</Text>
                    <Text style={{ fontSize: 24, fontWeight: "700" }}>
                      {+assetData.data.high.toFixed(2)}{" "}
                      {assetData.data.currency}{" "}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.balanceContainer, { width: "48%" }]}>
                <View style={styles.flex}>
                  <View>
                    <FontAwesome5
                      name="long-arrow-alt-down"
                      size={24}
                      color={COLORS.red}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 17 }}>Low</Text>
                    <Text style={{ fontSize: 24, fontWeight: "700" }}>
                      {+assetData.data.low.toFixed(2)} {assetData.data.currency}{" "}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.balanceContainer, { width: "48%" }]}></View>
            </View>

            <View style={styles.walletContainer}>
              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSubAmount}>Amount Invested</Text>
                  <Text style={styles.value}>
                    ₦{formatAmount(investInfo?.amount_invested || 0) || "0.00"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.walletSubAmount}>Possible Earnings</Text>
                  <Text
                    style={
                      investmentInfo?.possible_earnings! <
                      (investInfo?.amount_invested || 0)
                        ? styles.red
                        : styles.green
                    }
                    className="self-end"
                  >
                    ₦{formatAmount(+current_earnings || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSubAmount}>Change Percentage</Text>
                  <Text style={styles.value}>
                    {investInfo?.change_percentage.toFixed(2) || "0.00"} %
                  </Text>
                </View>
                <View>
                  <Text style={styles.walletSubAmount}>Current Rate</Text>
                  <Text
                    style={{
                      color:
                        investmentInfo?.current_rate! <
                        (investInfo?.change_percentage || 0)
                          ? COLORS.danger
                          : COLORS.greenText,
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                    className="self-end"
                  >
                    {Number(investmentInfo?.current_rate).toFixed(2) || "0.00"}{" "}
                    %
                  </Text>
                </View>
              </View>

              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSubAmount}>End Date</Text>
                  <Text style={styles.value}>
                    {formatDateShort(investInfo?.end_date!)}
                  </Text>
                </View>
              </View>
            </View>
          </Fragment>
        )}

        {assetType === "crypto" && (
          <View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Image
                  source={{ uri: assetData.crypto.icon }}
                  style={{ height: 40, width: 40, borderRadius: 50 }}
                />
                <View>
                  <Text className="font-semibold text-[18px]">
                    {assetData.crypto.name}
                  </Text>
                  <Text className="text-gray-200">
                    {assetData.crypto.symbol}
                  </Text>
                </View>
              </View>
              <Text style={styles.status}>{investInfo?.status}</Text>
            </View>

            <Card classNames="mt-8">
              <Text className="text-[17px]">Current Price</Text>
              <Text className="text-[22px] font-bold mt-1">
                ${formatAmount(assetData.crypto.price_in_usd)}{" "}
                <Text
                  style={{
                    color:
                      assetData.crypto.change_percentage > 0
                        ? COLORS.greenText
                        : COLORS.danger,
                  }}
                >
                  ({assetData.crypto.change_percentage?.toFixed(2)}%)
                </Text>
              </Text>
              <Text className="mt-1 text-[16px] text-gray-200">
                ₦
                {formatAmount(
                  assetData?.naira_to_dollar_rate *
                    assetData.crypto.price_in_usd
                )}
              </Text>
            </Card>

            <Animated.View entering={FadeInDown.delay(200)}>
              <LineChart
                data={data}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                withInnerLines
                withOuterLines={false}
                withDots={false}
                withShadow
                withVerticalLabels={false}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </Animated.View>

            <View style={styles.walletContainer}>
              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSubAmount}>Amount Invested</Text>
                  <Text style={styles.value}>
                    ₦{formatAmount(investInfo?.amount_invested || 0) || "0.00"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.walletSubAmount}>Possible Earnings</Text>
                  <Text
                    style={
                      +current_earnings < (investInfo?.amount_invested || 0)
                        ? styles.red
                        : styles.green
                    }
                    className="self-end"
                  >
                    ₦{formatAmount(+current_earnings)}
                  </Text>
                </View>
              </View>

              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSubAmount}>Change Percentage</Text>
                  <Text style={styles.value}>
                    {investInfo?.change_percentage.toFixed(2) || "0.00"} %
                  </Text>
                </View>
                <View>
                  <Text style={styles.walletSubAmount}>Current Rate</Text>
                  <Text
                    style={{
                      color:
                        (investmentInfo?.current_rate! ?? 0) <
                          investInfo?.change_percentage! || 0
                          ? COLORS.danger
                          : COLORS.greenText,
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                    className="self-end"
                  >
                    {Number(assetData?.crypto?.change_percentage).toFixed(2) ||
                      "0.00"}{" "}
                    %
                  </Text>
                </View>
              </View>

              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSubAmount}>End Date</Text>
                  <Text style={styles.value}>
                    {formatDateShort(investInfo?.end_date!)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  red: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.danger,
  },
  green: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.greenText,
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
  topWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  assetName: {
    fontSize: 19,
    fontWeight: "600",
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginTop: 2,
  },
  amountSec: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 6,
  },
  amountSecSub: {
    fontSize: 17,
    fontWeight: "500",
    color: "#555",
  },
});
