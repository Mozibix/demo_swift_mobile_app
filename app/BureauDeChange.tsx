import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, Fragment } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { bureauDeChangeApi } from "../services/api";
import Toast from "react-native-toast-message";
import { Image as ExpoImage } from "expo-image";
import LoadingComp from "@/components/Loading";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import BDCTransaction from "@/components/BDCTransaction";
import { showLogs } from "@/utils/logger";
import { formatAmountMinimal } from "@/utils";

type ExchangeProps = {
  navigation: {
    goBack: () => void;
  };
};

const BureauDeChange: React.FC<ExchangeProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"Buy" | "History">("Buy");
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await bureauDeChangeApi.getBuyRatesAndHistory();
      if (response.status === "success") {
        setCurrencies(response.data.currencies);
        setHistory(response.data.history);
      }
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionPress = async (currencyId: number) => {
    try {
      setLoading(true);
      const response = await bureauDeChangeApi.getBuyCurrencyPage(currencyId);

      if (response.status === "success") {
        const { currency, fee, form_fields } = response.data;
        router.push({
          pathname: "/Exchange",
          params: {
            currencyName: currency.code,
            price: currency.price,
            volume: currency.volume,
            fee: fee,
            currency: currency.currency,
            currency_symbol: currency.currency_symbol,
            logo_url: currency.logo_url,
            form_fields: JSON.stringify(form_fields),
            limit: currency.limit,
            rate: currency.rate,
            currency_id: currency.id,
          },
        });
      }
    } catch (err) {
      console.error("Error getting currency details:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to get currency details",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCurrencyIcon = (code: string) => {
    switch (code) {
      case "USD":
        return require("../assets/icons/dollar.png");
      case "EUR":
        return require("../assets/icons/euro.png");
      case "GBP":
        return require("../assets/icons/pounds.png");
      case "JPY":
        return require("../assets/icons/yen.png");
      default:
        return require("../assets/icons/dollar.png");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInUp.delay(400)}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Bureau De Change</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "Buy" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("Buy")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Buy" && styles.activeTabText,
            ]}
          >
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "History" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("History")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "History" && styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "Buy" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {currencies.map((currency, index) => (
            <View key={index}>
              <TouchableOpacity
                key={currency.id}
                onPress={() =>
                  currency.status === "open"
                    ? handleOptionPress(currency.id)
                    : null
                }
                disabled={currency.status !== "open"}
              >
                <View style={styles.currencyCard}>
                  <View style={styles.currencyHeader}>
                    <View style={styles.currencyInfo}>
                      <ExpoImage
                        source={{ uri: currency.logo_url }}
                        style={styles.currencyIcon}
                        contentFit="contain"
                      />
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        currency.status === "open"
                          ? styles.statusOpen
                          : styles.statusClosed,
                      ]}
                    >
                      <View
                        style={
                          currency.status === "open"
                            ? styles.dotOpen
                            : styles.dotClosed
                        }
                      />
                      <Text
                        style={
                          currency.status === "open"
                            ? styles.statusTextOpen
                            : styles.statusTextClosed
                        }
                      >
                        {currency.status === "open" ? "Open" : "Closed"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.currencyDetails}>
                    <Text style={styles.rateText}>
                      {formatAmountMinimal(currency.price)} NGN
                    </Text>
                    <Text style={styles.limitText}>
                      Quantity: {currency.currency_symbol}
                      {formatAmountMinimal(currency.volume)}
                    </Text>
                    <Text style={styles.limitText}>
                      Limits: {currency.currency_symbol}
                      {formatAmountMinimal(currency.limit)}
                    </Text>
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balanceText}>SwiftPay Balance</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.historyContainer}>
            <Fragment>
              {history.length === 0 ? (
                <Animated.View
                  entering={FadeInDown.delay(100)}
                  className="flex items-center justify-center pt-20"
                >
                  <Image
                    source={require("../assets/payments/6.png")}
                    style={{ width: 200, height: 200, resizeMode: "contain" }}
                  />
                  <Text className="text-gray-200 text-[17px] mt-3 font-semibold">
                    No history to show
                  </Text>
                </Animated.View>
              ) : (
                <Fragment>
                  {history.map((transaction) => (
                    <BDCTransaction
                      key={transaction.id}
                      transaction={transaction}
                      type="Buy"
                    />
                  ))}
                </Fragment>
              )}
            </Fragment>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 50,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  activeTabButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "500",
  },
  // Currency Card Styles
  currencyCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    paddingBottom: 16,
  },
  currencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusOpen: {
    backgroundColor: "#E8F5E9",
  },
  statusClosed: {
    backgroundColor: "#FFEBEE",
  },
  dotOpen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00C853",
  },
  dotClosed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D50000",
  },
  statusTextOpen: {
    color: "#00C853",
    fontWeight: "500",
  },
  statusTextClosed: {
    color: "#D50000",
    fontWeight: "500",
  },
  currencyDetails: {
    paddingHorizontal: 4,
  },
  rateText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  limitText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  balanceContainer: {
    borderLeftWidth: 3,
    borderLeftColor: "#1400FB",
    paddingLeft: 8,
    marginTop: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Transaction Card Styles
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#008A16",
    marginBottom: 4,
  },
  timeStamp: {
    fontSize: 14,
    color: "#666666",
  },
  chatIcon: {
    marginRight: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  priceValue: {
    fontSize: 16,
    color: "#000000",
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontSize: 14,
    color: "#666666",
  },
  historyContainer: {
    flex: 1,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1400FB",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});

export default BureauDeChange;
