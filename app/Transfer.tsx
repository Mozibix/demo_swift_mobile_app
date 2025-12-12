import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Share,
} from "react-native";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import LoadingComp from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import { apiService } from "@/services/api";
import { _TSFixMe } from "@/utils";
import { AccountDetails } from "@/types";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";

// Define styles outside of the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
    marginRight: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    alignSelf: "center",
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
  stepcard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 20,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 14,
    color: "#7D7D7D",
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
    marginBottom: 30,
  },
  copyButton: {
    backgroundColor: "#0047FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  shareButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0000ff",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexDirection: "row",
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
  sharebuttonText: {
    color: "#0000ff",
    fontWeight: "500",
  },
  orText: {
    textAlign: "center",
    fontSize: 16,
    color: "#7D7D7D",
    marginVertical: 20,
  },
  methodList: {},
  methodItem: {
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodName: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  bankImage: {
    width: 40,
    height: 40,
    marginRight: 20,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    marginTop: -10,
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
    width: "30%",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodHead: {
    fontWeight: "500",
  },
  subtext: {
    marginBottom: 20,
    alignSelf: "flex-start",
    fontWeight: "700",
    fontSize: 16,
  },
  step: {
    color: "#666",
    textAlign: "left",
    alignSelf: "flex-start",
    fontWeight: "400",
    lineHeight: 22,
  },
  steps: {
    marginBottom: 15,
  },
  stepHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
});

const Transfer = () => {
  const [error, setError] = React.useState<string | null>(null);
  const { user, displayLoader, hideLoader } = useAuth();
  const [userProfile, setUserProfile] = React.useState<any>(user);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [accountDetails, setAccountDetails] =
    React.useState<AccountDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const fetchUserProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        setError("No auth token found. Please login.");
        router.push("/login");
        return;
      }

      const response = await axios.get("https://swiftpaymfb.com/api/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setUserProfile(response.data.data);
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

  useEffect(() => {
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

  const copyAccountNumber = async () => {
    if (!accountDetails?.account_number) {
      showErrorToast({
        title: "Account number not available",
      });
      return;
    }

    try {
      await Clipboard.setStringAsync(accountDetails?.account_number ?? "");
      showSuccessToast({
        title: "Copied",
        desc: "Account number copied to clipboard",
      });
    } catch (error) {
      showErrorToast({
        title: "Failed to copy account number",
      });
    }
  };

  const shareAccountDetails = async () => {
    if (!userProfile) {
      showErrorToast({
        title: "User profile not available",
      });
      return;
    }

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
          console.log("Shared via:", result.activityType);
        } else {
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
        console.error("Error sharing account details:", error.message);
      } else {
        console.error("An unknown error occurred while sharing.");
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Account Details</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingComp visible />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : userProfile ? (
          <>
            <View style={styles.card}>
              <View style={styles.bankHeader}>
                <Image
                  source={require("../assets/icons/number.png")}
                  style={styles.bankImage}
                />
                <View style={{ marginRight: 30 }}>
                  <Text style={styles.methodSubtitle}>
                    SwiftPay Account Number
                  </Text>
                  <Text style={styles.methodTitle}>
                    {accountDetails?.account_number ?? "N/A"}
                  </Text>
                </View>
              </View>
              <View style={styles.bankHeader}>
                <Image
                  source={require("../assets/icons/banking.png")}
                  style={styles.bankImage}
                />
                <View style={{ marginRight: 30 }}>
                  <Text style={styles.methodSubtitle}>Bank</Text>
                  <Text style={styles.methodTitle}>
                    {accountDetails?.bank_name ?? "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.bankHeader}>
                <Image
                  source={require("../assets/icons/user.png")}
                  style={styles.bankImage}
                />
                <View style={{ marginRight: 30 }}>
                  <Text style={styles.methodSubtitle}>Name</Text>
                  <Text style={styles.methodTitle}>
                    {accountDetails?.account_name ?? "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyAccountNumber}
              >
                <FontAwesome name="clipboard" size={18} color={"white"} />
                <Text style={styles.buttonText}>Copy Number</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={shareAccountDetails}
              >
                <Ionicons name="share-outline" size={18} color={"#0000ff"} />
                <Text style={styles.sharebuttonText}>Share Details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepcard}>
              <Text style={styles.subtext}>
                Add Money Via Bank Transfer In Just 3 Steps
              </Text>

              <View style={styles.steps}>
                <View style={styles.stepHead}>
                  <Text style={styles.step} selectable>
                    1. Copy the account details above -{" "}
                    {accountDetails?.account_number ?? "N/A"} is your SwiftPay
                    Account Number.
                  </Text>
                </View>
              </View>
              <View style={styles.steps}>
                <View style={styles.stepHead}>
                  <Text style={styles.step}>
                    2. Open the desired bank app you want to transfer money
                    from.
                  </Text>
                </View>
              </View>

              <View style={styles.steps}>
                <View style={styles.stepHead}>
                  <Text style={styles.step}>
                    3. Transfer the desired amount to your SwiftPay Wallet.
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Toast component for notifications */}
      <Toast />
    </View>
  );
};

export default Transfer;
