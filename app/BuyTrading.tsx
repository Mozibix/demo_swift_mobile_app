import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import React, { Fragment, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCalculateNairaAmount, useCryptoData } from "../hooks/useApi";
import { Image as ExpoImage } from "expo-image";
import LoadingComp from "@/components/Loading";
import { showLogs } from "@/utils/logger";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import copyToClipboard, { formatAmount } from "@/utils";
import { formatDistanceToNow } from "date-fns";

type ExchangeProps = {
  navigation: {
    goBack: () => void;
  };
};

const BuyTrading: React.FC<ExchangeProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"Buy" | "History">("Buy");
  const [activeStatus, setActiveStatus] = useState<
    "All" | "pending" | "completed" | "cancelled"
  >("All");

  // Add crypto data query
  const { data: cryptoData, isLoading, error } = useCryptoData();

  // showLogs("cryptoData history", cryptoData.history);

  const filteredTransactions =
    cryptoData?.history?.filter((transaction: { status: string }) =>
      activeStatus === "All" ? true : transaction.status === activeStatus
    ) || [];

  const handleOptionPress = (cryptoData: {
    name: string;
    price_in_usd: number;
    uuid: string;
    symbol: string;
    id: number; // Add id to the type
  }) => {
    router.push({
      pathname: "/BuyBtc",
      params: {
        name: cryptoData.name,
        price: cryptoData.price_in_usd,
        uuid: cryptoData.uuid,
        symbol: cryptoData.symbol,
        price_in_usd: cryptoData.price_in_usd,
        crypto_id: cryptoData.id, // Pass the crypto_id
      },
    });
  };

  if (isLoading) {
    return (
      <LoadingComp visible />
      // <View style={[styles.container, styles.centerContent]}>
      //   <Text>Loading crypto data...</Text>
      // </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Error loading crypto data. Please try again.</Text>
      </View>
    );
  }

  // showLogs("cryptoData", cryptoData);
  const dollarRate = cryptoData?.dollarRate ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInUp.delay(200)}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>S2P Trading</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={
            activeTab === "Buy" ? styles.activeTabButton : styles.tabButton
          }
          onPress={() => setActiveTab("Buy")}
        >
          <Text
            style={activeTab === "Buy" ? styles.activeTabText : styles.tabText}
          >
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={
            activeTab === "History" ? styles.activeTabButton : styles.tabButton
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
      {activeTab === "Buy" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {cryptoData?.currencies.map((crypto: any, index: number) => (
            <View>
              <TouchableOpacity
                activeOpacity={0.6}
                key={crypto.id}
                onPress={() =>
                  handleOptionPress({
                    name: crypto.name,
                    price_in_usd: crypto.price_in_usd,
                    uuid: crypto.uuid,
                    symbol: crypto.symbol,
                    id: crypto.id, // Pass the id from the crypto data
                  })
                }
              >
                <View style={styles.CardContainer}>
                  <View style={styles.optionContainer}>
                    <View style={styles.textContainer}>
                      <ExpoImage
                        source={{ uri: crypto.icon }}
                        style={{
                          width: 40,
                          height: 40,
                          marginRight: 12,
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 2,
                          },
                          shadowOpacity: 0.1,
                          shadowRadius: 3,
                        }}
                        contentFit="contain"
                      />
                      <Text style={styles.title}>{crypto.name}</Text>
                    </View>
                    <View style={styles.label}>
                      <View
                        style={
                          crypto.status === "open"
                            ? styles.dot
                            : styles.closedot
                        }
                      ></View>
                      <Text
                        style={
                          crypto.status === "open"
                            ? styles.label
                            : styles.closedLabel
                        }
                      >
                        {crypto.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.assetsName}>
                    <Text style={styles.price}>
                      $ {crypto.price_in_usd?.toLocaleString()}
                    </Text>
                    <Text style={styles.quantity}>
                      NGN {formatAmount(crypto.price_in_usd * dollarRate)}
                    </Text>
                    <View style={styles.leftLine}>
                      <Text style={styles.balanceName}>SwiftPay Balance</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status Filter Tabs */}
          <View style={styles.subCrypto}>
            {["All", "pending", "completed", "cancelled"].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setActiveStatus(status as any)}
              >
                <Text
                  style={
                    activeStatus === status
                      ? styles.activeCryptoText
                      : styles.cryptoText
                  }
                  className="capitalize"
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction History */}
          <View style={styles.historyContainer}>
            {(() => {
              const filteredHistory = cryptoData?.history?.filter(
                (transaction: { status: string }) =>
                  activeStatus === "All" || transaction.status === activeStatus
              );

              if (!filteredHistory || filteredHistory.length === 0) {
                return (
                  <Animated.View
                    entering={FadeInDown.delay(100)}
                    className="items-center justify-center mt-6"
                  >
                    <Image
                      source={require("../assets/payments/2.png")}
                      style={{ width: 200, height: 200 }}
                    />
                    <Text className="text-[20px] font-semibold">
                      No transactions found
                    </Text>
                    <Text className="text-gray-200 text-base">
                      No {activeStatus === "All" ? "" : activeStatus}{" "}
                      transactions yet
                    </Text>
                  </Animated.View>
                );
              }

              return (
                <Fragment>
                  {filteredHistory.map((transaction: any, idx: number) => (
                    <Animated.View
                      entering={FadeInDown.delay(100 * idx + 1)}
                      key={transaction.id}
                      style={styles.transactionCard}
                    >
                      <View style={styles.transactionHeaderContainer}>
                        <View style={styles.transactionHeader}>
                          <Text style={styles.transactionType}>
                            Buy {transaction.crypto_symbol}
                          </Text>
                          <Text style={getStatusStyle(transaction.status)}>
                            {transaction.status}
                          </Text>
                        </View>
                        <Text style={styles.transactionDate}>
                          {formatDistanceToNow(
                            new Date(transaction.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.transactionDetail}>
                          Crypto Name
                        </Text>
                        <Text style={styles.name}>
                          {transaction.crypto_name}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.transactionDetail}>
                          Amount in NGN
                        </Text>
                        <Text style={styles.amount}>
                          {transaction.amount_in_naira?.toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.transactionDetail}>Rate</Text>
                        <Text style={styles.value}>
                          ₦
                          {formatAmount(
                            transaction.amount_in_naira /
                              transaction.amount_in_crypto
                          )}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.transactionDetail}>
                          Crypto Amount
                        </Text>
                        <Text style={styles.value}>
                          {transaction.amount_in_crypto}{" "}
                          {transaction.crypto_symbol}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.transactionDetail}>
                          Wallet Address
                        </Text>
                        <View style={styles.orderNumberContainer}>
                          <Text style={styles.value}>
                            {transaction.wallet_address.slice(0, 15) + "..."}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              copyToClipboard(
                                transaction.wallet_address,
                                "Wallet Address"
                              )
                            }
                          >
                            <AntDesign name="copy1" size={18} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </Fragment>
              );
            })()}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "completed":
      return styles.statusCompleted;
    case "pending":
      return styles.statusInProgress;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
};

// Add these new styles
const additionalStyles = StyleSheet.create({
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});

// Merge with existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
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
    backgroundColor: "#f9fafb",
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
    fontSize: 16,
    color: "#666",
    marginBottom: 3,
    fontWeight: "700",
  },
  amount: {
    fontWeight: "600",
    fontSize: 20,
  },
  name: {
    fontWeight: "500",
    fontSize: 18,
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
  ...additionalStyles,
});

export default BuyTrading;
