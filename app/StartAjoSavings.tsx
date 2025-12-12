import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Clipboard,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import styled from "styled-components/native";
import { router, useFocusEffect } from "expo-router";
import { AntDesign, Ionicons, Entypo } from "@expo/vector-icons";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { COLORS } from "@/constants/Colors";
import { useAjoSavingsHistory } from "@/hooks/useApi";
import LoadingComp from "@/components/Loading";
import { showLogs } from "@/utils/logger";
import { formatAmount } from "@/utils";
import { IS_IOS_DEVICE } from "@/constants";

interface AjoSaving {
  id: number;
  type: string;
  amount: number;
  amount_earned: number | null;
  balance: number;
  pay_back_amount: number;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  days_left: number;
  duration: number;
  payment_method: string;
  referred_by: string | null;
  user_id: number;
}

interface AjoSavingsData {
  ajo_savings_balance: number;
  referral_code: string;
  active_ajo_savings: Array<AjoSaving>;
  savings_history: Array<AjoSaving>;
}

const StartAjoSavings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [savingAmount, setSavingAmount] = useState<number>(0);
  const [activeSaving, setActiveSaving] = useState<AjoSaving[]>([]);
  const [savingHistory, setSavingHistory] = useState<AjoSaving[]>([]);
  const [code, setCode] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: ajoHistory,
    isLoading,
    isFetching,
    isError,
  } = useAjoSavingsHistory();

  const fetchAjoSavingsData = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
        });
        router.replace("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/ajo-savings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("response:", response.data.data.active_ajo_savings);

      if (response.data.status === "success") {
        setSavingAmount(response.data.data.ajo_savings_balance);
        setActiveSaving(response.data.data.active_ajo_savings);
        setCode(response.data.data.referral_code);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to fetch Ajo savings data",
          text2: "Oops, something went wrong",
        });
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch Ajo savings data");

      // Fix: Use err instead of error
      if (axios.isAxiosError(err) && err.response) {
        const serverMessage = err.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "",
          position: "top",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAjoSavingsData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAjoSavingsData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAjoSavingsData();
    }, [])
  );

  const copyToClipboard = () => {
    Clipboard.setString(code);
    Toast.show({
      type: "success",
      text1: "Copied to Clipboard",
      text2: "Referral code copied to clipboard!",
      position: "top",
    });
  };

  const calculateProgress = (saving: AjoSaving) => {
    if (saving.duration === 0) return 100;
    const progressPercentage =
      ((saving.duration - saving.days_left) / saving.duration) * 100;
    return Math.min(Math.max(progressPercentage, 0), 100);
  };

  const formatDaysLeft = (days: number) => {
    if (days === 0) return "Due today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const groupedActiveSavings = activeSaving.reduce((acc, saving) => {
    const type = saving.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(saving);
    return acc;
  }, {} as Record<string, AjoSaving[]>);

  if (isLoading) {
    return <LoadingComp visible />;
  }

  // showLogs("ajoHistory", ajoHistory);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backbutton}
            onPress={() =>
              router.canGoBack() ? router.back() : router.push("/(tabs)")
            }
          >
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>AJO SAVINGS</Text>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingComp visible />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchAjoSavingsData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0062ff"]}
              />
            }
          >
            <View style={styles.dashboardCard}>
              <View style={styles.cardContent}>
                <View>
                  <View style={styles.rate}>
                    <Text style={styles.label}>6 - 135% per annum</Text>
                  </View>
                  <Text style={styles.balance}>Ajo savings balance</Text>
                  <Text style={styles.amount}>
                    ₦ {formatAmount(savingAmount)}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.savingsButton}
                    onPress={() => router.push("/CreateAjoSavings")}
                  >
                    <Text style={styles.savingsButtonText}>
                      Create Ajo Savings
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../assets/piggybankwhite.png")}
                  style={styles.cardImage}
                />
              </View>
            </View>

            <View style={styles.referralSection}>
              <View style={styles.flex}>
                <Text style={styles.reflabel}>Ajo Referral Code</Text>
                <TouchableOpacity
                  onPress={() => router.push("/SendAfricaReceiveMoney")}
                >
                  <Text style={styles.seemore}>See more</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeText}>{code}</Text>
                <TouchableOpacity
                  style={styles.referralButton}
                  onPress={copyToClipboard}
                  activeOpacity={0.8}
                >
                  <Text style={styles.referralButtonText}>📋</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <SectionTitle>History</SectionTitle>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/AllAjoHistory")}
                className="flex-row items-center space-x-2"
              >
                <Text className="text-swiftPayBlue font-medium text-[16px]">
                  See all
                </Text>
                <Entypo
                  name="chevron-small-right"
                  size={24}
                  color={COLORS.swiftPayBlue}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ajoHistory.data.slice(0, 4)}
              keyExtractor={(ajoHistory) => ajoHistory.id}
              showsHorizontalScrollIndicator={false}
              horizontal
              renderItem={({ item }) => (
                <View className="bg-[#f6f5ff] rounded-lg py-4 px-6 mr-4">
                  <View className="bg-[#a4cafe] p-2 rounded-lg self-end">
                    <Text className="font-semibold text-[13px]">
                      Earned ₦{formatAmount(item.amount_earned)}
                    </Text>
                  </View>

                  <Text className="mt-4 mb-3 font-bold text-swiftPayBlue text-[17px] text-center">
                    {item.type} Ajo Savings
                  </Text>
                  <Text className="text-center text-base">
                    for {item.duration} days
                  </Text>
                </View>
              )}
            />

            {/* <View style={styles.sectionHeader}>
              <TouchableOpacity
                onPress={() => router.push("/AllAjoHistory")}
                activeOpacity={0.8}
              ></TouchableOpacity>
            </View> */}
            <Text className="text-[19px] font-semibold mt-8 mb-6">Ongoing</Text>

            {activeSaving.length > 0 ? (
              <>
                {Object.keys(groupedActiveSavings).map((type) => (
                  <View key={type} style={styles.savingTypeGroup}>
                    {groupedActiveSavings[type].map((saving) => (
                      <TouchableOpacity
                        key={saving.id}
                        style={styles.ongoingCard}
                        activeOpacity={0.8}
                        onPress={() =>
                          router.push({
                            pathname: "/AjoSavingsDetails",
                            params: { hash_id: saving.id },
                          })
                        }
                      >
                        <View style={styles.iconContainer}>
                          <Image
                            source={require("../assets/piggybankwhite.png")}
                            style={styles.icon}
                          />
                        </View>
                        <View style={styles.ongoingDetails}>
                          <Text style={styles.ongoingTitle}>
                            {saving.type} Ajo Savings
                          </Text>
                          <View style={styles.flex}>
                            <Text style={styles.ongoingAmount}>
                              ₦{formatAmount(saving.balance)}
                            </Text>
                            {saving.pay_back_amount > 0 && (
                              <Text style={styles.payback}>
                                Payback ₦{formatAmount(saving.pay_back_amount)}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.lockStatus}>
                            <Text
                              style={
                                saving.days_left === 0 ? styles.matureText : {}
                              }
                            >
                              {saving.days_left === 0 ? "Mature " : "Locked "}
                            </Text>
                            <AntDesign
                              name={saving.days_left === 0 ? "unlock" : "lock"}
                              color={
                                saving.days_left === 0 ? "#00aa44" : "#0062ff"
                              }
                              size={14}
                            />
                          </Text>
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBarBackground}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  { width: `${calculateProgress(saving)}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.daysRemaining}>
                              {formatDaysLeft(saving.days_left)}
                            </Text>
                          </View>
                          <Text style={styles.paymentMethod}>
                            Funded via {saving.payment_method}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </>
            ) : null}

            {activeSaving.length === 0 && savingHistory.length === 0 && (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../assets/payments/4.png")}
                  style={{
                    height: 150,
                    width: 150,
                  }}
                />
                <Text style={styles.emptyText}>
                  You don't have any ongoing Ajo savings
                </Text>
                {/* <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.savingsButton,
                    { marginTop: 16, backgroundColor: "#0062ff" },
                  ]}
                  onPress={() => router.push("/CreateAjoSavings")}
                >
                  <Text style={[styles.savingsButtonText, { color: "#fff" }]}>
                    Start Saving Now
                  </Text>
                </TouchableOpacity> */}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
`;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: IS_IOS_DEVICE ? 10 : 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  backbutton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  dashboardCard: {
    backgroundColor: COLORS.swiftPayBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  rate: {
    backgroundColor: "#17A1FA69",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  balance: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },
  savingsButton: {
    backgroundColor: "#17A1FAC7",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  savingsButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  referralSection: {
    marginBottom: 10,
  },
  referralCodeContainer: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  referralCodeText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  flex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reflabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  seemore: {
    color: COLORS.swiftPayBlue,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    color: "#0062ff",
    marginRight: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  horizontalScrollView: {
    marginBottom: 24,
  },
  cashback: {
    color: "#fff",
    fontSize: 12,
    backgroundColor: "#0062ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  cashbackPending: {
    color: "#666",
    fontSize: 12,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  historyText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  historyAmount: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: "#666",
  },
  ongoingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  iconContainer: {
    backgroundColor: COLORS.swiftPayBlue,
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 32,
    height: 32,
    tintColor: "#fff",
  },
  ongoingDetails: {
    flex: 1,
  },
  ongoingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ongoingAmount: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  payback: {
    fontSize: 12,
    color: "#ff4444",
    backgroundColor: "#ffe5e5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockStatus: {
    fontSize: 14,
    color: "#333",
    marginVertical: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginRight: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.swiftPayBlue,
    borderRadius: 2,
  },
  daysRemaining: {
    fontSize: 12,
    color: "#666",
    minWidth: 70,
    textAlign: "right",
  },
  referralButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  referralButtonText: {
    color: "#0062ff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginTop: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#0062ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  savingTypeGroup: {
    marginBottom: 5,
  },
  savingTypeTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
    paddingLeft: 8,
  },
  matureText: {
    color: "#00aa44",
  },
  paymentMethod: {
    fontSize: 12,
    color: "#888",
    textTransform: "capitalize",
  },
});

export default StartAjoSavings;

function setRefreshing(arg0: boolean) {
  throw new Error("Function not implemented.");
}
