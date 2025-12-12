import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Fontisto } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Overlay } from "@rneui/themed";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { apiService } from "@/services/api";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { formatAmount, formatAmountMinimal } from "@/utils";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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

const SaveNow = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [interestSavings, setInterestSavings] =
    useState<InterestSavingsData | null>(null);
  const { displayLoader, hideLoader } = useAuth();

  const fetchUserProfile = async () => {
    try {
      displayLoader();
      const response = await apiService.getUserProfile();
      setUserProfile(response);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch profile"
      );
    }
  };

  //fetch interest savings
  const fetchInterestSavings = async () => {
    try {
      const response = await apiService.getInterestSavings();
      // showLogs("response", response.data);
      setInterestSavings(response.data);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch interest savings"
      );
    } finally {
      hideLoader();
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchInterestSavings();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ marginHorizontal: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.username}>Hi, {userProfile?.first_name}! 👋</Text>
        <Text style={styles.subtext}>Don't forget to save your money!</Text>

        <ImageBackground
          source={require("../assets/images/tab2.png")}
          style={styles.savingsCard}
          imageStyle={{
            resizeMode: "cover",
            width: "100%",
          }}
        >
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>Total Savings</Text>
            <Text style={styles.amount}>
              ₦
              {formatAmountMinimal(
                Number(interestSavings?.total_savings ?? 0)
              ) || "0.00"}
            </Text>

            <Text style={styles.interest}>Interest Rate</Text>
            <Text style={styles.percent}>20%</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.createButton}
              onPress={() => router.push("/CreateSavings")}
            >
              <Text style={styles.createButtonText}>Create Savings</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={require("../assets/icons/coin.png")}
            style={styles.coinsImage}
          />
        </ImageBackground>

        <View>
          <View style={styles.viewHiistroryHeader}>
            <Text style={styles.sectionTitle}>Savings</Text>
            <TouchableOpacity onPress={() => router.push("/SavingsHistory")}>
              <Text style={styles.history}>History</Text>
            </TouchableOpacity>
          </View>

          <View>
            {interestSavings?.savings.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Image
                  source={require("../assets/interestmockup.png")}
                  style={styles.image}
                />
                <Text className="text-[18px] font-bold">No savings yet</Text>
              </View>
            ) : (
              <View>
                {interestSavings?.savings.map((saving, index) => (
                  <Animated.View
                    key={saving.id}
                    entering={FadeInDown.delay(200 * index + 1)}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={saving.id}
                      style={styles.savingsItem}
                      onPress={() =>
                        router.push(`/SavingsDetails?id=${saving.id}`)
                      }
                    >
                      <View style={styles.savingsContent}>
                        <Image
                          source={require("../assets/icons/logo.png")}
                          style={styles.savingsLogo}
                        />
                        <View>
                          <Text style={styles.savingsTitleText}>
                            {saving.name}
                          </Text>
                          <Text style={styles.savingsSubText}>
                            {saving.type === "locked"
                              ? interestSavings.locked_savings_interest_rate
                              : interestSavings.unlocked_savings_interest_rate}
                            %{" "}
                            {saving.type === "locked" && (
                              <Text style={{ color: "#0000ff", fontSize: 15 }}>
                                •
                              </Text>
                            )}{" "}
                            <Text
                              style={{
                                color: "#999",
                                fontWeight: "500",
                                fontSize: 14,
                              }}
                            >
                              {saving.type === "locked"
                                ? `Ends: ${
                                    saving?.end_date
                                      ? formatDate(saving?.end_date)
                                      : null
                                  }`
                                : ""}
                              {`\n`}
                              <Fontisto
                                name={
                                  saving.type === "locked"
                                    ? "locked"
                                    : "unlocked"
                                }
                                size={15}
                                color="black"
                              />{" "}
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
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SaveNow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 30,
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
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 50,
    alignSelf: "flex-start",
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
  amount: {
    fontSize: 30,
    fontWeight: "700",
    marginVertical: 10,
  },
  interest: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  percent: {
    color: "#32CD32",
    fontWeight: "600",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  createButton: {
    backgroundColor: "#0000ff",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginTop: 10,
    alignItems: "center",
    alignSelf: "center",
    left: 80,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  coinsImage: {
    width: 150,
    height: 150,
    top: -20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    paddingVertical: 10,
  },
  history: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0000ff",
  },
});
