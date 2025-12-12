import LoadingComp from "@/components/Loading";
import { IS_IOS_DEVICE } from "@/constants";
import { COLORS } from "@/constants/Colors";
import { useGlobals } from "@/context/GlobalContext";
import { _TSFixMe, formatAmount } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Crypto {
  id: number;
  uuid: string;
  name: string;
  symbol: string;
  icon: string;
  changes: number[];
  price_in_usd: number;
  change_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Stock {
  id: number;
  company: string;
  symbol: string;
  change: number;
  change_percent: number;
  price: number;
  logo: string;
}

const InvestAsset = () => {
  const [activeTab, setActiveTab] = useState("Stocks");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { isCryptoEnabled } = useGlobals();

  useEffect(() => {
    const fetchInvestmentAssets = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const response = await axios.get(
          "https://swiftpaymfb.com/api/investments/assets",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response?.data?.status === "success") {
          setStocks(response?.data?.data?.stocks);
          setCryptos(response?.data?.data?.crypto_currencies);
          await AsyncStorage.setItem(
            "naira_to_dollar_rate",
            String(response?.data?.data?.naira_to_dollar_rate)
          );
        }
        setLoading(false);
      } catch (err: any) {
        console.log(err?.response || err);
        setError("Failed to fetch stocks data");
        setLoading(false);
      }
    };

    fetchInvestmentAssets();
  }, []);

  const filteredStocks = stocks.filter((stock) =>
    stock.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setLoading(true);
    setError("");

    const fetchInvestmentAssets = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const response = await axios.get(
          "https://swiftpaymfb.com/api/investments/assets",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response?.data?.status === "success") {
          setStocks(response?.data?.data?.stocks);
          setCryptos(response?.data?.data?.crypto_currencies);
          await AsyncStorage.setItem(
            "naira_to_dollar_rate",
            String(response?.data?.data?.naira_to_dollar_rate)
          );
        }
        setLoading(false);
      } catch (err: any) {
        console.log(err?.response || err);
        setError("Failed to fetch stocks data");
        setLoading(false);
      }
    };

    fetchInvestmentAssets();
  }, []);

  if (loading) return <LoadingComp visible />;

  const filteredCryptos = cryptos.filter((crypto) =>
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStockItem = (stock: Stock) => {
    const isPositiveChange = stock.change >= 0;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        key={stock.id}
        style={styles.itemContainer}
        onPress={() =>
          router.push({
            pathname: "/InvestDetails",
            params: {
              hash_id: stock.symbol,
              type: "stock",
              id: stock.id,
              hold: "false",
            },
          })
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image style={styles.stockIcon} source={{ uri: stock.logo }} />
          <View style={styles.item}>
            <Text style={[styles.title, { maxWidth: 220 }]}>
              {stock.company}
            </Text>
            <Text style={styles.subText}>{stock.symbol}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text
            style={[
              styles.price,
              { color: isPositiveChange ? COLORS.greenText : COLORS.red },
            ]}
          >
            ${stock.price.toFixed(2)}
          </Text>
          <View style={styles.changeContainer}>
            <AntDesign
              name={isPositiveChange ? "caretup" : "caretdown"}
              size={12}
              color={isPositiveChange ? COLORS.greenText : COLORS.red}
              style={styles.caret}
            />
            <Text
              style={[
                styles.changePercent,
                { color: isPositiveChange ? COLORS.greenText : COLORS.red },
              ]}
            >
              {Math.abs(stock.change_percent).toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCryptoItem = (crypto: Crypto) => {
    const isPositiveChange = crypto.change_percentage >= 0;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        key={crypto.id}
        style={styles.itemContainer}
        onPress={() =>
          router.push({
            pathname: "/InvestDetails",
            params: { hash_id: crypto.id, type: "crypto", hold: "false" },
          })
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={{ uri: crypto.icon }} style={styles.icon} />
          <View style={styles.item}>
            <Text style={styles.title}>{crypto.name}</Text>
            <Text style={styles.subText}>{crypto.symbol}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text
            style={[
              styles.price,
              { color: isPositiveChange ? COLORS.greenText : COLORS.red },
            ]}
          >
            ${formatAmount(crypto.price_in_usd)}
          </Text>
          <View style={styles.changeContainer}>
            <AntDesign
              name={isPositiveChange ? "caretup" : "caretdown"}
              size={12}
              color={isPositiveChange ? COLORS.greenText : COLORS.red}
              style={styles.caret}
            />
            <Text
              style={[
                styles.changePercent,
                { color: isPositiveChange ? COLORS.greenText : COLORS.red },
              ]}
            >
              {Math.abs(crypto.change_percentage).toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invest Assetss</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder="Search assets..."
              style={styles.input}
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "Stocks" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("Stocks")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Stocks" && styles.activeTabText,
              ]}
            >
              Stocks
            </Text>
          </TouchableOpacity>

          {isCryptoEnabled && (
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "Cryptocurrency" && styles.activeTabItem,
              ]}
              onPress={() => setActiveTab("Cryptocurrency")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Cryptocurrency" && styles.activeTabText,
                ]}
              >
                Cryptocurrency
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        >
          {error ? (
            <Text style={styles.errorText}>
              {(error as _TSFixMe) instanceof Error
                ? (error as _TSFixMe).message
                : "Failed to fetch investment assets"}
            </Text>
          ) : activeTab === "Stocks" ? (
            filteredStocks.map(renderStockItem)
          ) : (
            filteredCryptos.map(renderCryptoItem)
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default InvestAsset;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: IS_IOS_DEVICE ? 11 : 40,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  backButton: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 48,
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTabItem: {
    borderBottomColor: "#0066ff",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#0066ff",
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "right",
  },
  subText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    borderRadius: 25,
  },
  item: {},
  sub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  stockIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  stockIconText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changePercent: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 2,
  },
  caret: {
    marginTop: 2,
  },
  loader: {
    marginTop: 30,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  cryptoIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    borderRadius: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
});
