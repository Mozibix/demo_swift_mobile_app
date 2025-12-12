import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  FlatList,
} from "react-native";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBroswer from "expo-web-browser";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { BuyCryptoData } from "./BuyBtc";
import { useAuth, User } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { showLogs } from "@/utils/logger";
import { _TSFixMe } from "@/utils";
import { Image } from "expo-image";
import { AccountDetails } from "@/types";
import { useGlobals } from "@/context/GlobalContext";

const AddMoney = () => {
  // Sample crypto data - replace with actual values as needed
  // const cryptoData = {
  //   USDT: {
  //     name: "USDT",
  //     price: "1.00",
  //     quantity: "1000",
  //     limits: "10-5000",
  //   },
  //   BTC: {
  //     name: "BTC",
  //     price: "68000",
  //     quantity: "0.5",
  //     limits: "0.001-1.0",
  //   },
  //   ETH: {
  //     name: "ETH",
  //     price: "3500",
  //     quantity: "5.0",
  //     limits: "0.01-10.0",
  //   },
  //   BNB: {
  //     name: "BNB",
  //     price: "600",
  //     quantity: "10.0",
  //     limits: "0.1-50.0",
  //   },
  // };

  interface Crypto_Data {
    id: number;
    uuid: string;
    name: string;
    symbol: string;
    icon: string;
    changes: string[];
    price_in_usd: number;
    change_percentage: number;
    status: string;
    created_at: string;
    updated_at: string;
  }

  const [userDetails, setUserDetails] = useState<User | undefined>(undefined);

  const [Amount, setAmount] = useState<number | undefined>();
  const [OpenFlutterwavepay, setOpenFlutterwavepay] = useState<boolean>(false);
  const [cryptoData, setCryptoData] = useState<Crypto_Data[] | null>(null);
  const [dollarRate, setDollarRate] = useState(0);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(
    null
  );
  const { displayLoader, hideLoader, user } = useAuth();
  const { isCryptoEnabled } = useGlobals();

  useEffect(() => {
    fetchCryptoData();
    getUserAccountDetails();
  }, []);

  async function getUserAccountDetails() {
    try {
      displayLoader();
      const response = await apiService.getBankDetails();
      setAccountDetails(response.data);
    } catch (error: _TSFixMe) {
      showLogs("getUserAccountDetails error", error.response);
    } finally {
      hideLoader();
    }
  }

  const handleOptionPress = (cryptoData: Crypto_Data) => {
    router.push({
      pathname: "/SellBtc",
      params: {
        cryptoName: cryptoData.name,
        price: cryptoData.price_in_usd * dollarRate,
        quantity: 0,
        limits: cryptoData.changes,
        crypto_id: cryptoData.id,
        uuid: cryptoData.uuid,
      },
    });
  };

  const fetchCryptoData = async () => {
    try {
      displayLoader();
      const response = await apiService.getSellPageData();

      if (response) {
        setDollarRate(response?.data.dollarRate);
        const cryptoNeeded = ["USDT", "BTC", "ETH", "BNB"];
        const filteredCrypto = response?.data.currencies.filter(
          (c: Crypto_Data) => cryptoNeeded.includes(c.symbol)
        );
        setCryptoData(filteredCrypto);
      }
    } catch (error: _TSFixMe) {
      showLogs("Error getting crypto data:", error);
    } finally {
      hideLoader();
    }
  };

  const _handlePressFlutterWave = async () => {
    if (!Amount || Amount < 100)
      return Toast.show({
        type: "error",
        text1: "Failed Topup",
        text2: "Amount should be more than a NGN 100",
        position: "bottom",
      });
    const hashID = userDetails?.hash_id;
    const url = `https://swiftpaymfb.com/visit-fund-wallet?user_hash_id=${hashID}&amount=${Amount}`;
    await WebBroswer.openBrowserAsync(url);
  };

  async function GetDetails() {
    const userDetailsString = await AsyncStorage.getItem("UserDetails");
    const data = userDetailsString ? JSON.parse(userDetailsString) : null;

    setUserDetails(data);
  }

  // Copy account number function
  const copyAccountNumber = async () => {
    if (!accountDetails?.account_number) {
      showErrorToast({
        title: "Account number not available",
      });
      return;
    }

    try {
      await Clipboard.setStringAsync(accountDetails?.account_number as string);
      showSuccessToast({
        title: "Copied!",
        desc: "Account number copied to clipboard",
      });
    } catch (error) {
      showErrorToast({
        title: "Error",
        desc: "Failed to copy account number",
      });
    }
  };

  const shareAccountDetails = async () => {
    if (!accountDetails?.account_number) {
      showErrorToast({
        title: "You don't have an account yet",
      });
      return;
    }

    try {
      const result = await Share.share({
        message: `Kindly use my account details to send me money:\n\nAccount Number: ${
          accountDetails?.account_number ?? "N/A"
        }\nBank Name: ${accountDetails?.bank_name ?? "N/A"}\nAccount Name: ${
          accountDetails?.account_name ?? "N/A"
        }`,
        title: "Bank Transfer Details",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Activity type on iOS
          console.log("Shared via:", result.activityType);
        } else {
          // Shared successfully
          Toast.show({
            type: "success",
            text1: "Shared",
            text2: "Account details shared successfully",
            position: "top",
            topOffset: 50,
          });
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log("Account sharing dismissed.");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to share account details",
        position: "top",
        topOffset: 50,
      });

      if (error instanceof Error) {
        console.log("Error sharing account details:", error.message);
      } else {
        console.log("An unknown error occurred while sharing.");
      }
    }
  };

  useEffect(() => {
    GetDetails();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <AntDesign name="arrowleft" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Money</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.bankHeader}
            onPress={() => router.push("/Transfer")}
            activeOpacity={0.8}
          >
            <Image
              source={require("../assets/icons/bank.png")}
              style={styles.bankImage}
            />
            <View style={{ marginRight: 30 }}>
              <Text style={styles.methodTitle}>Bank Transfer</Text>
              <Text style={styles.methodSubtitle}>
                Add money via mobile or internet banking.
              </Text>
            </View>
            <AntDesign name="right" size={16} />
          </TouchableOpacity>
          <Text style={styles.desc}>SwiftPay Account Number</Text>
          <Text style={styles.accountNumber}>
            {accountDetails?.account_number ?? "N/A"}
          </Text>
          <Text style={styles.bankName}>Bank Name</Text>
          <Text style={styles.banname}>
            {accountDetails?.bank_name ?? "N/A"}
          </Text>

          <Text style={styles.bankName}>Account Name</Text>
          <Text style={styles.banname}>
            {accountDetails?.account_name ?? "N/A"}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={copyAccountNumber}
              style={styles.copyButton}
            >
              <FontAwesome name="clipboard" size={18} color={"white"} />
              <Text style={styles.buttonText}>Copy Number</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={shareAccountDetails}
              style={styles.shareButton}
            >
              <Ionicons name="share-outline" size={18} color={"#0000ff"} />
              <Text style={styles.sharebuttonText}>Share Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider}></View>
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider}></View>
        </View>

        <View style={styles.methodList}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setOpenFlutterwavepay(!OpenFlutterwavepay)}
            style={styles.methodItem}
          >
            <View style={styles.flex}>
              <Image
                source={require("../assets/icons/flutterwave.png")}
                style={styles.bankImage}
              />
              <Text style={styles.methodName}>Flutter Wave</Text>
            </View>
            <AntDesign name={OpenFlutterwavepay ? "down" : "right"} size={16} />
          </TouchableOpacity>

          {OpenFlutterwavepay && (
            <View style={{ marginBottom: 15 }}>
              <Text
                style={[
                  styles.methodSubtitle,
                  { width: "100%", color: "black" },
                ]}
              >
                How much do you want to Pay?
              </Text>
              <View style={{ gap: 10, flexDirection: "row" }}>
                <TextInput
                  placeholder="Amount..."
                  keyboardType="numeric"
                  onChangeText={(text) => setAmount(Number(text))}
                  style={{
                    borderWidth: 1,
                    borderColor: "grey",
                    borderRadius: 5,
                    padding: 5,
                    flex: 1,
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={_handlePressFlutterWave}
                  style={{
                    backgroundColor: "blue",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                    borderRadius: 5,
                  }}
                >
                  <Text style={[styles.methodList, { color: "white" }]}>
                    Pay now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isCryptoEnabled && (
            <>
              <Text style={styles.methodHead}>
                International Deposit Method
              </Text>

              <FlatList
                data={cryptoData}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={({ item: crypto }) => (
                  <TouchableOpacity
                    style={styles.methodItem}
                    onPress={() => handleOptionPress(crypto)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.flex}>
                      <Image
                        source={{ uri: crypto.icon }}
                        style={styles.bankImage}
                      />
                      <View>
                        <Text style={styles.methodName}>{crypto.name}</Text>
                        <Text style={styles.methodSymbol}>{crypto.symbol}</Text>
                      </View>
                    </View>
                    <AntDesign name="right" size={16} />
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {/* <TouchableOpacity
            style={styles.methodItem}
            onPress={() => handleOptionPress(cryptoData.BTC)}
            activeOpacity={0.8}
          >
            <View style={styles.flex}>
              <Image
                source={require("../assets/icons/bitcoin.png")}
                style={styles.bankImage}
              />
              <Text style={styles.methodName}>BTC</Text>
            </View>
            <AntDesign name="right" size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodItem}
            onPress={() => handleOptionPress(cryptoData.ETH)}
            activeOpacity={0.8}
          >
            <View style={styles.flex}>
              <Image
                source={require("../assets/icons/ethereum.png")}
                style={styles.bankImage}
              />
              <Text style={styles.methodName}>ETH</Text>
            </View>
            <AntDesign name="right" size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodItem}
            onPress={() => handleOptionPress(cryptoData.BNB)}
            activeOpacity={0.8}
          >
            <View style={styles.flex}>
              <Image
                source={require("../assets/icons/bnb.png")}
                style={styles.bankImage}
              />
              <Text style={styles.methodName}>BNB</Text>
            </View>
            <AntDesign name="right" size={16} />
          </TouchableOpacity> */}
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  backButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
    marginRight: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 30,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 14,
    color: "#7D7D7D",
    width: 180,
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  bankName: {
    fontSize: 14,
    color: "#7D7D7D",
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  copyButton: {
    backgroundColor: "#0047FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  shareButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#0000ff",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "medium",
  },
  sharebuttonText: {
    color: "#0000ff",
    fontWeight: "medium",
  },
  orText: {
    textAlign: "center",
    fontSize: 16,
    color: "#7D7D7D",
    marginVertical: 20,
  },
  methodList: {},
  methodItem: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodName: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  methodSymbol: {
    fontSize: 15,
    color: "#888",
    marginTop: 2,
  },
  bankImage: {
    width: 40,
    height: 40,
    marginRight: 20,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
    marginTop: -20,
  },
  desc: {
    color: "#666",
  },
  banname: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  divider: {
    backgroundColor: "#ccc",
    height: 1,
    width: "45%",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodHead: {
    fontWeight: "600",
    fontSize: 18,
    marginVertical: 10,
  },
});

export default AddMoney;
