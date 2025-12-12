import React, { useState, useRef, Fragment } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated as RNAnimated,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "@/services/api";
import { Alert } from "react-native";
import LoadingComp from "@/components/Loading";
import {
  formatcalculateTimeRemaining,
  formatCurrency,
} from "@/utils/formatters";
import { StatusBar } from "expo-status-bar";
import { showLogs } from "@/utils/logger";
import { COLORS } from "@/constants/Colors";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { IS_ANDROID_DEVICE } from "@/constants";

interface GroupSavings {
  total_group_savings_amount: number;
  closed_savings: GroupSavingsItem[];
}

interface GroupSavingsItem {
  id: number;
  name: string;
  type: "flexible" | "locked" | string;
  description: string;
  balance: number;
  status: "active" | "inactive" | "completed" | string;
  target_amount: number;
  end_date: string;
  member_target_amount: number | null;
  members_count: number;
  created_at: string;
  updated_at: string;
  pivot: {
    user_id: number;
    group_savings_id: number;
    role: "member" | "admin" | string;
    status: "active" | "pending" | string;
  };
}

const GroupSavingsHistory = () => {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  interface UserProfile {
    first_name: string;
  }

  const [Loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [groupSavings, setGroupSavings] = useState<GroupSavingsItem[] | null>(
    null
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      setUserProfile(response);
      console.log(response);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupSavings = async () => {
    try {
      setLoading(true);
      const response = await apiService.groupSavingsHistory();
      showLogs("response", response);
      setGroupSavings(response.data);
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch group savings"
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
      fetchGroupSavings();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      setVisible(true);
      fadeIn();
      return () => fadeOut();
    }, [])
  );

  const fadeIn = () => {
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    RNAnimated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    fadeOut();
    setVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.delay(400)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="left" size={25} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Savings History </Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <StatusBar style="dark" />

        <LoadingComp visible={Loading} />

        <View style={styles.mainContent}>
          {groupSavings?.length === 0 ? (
            <View>
              <Image
                source={require("../assets/interestmockup.png")}
                style={styles.mock}
              />
              <Text className="text-center text-[22px] font-semibold">
                No history yet
              </Text>
              <Text className="text-center text-[15px] text-gray-600 mt-2">
                All your group saving history will appear here
              </Text>
            </View>
          ) : (
            <Fragment>
              {groupSavings?.map((item, index) => (
                <Animated.View
                  entering={FadeInDown.delay(200 * index + 1)}
                  key={item.id}
                >
                  <TouchableOpacity
                    style={styles.savingsItem}
                    onPress={() =>
                      router.push(`/GroupSavingsDetails?id=${item.id}`)
                    }
                  >
                    <LinearGradient
                      colors={[COLORS.swiftPayBlue, "#3730a3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.savingsGradient}
                    >
                      <Text style={styles.balance}>₦{item.balance}</Text>
                      <View style={styles.savingsContent}>
                        <Image
                          source={require("../assets/icons/logo.png")}
                          style={styles.savingsLogo}
                        />
                        <View style={styles.savingsDetails}>
                          <Text style={styles.savingsTitleText}>
                            {item.name}
                          </Text>
                          <Text style={styles.daysLeft}>{item.type}</Text>
                          <View style={styles.memberInfo}>
                            <Text style={styles.memberCount}>
                              +{item.members_count} Members
                            </Text>
                            <AntDesign
                              name="arrowright"
                              size={20}
                              color={"#4338ca"}
                            />
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Fragment>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupSavingsHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: IS_ANDROID_DEVICE ? 50 : 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 15,
    color: "#1e293b",
  },
  backButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savingsCard: {
    margin: 20,
    borderRadius: 28,
    padding: 28,
    elevation: 8,
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  savingsInfo: {
    width: "100%",
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#e0e7ff",
    marginBottom: 8,
  },
  amount: {
    fontSize: 42,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  mock: {
    width: "80%",
    height: 280,
    alignSelf: "center",
    resizeMode: "contain",
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#e0e7ff",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  statDivider: {
    width: 1,
    height: 45,
    backgroundColor: "rgba(99, 102, 241, 0.4)",
    marginHorizontal: 28,
  },
  createButton: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "#4338ca",
    fontSize: 16,
    fontWeight: "700",
  },
  mainContent: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  joinButton: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  history: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#4338ca",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
  },
  historyText: {
    color: "#4338ca",
    fontSize: 16,
    fontWeight: "600",
  },
  savingsItem: {
    marginBottom: 20,
    borderRadius: 28,
    elevation: 6,
    shadowColor: COLORS.swiftPayBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  savingsGradient: {
    borderRadius: 28,
    padding: 24,
  },
  balance: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  savingsContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 20,
  },
  savingsLogo: {
    width: 52,
    height: 52,
    marginRight: 16,
    borderRadius: 26,
  },
  savingsDetails: {
    flex: 1,
  },
  savingsTitleText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  daysLeft: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 10,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4338ca",
  },
});
