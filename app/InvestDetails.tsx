import AssetChart from "@/components/AssetChart";
import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import { formatAmount } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageStyle,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "@/constants/Colors";
import { IS_ANDROID_DEVICE } from "@/constants";

const { width } = Dimensions.get("window");

const InvestDetails = () => {
  const params = useLocalSearchParams();
  const { hash_id, type, id, hold } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [investmentDetails, setInvestmentDetails] = useState<any>(null);
  const [investInfo, setInvestInfo] = useState<any>(null);
  const [staus, setStatus] = useState<any>();
  const [nairaToDollarRate, setNairaToDollarRate] = useState(0);
  // const [assetId, setAssetId] = useState<any>();
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [{ data: [] as number[] }],
  });
  const [dollarRate, setDollarRate] = useState<number | null>(null);

  let assetId: any;

  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");

        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const endpoint =
          type === "stock"
            ? `https://swiftpaymfb.com/api/investments/assets/stock-details?stock_symbol=${hash_id}`
            : `https://swiftpaymfb.com/api/investments/assets/crypto-details?crypto_id=${hash_id}`;

        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // if (type === "stock") {
        //   console.log("Hash_id: ", hash_id);
        //   console.log("single asset:", response?.data?.data);
        // } else {
        //   console.log("Hash_id: ", hash_id);
        //   console.log("single crypto asset:", response?.data?.data);
        // }

        // showLogs("esponse?.data?.data", response?.data?.data);

        if (response.data.status === "success") {
          if (type === "stock") {
            setInvestmentDetails(response?.data?.data?.data);
            setStatus(response?.data?.data?.status);
            assetId = response?.data?.data?.data?.id;
          } else {
            showLogs("response", response.data.data?.crypto);
            setNairaToDollarRate(response.data.data?.naira_to_dollar_rate);
            setInvestmentDetails(response.data.data?.crypto);
            setStatus(response?.data?.data?.crypto.status);
            assetId = response?.data?.data?.id;
          }

          if (type === "crypto") {
            setChartData({
              labels: response?.data?.data?.price_changes_dates || [],
              datasets: [
                {
                  data:
                    response?.data?.data?.crypto?.changes?.map(
                      (price: string) => parseFloat(price)
                    ) || [],
                },
              ],
            });
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.log(err?.response || err);
        setError(
          err?.response?.data?.message || "Failed to fetch investment details"
        );
        setLoading(false);
      }
    };

    if (hash_id) {
      fetchInvestmentDetails();
    }
  }, [hash_id, type]);

  useEffect(() => {
    const FetchInvestment = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");

        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const endpoint =
          type === "stock"
            ? `https://swiftpaymfb.com/api/investments/stock-investment?investment_id=${id}`
            : `https://swiftpaymfb.com/api/investments/crypto-investment?investment_id=${assetId}`;

        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // console.log("single Investment:", response?.data);

        // if (type === "stock") {
        //   console.log("Hash_id: ", assetId);
        //   console.log("single Investment:", response?.data);
        // } else {
        //   console.log("Hash_id: ", assetId);
        //   console.log("single Investmentt:", response?.data);
        // }

        if (response.data.status === "success") {
          if (type === "stock") {
            setInvestInfo(response?.data?.data?.data);
            setStatus(response?.data?.data?.status);
          } else {
            setInvestInfo(response.data.data);
          }
        }
        setLoading(false);
      } catch (err: any) {
        console.log(err?.response || err);
        setError(
          err?.response?.data?.message || "Failed to fetch investment details"
        );
        setLoading(false);
      }
    };

    if (assetId) {
      FetchInvestment();
    }
  }, [assetId]);

  React.useEffect(() => {
    const fetchBalance = async () => {
      const Rate = await AsyncStorage.getItem("naira_to_dollar_rate");

      if (Rate) {
        setDollarRate(parseFloat(Rate));
      }
    };

    fetchBalance();
  }, []);

  const handleNavigation = () => {
    router.push({
      pathname: "/CreateInvestHoldings",
      params: {
        formdata: investmentDetails ? JSON.stringify(investmentDetails) : null,
        id,
        type,
        hash_id,
      },
    });
  };

  if (loading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="left" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "stock" ? investmentDetails?.name : investmentDetails?.name}{" "}
          <Text style={styles.headerSubtitle}>
            (
            {type === "stock"
              ? investmentDetails?.symbol
              : investmentDetails?.symbol}
            )
          </Text>
        </Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <AntDesign name="star" size={22} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Image
              source={{
                uri:
                  type === "crypto"
                    ? investmentDetails.icon
                    : "https://swiftpaymfb.com/trend.png",
              }}
              style={[
                styles.currencyIcon,
                { borderRadius: type === "crypto" ? 50 : 0 },
              ]}
            />
            <View>
              {type === "crypto" && (
                <View>
                  <Text style={{ fontSize: 15, color: "#666" }}>
                    Current Price
                  </Text>
                  <Text style={styles.priceText}>
                    ${formatAmount(investmentDetails?.price_in_usd)}
                  </Text>
                </View>
              )}

              {type === "stock" ? (
                <View>
                  <Text style={styles.price_text}>
                    Current Price:{" "}
                    <Text style={styles.price_sub_text}>
                      {formatAmount(investmentDetails?.price)} USD
                    </Text>
                  </Text>
                  <Text style={styles.price_text}>
                    Open Price:{" "}
                    <Text style={styles.price_sub_text}>
                      {investmentDetails.open} USD
                    </Text>
                  </Text>
                  <Text style={[styles.price_text, { maxWidth: 250 }]}>
                    Market Cap:{" "}
                    <Text style={styles.price_sub_text}>
                      {formatAmount(investmentDetails.company_market_cap)} USD
                    </Text>
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 15, color: "#666" }}>
                  ₦
                  {formatAmount(
                    Number(
                      (
                        nairaToDollarRate * investmentDetails?.price_in_usd
                      )?.toFixed(2)
                    )
                  )}
                </Text>
              )}
            </View>
          </View>
          {type === "crypto" && (
            <View
              style={[
                styles.percentageRow,
                {
                  backgroundColor:
                    Number(investmentDetails?.change_percentage || 0) >= 0
                      ? "#e6f9f0"
                      : "#ffe6e6",
                },
              ]}
            >
              <AntDesign
                name={
                  Number(investmentDetails?.change_percentage || 0) >= 0
                    ? "caretup"
                    : "caretdown"
                }
                size={14}
                color={
                  Number(investmentDetails?.change_percentage) >= 0
                    ? "#0cbc8b"
                    : "#e74c3c"
                }
              />
              <Text
                style={[
                  styles.percentageText,
                  {
                    color:
                      Number(investmentDetails?.change_percentage) >= 0
                        ? "#0cbc8b"
                        : "#e74c3c",
                  },
                ]}
              >
                {`${investmentDetails?.change_percentage?.toFixed(2)}%`}
              </Text>
            </View>
          )}
        </View>

        {type !== "stock" && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <AssetChart data_changes={investmentDetails.changes} noShadow />
          </Animated.View>
        )}

        {type === "stock" && hold === "false" && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Investment Summary</Text>
            <View style={styles.walletContainer}>
              {/* <View style={styles.walletSection}>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Open Price</Text>
                  <Text style={styles.walletValue}>
                    $ {investmentDetails?.open}
                  </Text>
                </View>

                {type === "stock" && (
                  <View style={styles.walletItem}>
                    <Text style={styles.walletLabel}>Market Cap</Text>
                    <Text style={styles.walletValue}>
                      $ {investmentDetails?.company_market_cap}
                    </Text>
                  </View>
                )}
              </View> */}

              {/* <View style={styles.divider} /> */}

              {type === "stock" && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.walletSection}>
                    <View style={styles.walletItem}>
                      <Text style={styles.walletLabel}>24h High</Text>
                      <Text
                        style={[
                          styles.walletValue,
                          { color: COLORS.greenText },
                        ]}
                      >
                        $ {investmentDetails?.high?.toFixed(2)} USD
                      </Text>
                    </View>
                    <View style={styles.walletItem}>
                      <Text style={styles.walletLabel}>24h Low</Text>
                      <Text style={[styles.walletValue, { color: COLORS.red }]}>
                        $ {+investmentDetails?.low?.toFixed(2)} USD
                      </Text>
                    </View>
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <View style={styles.walletSection}>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Holding Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{staus}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {hold === "true" && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Investment Summary</Text>

            <View style={styles.walletContainer}>
              <View style={styles.walletSection}>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Amount Invested</Text>
                  <Text style={styles.walletValue}>
                    ₦{investmentDetails?.investment?.amount_invested}
                  </Text>
                </View>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Possible Earnings</Text>
                  <Text
                    style={[
                      styles.walletValue,
                      {
                        color:
                          investmentDetails?.possible_earnings >= 0
                            ? "green"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    ₦{investmentDetails?.possible_earnings}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.walletSection}>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Initial Rate</Text>
                  <Text style={styles.walletValue}>
                    {type === "stock"
                      ? `${dollarRate}`
                      : investmentDetails?.crypto?.name}
                  </Text>
                </View>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Current Earnings</Text>
                  <Text
                    style={[
                      styles.walletValue,
                      {
                        color:
                          investmentDetails?.earnings >= 0
                            ? "green"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    ₦{investmentDetails?.earnings}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.walletSection}>
                <View style={styles.walletItem}>
                  <Text style={styles.walletLabel}>Holding Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{staus}</Text>
                  </View>
                </View>
                {type === "stock" && (
                  <View style={styles.walletItem}>
                    <Text style={styles.walletLabel}>Market Cap</Text>
                    <Text style={styles.walletValue}>
                      {investmentDetails?.company_market_cap}
                    </Text>
                  </View>
                )}
                {type === "crypto" && (
                  <View style={styles.walletItem}>
                    <Text style={styles.walletLabel}>USD/NGN Rate</Text>
                    <Text style={styles.walletValue}>
                      ₦{dollarRate?.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {type === "stock" && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.walletSection}>
                    <View style={styles.walletItem}>
                      <Text style={styles.walletLabel}>24h High</Text>
                      <Text style={styles.walletValue}>
                        ${+investmentDetails?.high?.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.walletItem}>
                      <Text style={styles.walletLabel}>24h Low</Text>
                      <Text style={styles.walletValue}>
                        ${+investmentDetails?.low?.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {hold === "false" && (
        <View className="mx-5 mb-10">
          <Button text="Invest Now" onPress={handleNavigation} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default InvestDetails;

const additionalStyles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  } as ViewStyle,
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  } as TextStyle,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafe",
  },

  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: IS_ANDROID_DEVICE ? 50 : 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  } as TextStyle,
  headerSubtitle: {
    color: "#8a8a8a",
    fontWeight: "500",
  } as TextStyle,

  // Price Card Styles
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  } as ImageStyle,
  priceText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
  } as TextStyle,
  percentageRow: {
    flexDirection: "row",
    backgroundColor: "#e6f9f0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0cbc8b",
  } as TextStyle,

  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timePeriodSelector: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 4,
  } as ViewStyle,
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: "#666",
  } as TextStyle,
  activeTimeOption: {
    backgroundColor: "#fff",
    borderRadius: 8,
    color: "#1876FF",
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as TextStyle,

  price_text: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
    marginBottom: 3,
  },
  price_sub_text: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  // Investment Summary Styles
  summaryContainer: {
    marginTop: 20,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginLeft: 5,
  } as TextStyle,
  walletContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
  walletSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  } as ViewStyle,
  walletItem: {
    flex: 1,
  } as ViewStyle,
  walletLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  } as TextStyle,
  walletValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  } as TextStyle,
  negativeValue: {
    color: "#e74c3c",
  } as TextStyle,
  statusBadge: {
    backgroundColor: "#e6f0ff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  } as ViewStyle,
  statusText: {
    color: "#1876FF",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    width: "100%",
  } as ViewStyle,

  // Button Styles
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  } as ViewStyle,
  investButton: {
    backgroundColor: "#1876FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1876FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  investButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  } as TextStyle,
  ...additionalStyles,
});
