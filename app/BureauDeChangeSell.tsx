import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  bureauDeChangeApi,
  SellPageCurrency,
  SellPageHistory,
} from "../services/api";
import LoadingComp from "@/components/Loading";
import { showLogs } from "@/utils/logger";
import BDCTransaction, { Transaction } from "@/components/BDCTransaction";
import { _TSFixMe, formatAmount } from "@/utils";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface Currency {
  id: number;
  code: string;
  name: string;
  exchange_rate: string;
  sell_status: string;
  priority: number;
}

type ExchangeProps = {
  navigation: {
    goBack: () => void;
  };
};

type Status = "All" | "Pending" | "Completed" | "Failed";

const BureauDeChangeSell: React.FC<ExchangeProps> = ({ navigation }) => {
  const [currencies, setCurrencies] = useState<SellPageCurrency[]>([]);
  const [history, setHistory] = useState<SellPageHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Sell" | "History">("Sell");
  const [activeStatus, setActiveStatus] = useState<Status>("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await bureauDeChangeApi.getSellPage();
        setCurrencies(response.data.currencies);
        setHistory(response.data.history);
        // showLogs("response", response);
        // showLogs("history", history);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err.message || "Failed to fetch data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOptionPress = async (currency: SellPageCurrency) => {
    try {
      setLoading(true);
      const response = await bureauDeChangeApi.getSellCurrencyPage(currency.id);

      if (response) {
        router.push({
          pathname: "/ExchangeSell",
          params: {
            cryptoName: currency.code,
            price: currency.sell_price,
            currency: currency.currency,
            volume: currency.volume,
            fee: response.fee,
            currency_id: currency.id,
            currency_symbol: currency.currency_symbol,
            limit: currency.limit,
            logo_url: currency.logo_url,
            banks: JSON.stringify(response.banks),
            form_fields: JSON.stringify(response.form_fields),
            rate: currency.sell_price,
          },
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch currency details",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to fetch currency details",
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

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredTransactions = history.filter((transaction) =>
    activeStatus === "All"
      ? true
      : transaction.status === activeStatus.toLowerCase()
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Bureau De Change</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={
              activeTab === "Sell" ? styles.activeTabButton : styles.tabButton
            }
            onPress={() => setActiveTab("Sell")}
          >
            <Text
              style={
                activeTab === "Sell" ? styles.activeTabText : styles.tabText
              }
            >
              Sell
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={
              activeTab === "History"
                ? styles.activeTabButton
                : styles.tabButton
            }
            onPress={() => setActiveTab("History")}
          >
            <Text
              style={
                activeTab === "History" ? styles.activeTabText : styles.tabText
              }
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === "Sell" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.id}
                onPress={() => handleOptionPress(currency)}
                disabled={currency.sell_status !== "open"}
              >
                <View style={styles.CardContainer2}>
                  <View style={styles.optionContainer}>
                    <View style={styles.textContainer}>
                      <Image
                        source={{ uri: currency.logo_url }}
                        style={styles.icon}
                        defaultSource={require("../assets/icons/dollar.png")}
                      />
                      <Text style={styles.title}>{currency.currency}</Text>
                    </View>
                    <View
                      style={
                        currency.sell_status === "open"
                          ? styles.label
                          : styles.closed
                      }
                    >
                      <View
                        style={
                          currency.sell_status === "open"
                            ? styles.dot
                            : styles.closedot
                        }
                      ></View>
                      <Text
                        style={
                          currency.sell_status === "open"
                            ? styles.label
                            : styles.closedLabel
                        }
                      >
                        {currency.sell_status === "open"
                          ? "Available"
                          : "Closed"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.assetsName}>
                    <Text style={styles.price}>
                      {formatAmount(currency.sell_price || 0)} NGN
                    </Text>

                    <View style={styles.currencyDetails}>
                      <Text style={styles.limitText}>
                        Quantity: {currency.currency_symbol}
                        {currency.volume}
                      </Text>
                      <Text style={styles.limitText}>
                        Limits: {currency.currency_symbol} {currency.limit}
                      </Text>
                    </View>

                    <View style={styles.leftLine}>
                      <Text style={styles.balanceName}>SwiftPay Balance</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          // Existing History tab content
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 6 }}
          >
            {/* Status Filter Tabs */}
            <View style={styles.subCrypto}>
              {["All", "Pending", "Completed", "Failed"].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setActiveStatus(status as Status)}
                >
                  <Text
                    style={
                      activeStatus === status
                        ? styles.activeCryptoText
                        : styles.cryptoText
                    }
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.historyContainer}>
              <FlatList
                data={filteredTransactions}
                showsVerticalScrollIndicator={false}
                keyExtractor={(filteredTransactions) =>
                  filteredTransactions.id.toString()
                }
                scrollEnabled={false}
                renderItem={({ item: transaction, index }) => (
                  <Animated.View
                    entering={FadeInDown.delay(100 * index + 1)}
                    exiting={FadeOutDown.delay(100 * index + 1)}
                  >
                    <BDCTransaction
                      key={transaction.id}
                      transaction={transaction as _TSFixMe}
                      type="Sell"
                    />
                  </Animated.View>
                )}
                ListEmptyComponent={() => (
                  <Animated.View
                    entering={FadeInDown.delay(100)}
                    className="items-center justify-center mt-6"
                  >
                    <Image
                      source={{ uri: "https://swiftpaymfb.com/holdings.png" }}
                      style={{ height: 200, width: 200 }}
                    />
                    <Text className="text-[20px] font-semibold">
                      No transactions found
                    </Text>
                    <Text className="text-gray-200 text-base">
                      No {activeStatus === "All" ? "" : activeStatus}{" "}
                      transactions yet
                    </Text>
                  </Animated.View>
                )}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Completed":
      return styles.statusCompleted;
    case "In Progress":
      return styles.statusInProgress;
    case "Cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
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
    borderRadius: 100,
  },
  placeholder: {
    width: 50, // Same width as the backButton to keep alignment
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, // Allow text to take remaining space and center
  },
  listContainer: {
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  textContainer: {
    flexDirection: "row",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  CardContainer: {
    backgroundColor: "#D3EDFC",
    marginBottom: 20,
    borderRadius: 10,
  },
  assetsName: {
    paddingHorizontal: 10,
  },
  price: {
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 10,
  },
  quantity: {
    color: "#666",
    marginBottom: 5,
  },
  limit: {
    color: "#666",
    marginBottom: 10,
  },
  balanceName: {
    color: "#111",
    fontWeight: "500",
    marginBottom: 5,
  },
  label: {
    color: "#00c31f",
    backgroundColor: "#e3ffe8",
    paddingHorizontal: 10,
    borderRadius: 10,
    fontWeight: "600",
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  closed: {
    backgroundColor: "#ddd",
    paddingHorizontal: 10,
    borderRadius: 10,
    fontWeight: "600",
    paddingVertical: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  closedLabel: {
    backgroundColor: "#ddd",
    paddingHorizontal: 10,
    borderRadius: 10,
    color: "#888",
    fontWeight: "600",
    paddingVertical: 5,
  },
  leftLine: {
    borderLeftWidth: 3,
    borderLeftColor: "#1400fb",
    paddingHorizontal: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 10,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#ddd",
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: "500",
  },
  tabText: {
    color: "#999",
    fontSize: 18,
    fontWeight: "500",
  },
  tabButton: {},
  subCrypto: {
    flexDirection: "row",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  activeCryptoText: {
    fontWeight: "700",
    marginBottom: 20,
    fontSize: 16,
  },
  cryptoText: {
    fontWeight: "700",
    marginBottom: 20,
    color: "#d7d7d7",
  },
  cryptohead: {
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },
  historyContainer: {
    flex: 1,
  },
  historyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 50,
  },
  CardContainer2: {
    marginBottom: 20,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBlockColor: "#eee",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  transactionType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008A16",
  },
  transactionDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
    fontWeight: "500",
  },
  transactionDetail: {
    fontSize: 14,
    color: "#888",
    marginBottom: 3,
    fontWeight: "500",
  },
  statusCompleted: {
    color: "#00c31f",
    fontWeight: "600",
    paddingHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  statusInProgress: {
    color: "#f2c600",
    fontWeight: "600",
    paddingHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  statusCancelled: {
    color: "#ff3b30",
    fontWeight: "600",
    paddingHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  statusDefault: {},
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  value: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
    fontWeight: "700",
  },
  amount: {
    fontWeight: "900",
    fontSize: 20,
  },
  transactionHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 8,
    paddingBottom: 8,
  },
  message: {
    left: 55,
  },
  dot: {
    backgroundColor: "#00c31f",
    height: 10,
    width: 10,
    borderRadius: 100,
  },
  closedot: {
    backgroundColor: "#666",
    height: 10,
    width: 10,
    borderRadius: 100,
  },
  currencyDetails: {
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  limitText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});

export default BureauDeChangeSell;
