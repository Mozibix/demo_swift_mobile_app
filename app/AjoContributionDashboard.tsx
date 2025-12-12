import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FontAwesome, Feather, Ionicons, Octicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingComp from "@/components/Loading";
import { formatAmount } from "@/utils";
import { showLogs } from "@/utils/logger";
import Button from "@/components/ui/Button";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import { isValid } from "zod";

const AjoContributionDashboard = () => {
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState("");
  const [ajoBalance, setAjoBalance] = useState<any>();
  const [activeContribution, setActiveContribution] = useState([]);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { displayLoader, hideLoader, getUserProfile, verifyPin } = useAuth();

  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [withdrawData, setWithdrawData] = useState({
    amount: "",
    pin: "",
  });

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (text && index === 3) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setWithdrawData({
      ...withdrawData,
      [field]: value,
    });
  };

  const handlePinChange = (value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      handleInputChange("pin", value);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) return;
    handleInputChange("amount", numericValue);
  };

  const handleWithdrawal = async () => {
    setModalVisible(false);
    if (!withdrawData.amount.trim() || parseFloat(withdrawData.amount) <= 0) {
      console.log("Please enter a valid amount");
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid amount",
        position: "top",
      });
      return;
    }

    if (otp.includes("")) {
      showErrorToast({
        title: "Invalid PIN",
        desc: "Please enter a valid 4-digit PIN",
      });

      return;
    }

    if (otp.join("") !== DEFAULT_PIN) {
      const isValid = await verifyPin(otp.join(""));
      if (!isValid) {
        showErrorToast({
          title: "Invalid PIN",
          desc: "You entered an invalid pin, please try again",
        });
        return;
      }
    }

    const withdrawAmount = parseFloat(withdrawData.amount);
    if (withdrawAmount > ajoBalance || ajoBalance === 0) {
      setError("Insufficient funds in your Ajo Contribution");
      console.log("Insufficient balance");
      Toast.show({
        type: "error",
        text1: "Insufficient Balance",
        text2: "You don't have enough funds for this withdrawal",
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    displayLoader();

    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/withdraw`,
        {
          amount: parseFloat(withdrawData.amount),
          pin: otp.join(""),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.status === "success") {
        getUserProfile();
        setIsLoading(false);
        setModalVisible(false);
        setWithdrawData({ amount: "", pin: "" });

        showSuccessToast({
          title: "Successful!",
          desc: response?.data?.message,
        });

        fetchAjoContribution();
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        showErrorToast({
          title: "Kindly fund your wallet",
          desc: serverMessage,
        });

        setError(serverMessage || "An error occurred");
      } else {
        showErrorToast({
          title: "An error occured",
          desc: "Failed to process deposit",
        });
      }
      console.log(error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      hideLoader();
      setOtp(["", "", "", ""]);
    }
  };

  const toggleAutoSave = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");

      // Get the currently active contribution ID if available
      const ajoContributionId =
        activeContribution.length > 0
          ? (activeContribution[0] as any).id
          : null;

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/toggle-auto-save`,
        { ajo_contribution_id: ajoContributionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.status === 200) {
        setIsAutoSaveEnabled(!isAutoSaveEnabled);
        Toast.show({
          type: "success",
          text1: isAutoSaveEnabled
            ? "Auto-save disabled."
            : "Auto-save enabled.",
          text2: "",
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to update auto-save setting.",
          text2: "",
          position: "top",
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "",
          position: "top",
        });
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Open wallet picker
  const openWalletPicker = () => {
    setWalletModalVisible(true);
  };

  const [wallets] = useState([
    "SwiftPay Wallet",
    "Bitcoin Wallet",
    "Ethereum Wallet",
  ]);

  // Handle wallet selection
  const handleWalletSelect = (wallet: string) => {
    setSelectedWallet(wallet);
    setWalletModalVisible(false);
  };

  const navigateToAjoDetails = (item: any) => {
    router.push({
      pathname: "/AjoDetails",
      params: {
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        start_date: item.start_date,
        amount: item.amount,
        type: item.type,
        frequency: item.frequency,
        no_of_members: item.no_of_members,
        current_round: item.current_round,
        next_round_date: item.next_round_date,
        hash_id: item.hash_id,
        pivot: item.pivot,
      },
    });
  };

  const fetchAjoContribution = async () => {
    try {
      setError("");
      setIsLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      const response = await axios.get(`${API_BASE_URL}/ajo-contributions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response?.data?.status === "success") {
        setAjoBalance(response?.data?.data?.ajo_contribution_balance);
        setActiveContribution(response?.data?.data?.active_ajo_contributions);

        // Set auto-save state based on response if available
        if (response?.data?.data?.auto_save_enabled !== undefined) {
          setIsAutoSaveEnabled(response?.data?.data?.auto_save_enabled);
        }
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "",
          position: "top",
        });
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAjoContribution();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAjoContribution().finally(() => {
      setRefreshing(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAjoContribution();
    }, [])
  );

  const openWithdrawalModal = () => {
    setError("");
    setWithdrawData({
      amount: "",
      pin: "",
    });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInUp.delay(200)}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Ajo Contribution</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0062ff"]}
          />
        }
      >
        <Animated.View entering={FadeInUp.delay(200)}>
          <ImageBackground
            source={require("../assets/ajo.png")}
            style={styles.dashboardCard}
            imageStyle={styles.imageStyle}
          >
            <View style={styles.rate}>
              <Text style={styles.cardInterestText}>10% Per Annum</Text>
            </View>
            <Text style={styles.cardBalanceTitle}>
              Ajo Contribution Balance
            </Text>
            <Text style={styles.cardBalance}>
              ₦
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                formatAmount(ajoBalance)
              )}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.createButton}
              onPress={() => router.push("/CreateAjo")}
            >
              <Text style={styles.createButtonText}>
                Create Ajo Contribution
              </Text>
            </TouchableOpacity>
          </ImageBackground>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/Confirmation")}
            >
              <View style={styles.tab}>
                {/* <Ionicons name="add-circle-outline" size={30} color="#111" /> */}
                <Feather name="plus" size={30} color="#111" />
              </View>
              <Text style={styles.actionButtonText}>Join Contribution</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={openWithdrawalModal}
              disabled={ajoBalance <= 0}
            >
              <View style={styles.tab}>
                {/* <Ionicons name="wallet-outline" size={30} color="#111" /> */}
                <FontAwesome name="bank" size={28} color="111" />
              </View>
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/AjoContributionHistory")}
            >
              <View style={styles.tab}>
                <Octicons name="history" size={28} color="#111" />
              </View>
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text className="font-semibold text-[18px] mt-4 mb-2">Ongoing</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {/* <ActivityIndicator color="#1876FF" size="large" /> */}
            <LoadingComp visible />
          </View>
        ) : activeContribution.length > 0 ? (
          activeContribution.map((item: any, index: number) => (
            <Animated.View
              key={index || item.id}
              entering={FadeInDown.delay(100 * index)}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.transactionItem}
                onPress={() => navigateToAjoDetails(item)}
              >
                <View style={styles.flex}>
                  <View style={styles.logo}>
                    <Image
                      source={require("../assets/piggy.png")}
                      style={styles.image}
                    />
                  </View>
                  <View>
                    <Text style={styles.transactionTitle}>{item?.name}</Text>
                    <Text
                      style={styles.transactionSubtitle}
                      className="capitalize"
                    >
                      {/* {item?.description} */}
                      {item.frequency} Savings Deposit
                    </Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.transactionAmount}>
                    ₦{formatAmount(item.amount)}
                  </Text>
                  <Text style={styles.transactionBalance}>
                    ₦{formatAmount(item.amount * item.no_of_members)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View className="flex items-center justify-center mt-2">
            <Image
              source={require("../assets/payments/3.png")}
              style={{
                width: 130,
                height: 130,
                resizeMode: "cover",
              }}
            />
            <Text style={styles.noContributionsText}>
              No active contributions found
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Withdraw money to wallet</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.close}
                >
                  <Feather name="x" size={20} color={"#0000ff"} />
                </TouchableOpacity>
              </View>
              <>
                {/* {error ? (
                  <Text
                    style={{
                      color: "red",
                      marginBottom: 10,
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </Text>
                ) : null} */}

                {/* Amount Input */}
                <Text style={styles.labelText}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={withdrawData.amount}
                  onChangeText={handleAmountChange}
                />

                <Text style={styles.labelText}>Transfer PIN</Text>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      autoFocus={!!withdrawData.amount && index === 0}
                    />
                  ))}

                  {/* <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  secureTextEntry={true}
                  maxLength={4}
                  value={withdrawData.pin}
                  onChangeText={handlePinChange}
                /> */}
                </View>

                <Button
                  text="Withdraw"
                  onPress={handleWithdrawal}
                  disabled={isLoading}
                />
              </>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingTop: IS_IOS_DEVICE ? 0 : 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  dashboardCard: {
    height: 220,
    borderRadius: 15,
    padding: 16,
    marginVertical: 16,
    backgroundColor: "#0000ff",
    justifyContent: "center",
    marginBottom: 20,
  },
  imageStyle: {
    borderRadius: 15,
    width: 150,
    height: 120,
    resizeMode: "contain",
    top: 20,
    left: 206,
  },
  cardInterestText: {
    color: "#FFF",
    fontSize: 12,
  },
  cardBalanceTitle: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    marginTop: 8,
  },
  cardBalance: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 8,
  },
  createButton: {
    backgroundColor: "#17A1FAC7",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  autoSaveContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  autoSaveText: {
    color: "#333",
    fontSize: 13,
    width: "80%",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  actionButton: {
    alignItems: "center",
    width: 80,
  },
  actionButtonText: {
    color: "#111",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    width: "100%",
  },
  tab: {
    backgroundColor: "#c3ddfd",
    borderRadius: 8,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionList: {
    marginVertical: 16,
  },
  transactionDate: {
    fontSize: 14,
    color: "#999",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
    marginVertical: 3,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },
  transactionSubtitle: {
    fontSize: 15,
    color: "#666",
    maxWidth: 180,
    marginTop: 1,
  },
  transactionAmount: {
    color: "green",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 5,
  },
  transactionBalance: {
    color: "#555",
    fontSize: 15,
    fontWeight: "500",
  },
  headText: {
    fontWeight: "bold",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#D7E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 50,
    resizeMode: "contain",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 330,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  modalButton: {
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mock: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 20,
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 10,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "500",
    alignItems: "center",
  },
  inputDate: {
    padding: 10,
    color: "#666",
    fontSize: 16,
    paddingHorizontal: 2,
  },
  pickerContainer: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pickerIcon: {
    position: "absolute",
    right: 10,
  },
  picker: {
    borderWidth: 1,
  },
  iconContainer: {
    position: "absolute",
    left: 10,
  },
  pickerItem: {
    fontSize: 16,
    color: "#333",
  },
  selectedItem: {
    color: "#3b82f6",
  },
  balanceText: {
    fontSize: 12,
    color: "#999",
    marginVertical: -10,
    marginBottom: 20,
  },
  transferText: {
    fontSize: 14,
    color: "#000",
    marginBottom: 10,
  },
  returnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  returnsItem: {
    flex: 1,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#555",
  },
  returnsTitle: {
    fontSize: 14,
    color: "#000",
    marginBottom: 10,
  },
  returnsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0000ff",
  },
  taxText: {
    fontSize: 13,
    color: "#000",
    marginBottom: 10,
  },
  scheduleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  scheduleText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  startText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  immediatelyText: {
    fontSize: 14,
    color: "#0000ff",
    marginVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  confirmButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  withdrawTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  rate: {
    backgroundColor: "#17A1FA69",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  flex: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  labelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  walletPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    width: "100%",
    marginBottom: 20,
    borderColor: "#0000ff",
  },
  walletPickerText: {
    fontSize: 14,
  },
  walletModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  walletModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: 250,
  },
  walletOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  walletOptionText: {
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    opacity: 1,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  close: {
    left: 10,
    top: -10,
  },
  noContributionsText: {
    textAlign: "center",
    padding: 20,
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AjoContributionDashboard;
