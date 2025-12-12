import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
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
import { SafeAreaView } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatAmount } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";
import { showLogs } from "@/utils/logger";

interface GroupSavings {
  total_group_savings_amount: number;
  group_savings: GroupSavingsItem[];
}

interface GroupSavingsItem {
  id: number;
  name: string;
  type: "flexible" | "locked" | string; // Add other possible types if needed
  description: string;
  balance: number;
  status: "active" | "inactive" | "completed" | string; // Add other possible statuses
  target_amount: number;
  end_date: string; // or Date if you'll parse it
  member_target_amount: number | null;
  members_count: number;
  created_at: string; // or Date
  updated_at: string; // or Date
  pivot: {
    user_id: number;
    group_savings_id: number;
    role: "member" | "admin" | string; // Add other possible roles
    status: "active" | "pending" | string; // Add other possible statuses
  };
}

const GroupDashboard = () => {
  const { displayLoader, hideLoader, user } = useAuth();

  const [Loading, setLoading] = useState(false);
  const [groupSavings, setGroupSavings] = useState<GroupSavings | null>(null);

  const fetchGroupSavings = async () => {
    try {
      setLoading(true);
      displayLoader();
      const response = await apiService.groupSavingsData();
      setGroupSavings(response.data);
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch group savings"
      );
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    fetchGroupSavings();
  }, []);

  // showLogs("groupSavings", groupSavings);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👋 Hi, {user?.first_name} </Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <LinearGradient
          colors={["#0000ff", "#3730a3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.savingsCard}
        >
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>Total Group Savings</Text>
            <Text style={styles.amount}>
              ₦
              {groupSavings
                ? formatCurrency(groupSavings?.total_group_savings_amount)
                : "0.00"}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Savings</Text>
                <Text style={styles.statValue}>
                  {groupSavings?.group_savings?.length}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active Groups</Text>
                <Text style={styles.statValue}>
                  {
                    groupSavings?.group_savings?.filter(
                      (i) => i.status == "active"
                    )?.length
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.8}
              onPress={() => router.push("/CreateGroupSavings")}
            >
              <LinearGradient
                colors={["#ffffff", "#f8fafc"]}
                style={styles.createButtonGradient}
              >
                <Text style={styles.createButtonText}>Create New Savings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Savings</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => router.push("/JoinGroup")}
                activeOpacity={0.8}
              >
                <AntDesign name="plus" size={18} color={"#fff"} />
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.history}
                onPress={() => router.push("/GroupSavingsHistory")}
                activeOpacity={0.8}
              >
                <AntDesign name="clockcircle" size={18} color={"#0000ff"} />
                <Text style={styles.historyText}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {(!groupSavings || groupSavings?.group_savings.length === 0) && (
            <View className="flex items-center justify-center mt-3">
              <Image
                source={require("../assets/interestmockup.png")}
                style={{
                  width: 180,
                  height: 180,
                  resizeMode: "cover",
                }}
              />
              <Text className="text-[17px] text-gray-200 font-semibold mt-3">
                No current group savings
              </Text>
            </View>
          )}

          {groupSavings?.group_savings?.map((item, index) => (
            <Animated.View
              entering={FadeInDown.delay(200 * index + 1)}
              key={item.id}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.savingsItem}
                onPress={() =>
                  router.push(`/GroupSavingsDetails?id=${item.id}`)
                }
              >
                <LinearGradient
                  colors={["#0000ff", "#0000ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savingsGradient}
                >
                  <View style={styles.savingsContent}>
                    <Image
                      source={require("../assets/icons/logo.png")}
                      style={styles.savingsLogo}
                    />
                    <View style={styles.savingsDetails}>
                      <Text style={styles.savingsTitleText}>{item.name}</Text>
                      <Text style={styles.savingsType}>{item.type}</Text>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberCount}>
                          +{item.members_count}{" "}
                          {item.members_count === 1 ? "Member" : "Members"}
                        </Text>
                        <AntDesign
                          name="arrowright"
                          size={20}
                          color={"#4338ca"}
                        />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.balance}>
                    ₦{formatAmount(item.balance)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: IS_ANDROID_DEVICE ? 50 : 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
    color: "#1e293b",
  },
  backButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savingsCard: {
    borderRadius: 25,
    padding: 24,
    elevation: 8,
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  card: {
    width: "100%",
    padding: 15,
    marginVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#ccc",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    backgroundColor: "#fff",
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
    fontSize: 40,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
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
    // width: 150,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // alignSelf: "center",
  },
  createButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  createButtonText: {
    color: "#0000ff",
    fontSize: 16,
    fontWeight: "700",
  },
  mainContent: {
    // padding: 20,
  },
  sectionHeader: {
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1e293b",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
    paddingVertical: 15,
  },
  joinButton: {
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 5,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 1,
    backgroundColor: "#0000ff",
    shadowColor: "#0000ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  history: {
    width: 100,
    borderWidth: 1,
    borderColor: "#0000ff",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
  },
  historyText: {
    color: "#0000ff",
    fontSize: 14,
    fontWeight: "500",
  },
  savingsItem: {
    marginVertical: 10,
    borderRadius: 20,
    elevation: 1,
    // shadowColor: "#4338ca",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.15,
    // shadowRadius: 10,
  },
  savingsGradient: {
    borderRadius: 20,
    // padding: 24,
  },
  balance: {
    fontSize: 30,
    fontWeight: "600",
    color: "#fff",
    marginVertical: 20,
    textAlign: "center",
  },
  savingsContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    // borderRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  savingsLogo: {
    width: 52,
    height: 52,
    marginRight: 16,
    // borderRadius: 26,
  },
  savingsDetails: {
    flex: 1,
  },
  savingsTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  savingsType: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 10,
    textTransform: "capitalize",
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
