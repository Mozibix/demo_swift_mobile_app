import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import LoadingComp from "@/components/Loading";

const Affiliate = () => {
  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [amountEarn, setAmountEarn] = useState<number>(0);
  const [referralLink, setReferralLink] = useState("");
  const [bonus, setBonus] = useState<number>(0);

  interface Referral {
    name: string;
    email: string;
    created_at: string;
  }

  const [myReferrals, setMyReferrals] = useState<Referral[]>([]);

  const copyToClipboard = () => {
    Clipboard.setStringAsync(referralCode);
    Toast.show({
      type: "success",
      text1: "Copied to Clipboard",
      text2: "Referral code copied to clipboard!",
      position: "top",
    });
  };

  const handleReferral = async () => {
    try {
      setIsLoading(true);
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

      const response = await axios.get(`${API_BASE_URL}/referral-page`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("response:", response?.data?.data);

      if (response.status === 200) {
        const data = response.data.data;
        setReferralCode(data.ajo_savings_referral_code);
        setAmountEarn(data.amount_earned);
        setMyReferrals(data.referrals);
        setReferralLink(data.referral_link);
        setBonus(data.referral_bonus_amount);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "Something went wrong",
          position: "top",
        });
      }
    } catch (error: any) {
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleReferral();
  }, []);

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Sign up using my referral code: ${referralLink}. Download the app now!`,
      });

      if (result.action === Share.sharedAction) {
        Toast.show({
          type: "success",
          text1: "Shared successfully!",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Sharing failed",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingComp visible={isLoading} />
      <TouchableOpacity style={styles.backbutton} onPress={() => router.back()}>
        <AntDesign name="left" size={20} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ marginHorizontal: 20 }}
      >
        <View style={styles.introContainer}>
          <Image source={require("../assets/ref.png")} style={styles.ref} />
          <Text style={styles.descriptionText}>
            Share your referral link with your friends and earn ₦{bonus} for
            each successful referral.
          </Text>

          <View style={styles.referralSection}>
            <View>
              <Text style={styles.referralLabel}>Referral Code</Text>
              <TouchableOpacity
                style={styles.referralCodeContainer}
                onPress={copyToClipboard}
              >
                <Text style={styles.referralCode}>{referralCode}</Text>
                <Text style={styles.copyText}>📋</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={require("../assets/medal.png")}
              style={styles.medal}
            />
          </View>
        </View>

        <View style={styles.earningsContainer}>
          <View style={styles.iconContainer}>
            <Image source={require("../assets/hand.png")} style={styles.icon} />
          </View>
          <View>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>₦{amountEarn}</Text>
          </View>
        </View>

        <View style={styles.referralsContainer}>
          <Text style={styles.referralsText}>My Referrals</Text>
          <ScrollView
            style={styles.noReferrals}
            showsVerticalScrollIndicator={false}
          >
            {myReferrals.length > 0 ? (
              myReferrals.map((referral, index) => (
                <View
                  key={index}
                  style={{
                    marginBottom: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.referralLabel}>{referral.name}</Text>
                  <Text style={styles.referralLabel}>
                    {referral?.created_at.split("T")[0]}
                  </Text>
                </View>
              ))
            ) : (
              <View style={{ alignItems: "center" }}>
                <Image
                  source={require("../assets/users.png")}
                  style={styles.referrals}
                />
                <Text style={styles.noReferralsText}>
                  You have no referrals yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity
          activeOpacity={0.6}
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share Link</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default Affiliate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 14,
    textAlign: "left",
    color: "#333",
  },
  referralSection: {
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  referralLabel: {
    fontSize: 14,
    color: "#000",
    marginBottom: 5,
    fontWeight: "600",
  },
  referralCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 5,
  },
  referralCode: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 5,
  },
  copyText: {
    color: "#FFF",
    fontSize: 18,
  },
  earningsContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 15,
    marginVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    gap: 15,
  },
  earningsLabel: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0000ff",
    marginTop: 5,
  },
  referralsContainer: {
    marginVertical: 20,
  },
  referralsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "left",
  },
  noReferrals: {
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 30,
    borderRadius: 5,
    width: "100%",
  },
  noReferralsText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  shareButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 25,
  },
  shareButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  introContainer: {
    backgroundColor: "#FFF",
    marginTop: 20,
    padding: 15,
    borderRadius: 5,
  },
  backbutton: {
    padding: 13,
    marginTop: 30,
  },
  ref: {
    width: 260,
    height: 100,
    resizeMode: "contain",
    marginTop: 5,
  },
  medal: {
    width: 280,
    height: 120,
    resizeMode: "contain",
    marginTop: 5,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  iconContainer: {
    backgroundColor: "#DFF1FC",
    padding: 10,
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
  },
  referrals: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginTop: 10,
    alignSelf: "center",
  },
});
