import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../services/api";
import { useAuthStore } from "../stores/useAuthStore";
import * as WebBroswer from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";
import { _TSFixMe, navigationWithReset } from "@/utils";
import { Image } from "expo-image";
import * as Application from "expo-application";
import { useGlobals } from "@/context/GlobalContext";
import { showErrorToast } from "@/components/ui/Toast";

type Section =
  | "finances"
  | "holdings"
  | "depositWithdrawal"
  | "international"
  | "ajo";

const Profile = () => {
  const [expandedSections, setExpandedSections] = useState<{
    finances: boolean;
    holdings: boolean;
    depositWithdrawal: boolean;
    international: boolean;
    ajo: boolean;
  }>({
    finances: false,
    holdings: false,
    depositWithdrawal: false,
    international: false,
    ajo: false,
  });
  const navigation = useNavigation();
  const { user, displayLoader, hideLoader } = useAuth();
  const { isCryptoEnabled, isHoldingsEnabled, isInvestmentsEnabled } =
    useGlobals();

  const toggleSection = (section: Section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      useAuthStore.getState().logout();
      await AsyncStorage.clear();
      navigationWithReset(navigation, "login");
    } catch (error) {
      navigationWithReset(navigation, "login");
    }
  };

  const _handlePressTerms = async () => {
    const url = "https://swiftpaymfb.com/terms-and-conditions"; // Replace with your terms URL
    await WebBroswer.openBrowserAsync(url);
  };

  const _handlePressPrivacy = async () => {
    const url = "https://swiftpaymfb.com/privacy-policy"; // Replace with your terms URL
    await WebBroswer.openBrowserAsync(url);
  };

  const _handlePressLiveChat = async () => {
    const userDetailsString = await AsyncStorage.getItem("UserDetails");
    const hashID = userDetailsString
      ? JSON.parse(userDetailsString).hash_id
      : null;
    const url = `https://swiftpaymfb.com/visit-live-chat?user_hash_id=${hashID}`;
    await WebBroswer.openBrowserAsync(url);
  };

  async function initiateOTP() {
    try {
      displayLoader();
      await apiService.triggerOTP();
      router.push("/VerifyAccount?isResettingPin=true");
    } catch (err: _TSFixMe) {
      showErrorToast({
        title: "Failed to send OTP",
        desc: "Please try again",
      });
    } finally {
      hideLoader();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInUp.delay(300)}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <AntDesign name="arrowleft" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => router.push("/MyAccount")}
            style={styles.listItem}
          >
            <MaterialCommunityIcons name="account" size={24} color="#000" />
            <Text style={styles.listText}>Your Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.listItem}
            activeOpacity={1}
            // onPress={
            //   user?.kyc_status === "unverified"
            //     ? () => router.push("/KycLevelOne")
            //     : () => {}
            // }
          >
            <MaterialCommunityIcons
              name="shield-check"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Account Verification</Text>
            <Text
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    user?.kyc_status === "unverified" ? "#CC1212" : "#00A05D",
                },
              ]}
            >
              {user?.kyc_status === "unverified" ? "Unverified" : "Verified"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => router.push("/Notification")}
          >
            <MaterialCommunityIcons name="bell" size={24} color="#000" />
            <Text style={styles.listText}>Notification</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Finances</Text>
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => toggleSection("finances")}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Money Exchange</Text>
            <AntDesign
              name={expandedSections.finances ? "up" : "down"}
              size={18}
              color="#000"
            />
          </TouchableOpacity>

          {expandedSections.finances && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.subListItem}
                onPress={() => router.push("/BuyCryptoScreen")}
              >
                <Text style={styles.subListText}>
                  {isCryptoEnabled
                    ? "Buy Currencies, Crypto & Giftcards"
                    : "Buy Currencies & Giftcards"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.subListItem}
                onPress={() => router.push("/SellCryptoScreen")}
              >
                <Text style={styles.subListText}>
                  {isCryptoEnabled
                    ? "⁠Sell Currencies, Crypto & Giftcards"
                    : "⁠Sell Currencies & Giftcards"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => toggleSection("international")}
          >
            <MaterialCommunityIcons name="earth" size={24} color="#000" />
            <Text style={styles.listText}>International Transfer</Text>
            <AntDesign
              name={expandedSections.international ? "up" : "down"}
              size={18}
              color="#000"
            />
          </TouchableOpacity>

          {expandedSections.international && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.subListItem}
                onPress={() => router.push("/SendToAbroad")}
              >
                <Text style={styles.subListText}>Send Abroad</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.subListItem}
                onPress={() => router.push("/InternationalTransfer")}
              >
                <Text style={styles.subListText}>Send Local</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => toggleSection("ajo")}
          >
            <MaterialCommunityIcons name="database" size={24} color="#000" />
            <Text style={styles.listText}>Ajo Savings & Contribution</Text>
            <AntDesign
              name={expandedSections.ajo ? "up" : "down"}
              size={18}
              color="#000"
            />
          </TouchableOpacity>

          {expandedSections.ajo && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.subListItem}
                onPress={() => router.push("/StartAjoSavings")}
              >
                <Text style={styles.subListText}>Ajo Savings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.subListItem}
                onPress={() => router.push("/AjoContributionDashboard")}
              >
                <Text style={styles.subListText}>Ajo Contribution</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => toggleSection("holdings")}
          >
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>
              {isHoldingsEnabled && isInvestmentsEnabled
                ? "Holdings & Investment"
                : isHoldingsEnabled
                  ? "Holdings"
                  : isInvestmentsEnabled
                    ? "Investment"
                    : ""}
            </Text>

            <AntDesign
              name={expandedSections.holdings ? "up" : "down"}
              size={18}
              color="#000"
            />
          </TouchableOpacity>

          {expandedSections.holdings && (
            <Animated.View entering={FadeInDown.delay(100)}>
              {isHoldingsEnabled && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.subListItem}
                  onPress={() => router.push("/HoldingsInvest")}
                >
                  <Text style={styles.subListText}>Save in Hard Currency</Text>
                </TouchableOpacity>
              )}

              {isInvestmentsEnabled && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.subListItem}
                  onPress={() => router.push("/InvestDashboard")}
                >
                  <Text style={styles.subListText}>
                    {isCryptoEnabled
                      ? "Invest in Stocks & Crypto"
                      : "Invest in Stocks"}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>

        <Text style={styles.sectionTitle}>All Transactions</Text>
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => router.push("/Transactions")}
          >
            <MaterialCommunityIcons
              name="cash-multiple"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Transactions</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => router.push("/ResetPassword")}
          >
            <MaterialCommunityIcons name="lock" size={24} color="#000" />
            <Text style={styles.listText}>Change Password</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push("/TwoFactorAuthentication")}
          >
            <MaterialCommunityIcons name="security" size={24} color="#000" />
            <Text style={styles.listText}>Two Factor Authentication</Text>
          </TouchableOpacity> */}
          {/*
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push("/DeviceSessions")}
          >
            <MaterialCommunityIcons name="devices" size={24} color="#000" />
            <Text style={styles.listText}>Device Sessions</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={initiateOTP}
          >
            <MaterialCommunityIcons name="key" size={24} color="#000" />
            <Text style={styles.listText}>Change Pin</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Others</Text>
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => router.push("/SendAfricaReceiveMoney")}
          >
            <MaterialCommunityIcons
              name="account-multiple"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Affiliates & Referrals</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => router.push("/(tabs)/cards")}
          >
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Cards & Beneficiaries</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => router.push("/Rates")}
          >
            <MaterialCommunityIcons name="information" size={24} color="#000" />
            <Text style={styles.listText}>See Our Rates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={_handlePressTerms}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Terms & Conditions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={_handlePressPrivacy}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color="#000"
            />
            <Text style={styles.listText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            // onPress={() => router.push("/CustomerCare")}
            onPress={_handlePressLiveChat}
          >
            <MaterialCommunityIcons name="chat" size={24} color="#000" />
            <Text style={styles.listText}>Live Chat Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listItem}
            onPress={() => Linking.openURL("mailto:support@swiftpaymfb.com")}
          >
            <MaterialCommunityIcons name="email" size={24} color="#000" />
            <Text style={styles.listText}>Send Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL("https://wa.me/8111278925")}
            style={styles.listItem}
          >
            <MaterialCommunityIcons name="whatsapp" size={24} color="#000" />
            <Text style={styles.listText}>Whatsapp</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.listItem}
          onPress={handleLogout}
          className="pb-10"
        >
          <MaterialCommunityIcons name="logout" size={24} color="#d9534f" />
          <Text style={[styles.listText, { color: "#d9534f" }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Image
          source={require("../assets/logos/swiftpaylogo.png")}
          style={{ height: 50, width: 100 }}
        />
        <Text className="font-medium -mt-3">
          v{Application.nativeApplicationVersion}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    // marginTop: 20,
  },
  backButton: {
    padding: 5,
    backgroundColor: "#0000ff",
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
    color: "#666",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginLeft: 10,
  },
  subListItem: {
    paddingLeft: 40,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  subListText: {
    fontSize: 15,
    color: "#555",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 12,
    color: "white",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
});

export default Profile;
