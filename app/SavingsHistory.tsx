import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated as RNAnimated,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Fontisto } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Overlay } from "@rneui/themed";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { apiService } from "@/services/api";
import { formatDate } from "@/utils/formatters";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Toast from "react-native-toast-message";
import LoadingComp from "@/components/Loading";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { formatAmount } from "@/utils";
import { showLogs } from "@/utils/logger";

interface UserProfile {
  first_name: string;
  // Add other expected properties of the user profile here
}

interface Saving {
  id: number;
  name: string;
  balance: string;
  type: string;
  status: string;
  interest_accumulated: string;
  end_date: string | null;
}

interface InterestSavingsData {
  total_savings: string;
  savings: Saving[];
  locked_savings_interest_rate: string;
  unlocked_savings_interest_rate: string;
}

const SavingsHistory = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [interestRates, setInterestRates] = useState<{
    locked: number;
    unlocked: number;
  }>({
    locked: 0,
    unlocked: 0,
  });

  const [History, setHistory] = useState<Saving[]>([]);
  const [Loading, setLoading] = useState(false);

  async function getPageDetails() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await axios({
        url: `https://swiftpaymfb.com/api/interest-savings/history`,
        method: "get",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      setInterestRates({
        locked: response.data.data.locked_savings_interest_rate,
        unlocked: response.data.data.unlocked_savings_interest_rate,
      });
      setHistory(response.data.data.closed_savings);
    } catch (error: any) {
      console.log(error, error?.response);

      Toast.show({
        type: "error",
        text1: "Failed to fetch data",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getPageDetails();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInUp.delay(400)}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.viewHiistroryHeader}>
          <Text style={styles.sectionTitle}>Savings History</Text>
        </View>
      </Animated.View>

      <ScrollView
        refreshControl={
          <RefreshControl onRefresh={getPageDetails} refreshing={Loading} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ marginHorizontal: 15 }}
      >
        <LoadingComp visible={Loading} />

        <View>
          {History.length > 0 ? (
            History.map((saving, index) => (
              <Animated.View
                key={saving.id}
                entering={FadeInDown.delay(200 * index + 1)}
              >
                <TouchableOpacity
                  key={saving.id}
                  style={styles.savingsItem}
                  onPress={() => router.push(`/SavingsDetails?id=${saving.id}`)}
                >
                  <View style={styles.savingsContent}>
                    <Image
                      source={require("../assets/icons/logo.png")}
                      style={styles.savingsLogo}
                    />
                    <View>
                      <Text style={styles.savingsTitleText}>{saving.name}</Text>
                      <Text style={styles.savingsSubText}>
                        {saving.type === "locked"
                          ? interestRates?.locked
                          : interestRates.unlocked}
                        %{" "}
                        <Text style={{ color: "#0000ff", fontSize: 15 }}>
                          •
                        </Text>{" "}
                        <Text
                          style={{
                            color: "#666",
                            fontWeight: "500",
                            marginTop: 5,
                          }}
                        >
                          {saving.type === "locked" ? (
                            <Fontisto name="locked" size={20} color="black" />
                          ) : (
                            <Fontisto name="unlocked" size={20} color="black" />
                          )}{" "}
                          {saving.type}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.balance}>
                    ₦{formatAmount(+saving.balance)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View>
              <Image
                source={require("../assets/interestmockup.png")}
                style={styles.mock}
              />
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  fontWeight: "600",
                  fontSize: 20,
                }}
              >
                No Savings History
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  marginTop: 5,
                  fontSize: 15,
                  color: "#555",
                }}
              >
                All your savings history would appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SavingsHistory;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  username: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 40,
  },
  subtext: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  savingsCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    elevation: 5,
    overflow: "hidden",
    width: "98%",
    alignSelf: "center",
  },
  savingsInfo: {
    flex: 1,
    padding: 15,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000",
  },
  mock: {
    width: "80%",
    height: 280,
    alignSelf: "center",
    resizeMode: "contain",
  },
  amount: {
    fontSize: 30,
    fontWeight: "700",
    marginVertical: 10,
  },
  interest: {
    fontSize: 14,
    color: "#666",
  },
  percent: {
    color: "#32CD32",
  },
  createButton: {
    backgroundColor: "#0000ff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    alignItems: "center",
    alignSelf: "center",
    left: 80,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  coinsImage: {
    width: 150,
    height: 150,
    top: -20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 18,
    marginLeft: 4,
  },
  savingsItem: {
    backgroundColor: "#0000ff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 40,
    height: 150,
    elevation: 5,
  },
  savingsContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    paddingHorizontal: 10,
    width: "100%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  savingsLogo: {
    width: 60,
    height: 60,
    marginRight: 30,
  },
  savingsTitleText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  savingsSubText: {
    fontSize: 16,
    color: "#32CD32",
    fontWeight: "700",
    alignItems: "center",
  },
  balance: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
    alignSelf: "center",
  },
  unlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unlockText: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewHiistroryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  history: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0000ff",
  },
});
