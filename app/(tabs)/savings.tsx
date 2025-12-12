import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/utils";
import { StatusBar } from "expo-status-bar";
import { IS_ANDROID_DEVICE } from "@/constants";

const SaveNow = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [balance, setBalance] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        setError("No auth token found. Please login.");
        router.push("/login");
        return;
      }

      const response = await axios.get("https://swiftpaymfb.com/api/savings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setBalance(response.data.data.wallet_balance);
        setError(null);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Session expired. Please login again.");
        await SecureStore.deleteItemAsync("userToken");
        router.push("/login");
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceText}>My SwiftPay balance</Text>
            <Text style={styles.balanceAmount}>
              ₦{balanceVisible ? formatAmount(+balance) : "*******"}{" "}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setBalanceVisible(!balanceVisible)}
            activeOpacity={0.7}
          >
            <AntDesign
              name={balanceVisible ? "eye" : "eyeo"}
              size={30}
              color="white"
            />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.savingsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.savingsCard}
            onPress={() => router.push("/SaveWithInterest")}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require("../../assets/icons/user.png")}
                style={styles.icon}
              />
              <Text style={styles.cardTitle}>Save With Interest</Text>
            </View>
            <View style={styles.textContainer1}>
              <Text style={styles.cardDescription}>
                Save Daily, Weekly & Monthly And Get Interest On Your Savings.
                Lock Your Savings And Create Multiple Savings Account/Wallet.
              </Text>
              <Image
                source={require("../../assets/interest.png")}
                style={styles.actionIcon}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.savingsCard}
            onPress={() => router.push("/GroupSavings")}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconContainer2}>
                <Image
                  source={require("../../assets/icons/Users.png")}
                  style={styles.icon2}
                />
              </View>
              <Text style={styles.cardTitle}>Group Savings</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardDescription}>
                Create your joint wallet & save with your friends, family or
                business partners. Save for a project or business, create a
                family savings online with your spouse. Monitor your members &
                the money saved by each member.
              </Text>
              <Image
                source={require("../../assets/group.png")}
                style={styles.actionIcon}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    gap: 20,
    marginTop: IS_ANDROID_DEVICE ? 20 : 0,
  },
  backButton: {
    padding: 10,
    borderRadius: 100,
    backgroundColor: "#fff",
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 4,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  balanceCard: {
    backgroundColor: "#0000ff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  balanceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  savingsContainer: {
    flex: 1,
  },
  savingsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "column",
    alignItems: "center",
    padding: 15,
    marginBottom: 16,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 4,
    //   },
    //   android: {
    //     elevation: 5,
    //   },
    // }),
  },
  iconContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textContainer1: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  cardDescription: {
    fontSize: 14,
    color: "#5C5C5C",
    width: 200,
    alignSelf: "flex-start",
    marginRight: 40,
  },
  actionIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  iconContainer2: {
    backgroundColor: "#0000ff",
    borderRadius: 100,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
    marginTop: -5,
  },
  icon2: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});

export default SaveNow;
