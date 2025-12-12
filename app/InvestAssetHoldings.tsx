import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { _TSFixMe } from "@/utils";
import LoadingComp from "@/components/Loading";
import { IS_IOS_DEVICE } from "@/constants";

const InvestAssetHoldings = () => {
  const [activeTab, setActiveTab] = useState("Fiat");
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
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

      const response = await axios.get(
        "https://swiftpaymfb.com/api/holdings/assets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status === "success") {
        setHoldings(response.data?.data);
        setError(null);
      }
    } catch (error: any) {
      setLoading(false);
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
      setLoading(false);
    }
  };

  // Filter assets based on the search query
  const filteredFiats = (holdings as _TSFixMe)?.fiats.filter((fiat: any) =>
    fiat.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMetals = (holdings as _TSFixMe)?.metals.filter((metal: any) =>
    metal.metal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invest Assets</Text>
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
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              activeTab === "Fiat" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("Fiat")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Fiat" && styles.activeTabText,
              ]}
            >
              Fiat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              activeTab === "Metals" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("Metals")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Metals" && styles.activeTabText,
              ]}
            >
              Metals
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {loading ? (
            <LoadingComp visible />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : activeTab === "Fiat" ? (
            <>
              {filteredFiats?.map((fiat: any) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={fiat.id}
                  style={styles.itemContainer}
                  onPress={() =>
                    router.push({
                      pathname: "/InvestDetailsHoldings",
                      params: {
                        type: "fiat",
                        symbol: fiat.code,
                        holdingId: fiat.id,
                        hold: "false",
                      },
                    })
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Image
                      source={{ uri: fiat.logo_url }}
                      style={styles.icon}
                      contentFit="contain"
                      transition={200}
                    />
                    <View style={styles.item}>
                      <Text style={styles.title}>{fiat.code}</Text>
                      <Text style={styles.subText}>
                        {fiat.currency_symbol}
                        {fiat.rate} <AntDesign name="arrowright" />{" "}
                        {fiat.currency_symbol}
                        {fiat.price}
                      </Text>
                    </View>
                  </View>
                  <Image
                    source={require("../assets/portfolio/chart1.png")}
                    style={styles.icon}
                    contentFit="contain"
                    transition={200}
                  />
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.price}>
                      {fiat.currency_symbol}
                      {fiat.sell_price}
                    </Text>
                    <Text style={styles.sub}>Volume: {fiat.volume}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {filteredMetals?.map((metal: any) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={metal.id}
                  style={styles.itemContainer}
                  onPress={() =>
                    router.push({
                      pathname: "/InvestDetailsHoldings",
                      params: {
                        type: "metal",
                        symbol: metal.metal,
                        holdingId: metal.id,
                        hold: "false",
                      },
                    })
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Image
                      source={{ uri: "https://swiftpaymfb.com/metal.png" }}
                      style={styles.icon}
                      contentFit="contain"
                      transition={200}
                    />
                    <View style={styles.item}>
                      <Text style={styles.title}>
                        {metal.metal.toUpperCase()}
                      </Text>
                      <Text style={styles.subText}>
                        ${Number(metal.price).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <Image
                    source={require("../assets/images/line2.png")}
                    style={styles.icon}
                    contentFit="contain"
                    transition={200}
                  />
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.price}>
                      ${Number(metal.price).toLocaleString()}
                    </Text>
                    <Text style={styles.sub}>Current Price</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </GestureHandlerRootView>
      <Toast />
    </SafeAreaView>
  );
};

export default InvestAssetHoldings;

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
    paddingTop: IS_IOS_DEVICE ? 5 : 30,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
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
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabItem: {
    borderBottomColor: "#1400FB",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#1400FB",
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
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  price: {
    color: "green",
    fontSize: 14,
    fontWeight: "500",
  },
  subText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  item: {},
  flexTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coin: {
    fontSize: 12,
    fontWeight: "600",
  },
  subPrice: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
  },
  percentage: {
    backgroundColor: "#ff5361",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 20,
  },
  percentage3: {
    backgroundColor: "#07f8b5",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 20,
  },
  tobbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  activeTopBarItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#0000ff",
    color: "#333",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    width: 150,
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    alignSelf: "center",
  },
  notFound: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "400",
    color: "#0000ff",
  },
  sub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});
