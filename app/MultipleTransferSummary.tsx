import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { BottomSheet } from "@rneui/themed";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import { cn, formatAmount, formatBalance } from "@/utils";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { apiService } from "@/services/api";
import { showErrorToast } from "@/components/ui/Toast";
import useDataStore from "@/stores/useDataStore";
import PinComponent from "@/components/ui/PinComponent";
import { DEFAULT_PIN, IS_ANDROID_DEVICE } from "@/constants";

const MultipleTransferSummary = () => {
  const { bankRecipients, getTotalBankAmount } = useMultipleTransfer();
  const transfer_fee = useDataStore((state) => state.fixed_transfer_fee);

  const { user, displayLoader, hideLoader, verifyPin, getUserProfile } =
    useAuth();
  const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState();
  const { transferSource } = useMultipleTransfer();

  const handleNext = () => {
    setIsPaymentSummaryVisible(true);
  };

  const handlePay = () => {
    setIsPaymentSummaryVisible(false);
    setIsTransactionPinVisible(true);
  };

  const handleConfirmPayment = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    if (bankRecipients.length < 2) {
      return showErrorToast({
        title: "Not Allowed",
        desc: "A minimum of 2 receipients are required for multiple transfers",
      });
    }

    try {
      displayLoader();
      setIsTransactionPinVisible(false);
      const payload = {
        total_amount: getTotalBankAmount().toString(),
        pin,
        bank_accounts: bankRecipients,
        source_link:
          transferSource === "send_to_africa" ? transferSource : null,
      };
      // showLogs("bankRecipients", bankRecipients);
      const response = await apiService.multipleBankTransfer(payload);

      if (response.status === "success") {
        getUserProfile();
        setIsTransactionPinVisible(false);
        setIsSuccessVisible(true);
        setCurrentTransaction(response.data);
      }
    } catch (error: any) {
      showLogs("multiple transfer error", error.response.data);
      const errorFields = error?.response?.data?.errors;
      const firstFieldKey = errorFields ? Object.keys(errorFields)[0] : null;
      const firstErrorMessage = firstFieldKey
        ? errorFields[firstFieldKey]?.[0]
        : null;
      showErrorToast({
        title: "Transfer unsuccessful",
        desc: firstErrorMessage ?? "Please try again",
      });
    } finally {
      hideLoader();
    }
  };

  const [isChecked, setIsChecked] = useState(false);

  const toggleCheckbox = () => {
    setIsChecked(!isChecked);
  };

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    // Set OTP value at the current index
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to the next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      // Move to the previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const visibleCount = 2;
  const remainingCount = bankRecipients.length - visibleCount;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName={cn(IS_ANDROID_DEVICE ? "" : "mx-5")}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Transfer to Multiple Banks</Text>
        </View>
        {/* Total Amount */}
        <Text style={styles.amountText}>
          ₦ {new Intl.NumberFormat().format(getTotalBankAmount())}
        </Text>

        {/* Transfer Details Card */}
        <View style={styles.card}>
          <View style={styles.userInfo}>
            {/* Stacked User Images */}
            <View style={styles.imageContainer}>
              <View
                style={[
                  styles.initialsCircle,
                  { backgroundColor: "#222" },
                  styles.userImage,
                  styles.userImage1,
                ]}
              >
                <View className="bg-[#c6d9ff] p-3 rounded-full">
                  <FontAwesome name="bank" size={8} color="#1400FB" />
                </View>
              </View>
              <View
                style={[
                  styles.initialsCircle,
                  { backgroundColor: "#222" },
                  styles.userImage,
                  styles.userImage2,
                ]}
              >
                <View className="bg-[#c6d9ff] p-3 rounded-full">
                  <FontAwesome name="bank" size={8} color="#1400FB" />
                </View>
              </View>
              <View
                style={[
                  styles.initialsCircle,
                  { backgroundColor: "#222" },
                  styles.userImage,
                  styles.userImage3,
                ]}
              >
                <View className="bg-[#c6d9ff] p-3 rounded-full">
                  <FontAwesome name="bank" size={8} color="#1400FB" />
                </View>
              </View>
            </View>
            <View>
              <Text style={[styles.userNames, { maxWidth: 200 }]}>
                {bankRecipients.length === 1 ? (
                  <Text> {bankRecipients[0]?.account_name}</Text>
                ) : bankRecipients.length === 2 ? (
                  <Text>
                    {bankRecipients[0]?.account_name}
                    {", "}
                    {bankRecipients[1]?.account_name}
                  </Text>
                ) : (
                  <Text>
                    {bankRecipients[0]?.account_name}
                    {", "}
                    {bankRecipients[1]?.account_name}{" "}
                    <Text style={{ color: "#0000ff" }}>
                      +{remainingCount}{" "}
                      {remainingCount === 1 ? "other" : "others"}
                    </Text>
                  </Text>
                )}
              </Text>
              <Text style={styles.bankInfo}>
                {bankRecipients.length === 1 ? (
                  <Text> {bankRecipients[0]?.bank_name}</Text>
                ) : bankRecipients.length === 2 ? (
                  <Text>
                    {bankRecipients[0]?.bank_name}
                    {", "}
                    {bankRecipients[1]?.bank_name}
                  </Text>
                ) : (
                  <Text>
                    {bankRecipients[0]?.bank_name}
                    {", "}
                    {bankRecipients[1]?.bank_name}{" "}
                    <Text style={{ color: "#0000ff" }}>
                      +{remainingCount}{" "}
                      {remainingCount === 1 ? "other" : "others"}
                    </Text>
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {/* Transfer Information */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Multiple Transfer</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>
              {" "}
              {new Intl.NumberFormat().format(getTotalBankAmount())} NGN
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Multiple transfer fee</Text>
            <Text style={styles.value}>
              {new Intl.NumberFormat().format(
                transfer_fee * bankRecipients.length
              )}{" "}
              NGN
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <View>
              <Text style={styles.balanceText}>SwiftPay Balance</Text>
              <Text style={styles.balanceAmount}>
                ₦{new Intl.NumberFormat().format(user?.wallet_balance ?? 0)}
              </Text>
            </View>
            <AntDesign name="checkcircle" size={24} color="green" />
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payButtonText}>Pay</Text>
        </TouchableOpacity>

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          {error && (
            <Text className="text-danger font-medium text-[16px] text-center mt-2">
              {error}
            </Text>
          )}
          <PinComponent
            onComplete={(pin: string) => {
              handleConfirmPayment(pin);
            }}
            setModalState={setIsTransactionPinVisible}
          />
        </BottomSheet>

        <BottomSheet
          isVisible={isSuccessVisible}
          onBackdropPress={() => setIsSuccessVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Image
              source={require("../assets/icons/success.png")}
              style={styles.logo}
            />
            <Text style={styles.successBottomSheetHeader}>
              Multiple Transfer Successful
            </Text>
            <Text style={styles.desc}>
              Your transfer to multiple accounts for N
              {formatAmount(getTotalBankAmount())} was successful
            </Text>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                setIsTransactionPinVisible(false);
                setIsSuccessVisible(false);
                router.push({
                  pathname: "/TransactionReceipt",
                  params: {
                    currentTransaction: JSON.stringify(currentTransaction),
                    type: "",
                  },
                });
              }}
            >
              <Text style={styles.nextButtonText}>View Receipt</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MultipleTransferSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 40,
    marginTop: IS_ANDROID_DEVICE ? 40 : 0,
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initialsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  headerText2: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: "#009329",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  amountText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000",
    marginVertical: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    padding: 20,
    marginBottom: 40,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    width: 70, // Adjust the width based on image size and overlap
    height: 40, // Adjust the height based on image size and overlap
    marginRight: -15,
  },
  userImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    position: "absolute",
  },
  userImage1: {
    top: 0,
    left: 0,
  },
  userImage2: {
    top: 10,
    left: 15,
  },
  userImage3: {
    top: 15,
    left: 0,
  },
  userNames: {
    fontSize: 14,
    fontWeight: "bold",
  },
  bankInfo: {
    fontSize: 12,
    color: "#8C8C8C",
    marginTop: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    color: "#8C8C8C",
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
    maxWidth: 180,
    alignSelf: "flex-end",
  },
  paymentSection: {
    marginBottom: 40,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  paymentCard: {
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#8C8C8C",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "900",
  },
  payButton: {
    backgroundColor: "#0000ff",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    left: 96,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
  },
  successBottomSheetText: {
    fontSize: 14,
    marginBottom: 20,
    alignItems: "center",
    fontWeight: "600",
  },
  successBottomSheetTextLabel: {
    fontSize: 14,
    marginBottom: 20,
    alignItems: "center",
    color: "#666",
  },
  successBottomSheetTextgreen: {
    fontSize: 16,
    marginBottom: 10,
    alignItems: "center",
    color: "#00952A",
    fontWeight: "700",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  successBottomSheetHeaderP: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  successBottomSheetContainer: {
    borderWidth: 1,
    padding: 10,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    marginBottom: 20,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 15,
    alignSelf: "center",
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#999", // Success green color for the border
    borderRadius: 8,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  icon: {
    width: 25,
    height: 25,
  },
});
