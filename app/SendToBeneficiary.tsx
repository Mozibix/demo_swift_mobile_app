import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { _TSFixMe, navigationWithReset } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_PIN } from "@/constants";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { apiService } from "@/services/api";
import Button from "@/components/ui/Button";
import { BottomSheet } from "@rneui/base";
import PinComponent from "@/components/ui/PinComponent";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import { showLogs } from "@/utils/logger";

const PaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>("");
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const { getUserProfile, verifyPin, displayLoader, hideLoader, user } =
    useAuth();
  const { transferSource } = useMultipleTransfer();
  const router = useRouter();

  const {
    type,
    name,
    swiftpayTag,
    image,
    accountNumber,
    bankName,
    bank_code,
    fixedFee,
    percentageFee,
  } = useLocalSearchParams();

  const handleConfirmPayment = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    try {
      setIsTransactionPinVisible(false);
      displayLoader();
      const amountValue = parseFloat(amount);
      const percentFee = (amountValue * (+percentageFee || 0)) / 100;
      const totalFee = +percentFee + (+fixedFee || 0);
      const calculatedTotal = amountValue + totalFee;

      let response;
      showLogs("payload", {
        bank_code: bank_code as string,
        bank_account_number: accountNumber as string,
        amount: amountValue,
        account_name: name as string,
        description: description || "Transfer",
        bank_name: bankName as string,
        pin: parseInt(pin),
        total_amount: calculatedTotal,
        fee_amount: totalFee,
        source_link:
          transferSource === "send_to_africa" ? transferSource : null,
      });

      if (type === "bank") {
        response = await apiService.bankTransfer({
          bank_code: bank_code as string,
          bank_account_number: accountNumber as string,
          amount: amountValue,
          account_name: name as string,
          description: description || "Transfer",
          bank_name: bankName as string,
          pin: parseInt(pin),
          total_amount: calculatedTotal,
          fee_amount: totalFee,
          source_link:
            transferSource === "send_to_africa" ? transferSource : null,
        });
      } else {
        response = await apiService.transferToSwiftpay({
          username: swiftpayTag as string,
          amount: amount.toString(),
          description: description || "Transfer",
          pin,
          source_link:
            transferSource === "send_to_africa" ? transferSource : null,
        });
      }

      showLogs("response", response);

      if (response.status === "success") {
        showSuccessToast({
          title: "Successful!",
          desc: `Transfer of ${amount} to ${name} was successful`,
        });
        getUserProfile();

        let transactionDetails;
        if (type === "bank") {
          transactionDetails = {
            amount: amountValue,
            totalAmount: calculatedTotal,
            feeAmount: totalFee,
            recipientName: name,
            recipientBank: bankName,
            recipientAccount: accountNumber,
            recipientTag: swiftpayTag,
            senderName: user?.name,
            description: description || "Transfer",
            reference: response.data?.reference || `REF${Date.now()}`,
            date: new Date().toISOString(),
            status: response.data?.status || "Processing",
            transactionType: "Bank Transfer",
          };
        } else {
          transactionDetails = {
            amount: parseFloat(amount),
            recipientName: name,
            recipientTag: swiftpayTag,
            senderName: user?.name,
            description: description || "Transfer",
            reference: response.data.reference,
            date: response.data.created_at,
            status: response.data.status,
            transactionType: "Swiftpay Transfer",
          };
        }

        router.push({
          pathname: "/TransactionReceipt",
          params: {
            currentTransaction: JSON.stringify(transactionDetails),
            type: "transfer",
          },
        });

        const details = {
          amount: parseFloat(amount),
          recipientName: name,
          recipientTag: swiftpayTag,
          senderName: user?.first_name + " " + user?.last_name,
          description: description || "Transfer",
          reference: response.data.reference,
          date: response.data.created_at,
          status: response.data.status,
          transactionType: "Swiftpay Transfer",
        };

        await AsyncStorage.setItem("lastTransaction", JSON.stringify(details));
      } else {
        showErrorToast({
          title: "An error occured",
          desc: "Transfer failed",
        });
      }
    } catch (error: _TSFixMe) {
      showLogs("send to beneficiary error", error);
      showErrorToast({
        title: "An error occured",
        desc: error.response?.data?.message || "Transfer failed",
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Transfer to {type === "bank" ? "Bank" : "Swiftpay"} Account
        </Text>
      </View>

      <View style={styles.beneficiaryContainer}>
        <Image
          source={{ uri: image as string }}
          style={styles.profileImage}
          fadeDuration={300}
        />
        <Text style={styles.beneficiaryName}>{name}</Text>
        {accountNumber ? (
          <Text style={styles.beneficiaryTag}>{accountNumber}</Text>
        ) : (
          <Text style={styles.beneficiaryTag}>@{swiftpayTag}</Text>
        )}
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="10,000"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What is this for?"
      />

      <Button
        text="Confirm"
        disabled={!amount}
        onPress={() => setIsTransactionPinVisible(true)}
      />

      <BottomSheet
        isVisible={isTransactionPinVisible}
        onBackdropPress={() => setIsTransactionPinVisible(false)}
        modalProps={{
          statusBarTranslucent: true,
          hardwareAccelerated: true,
        }}
        containerStyle={styles.bottomSheetContainer}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
            <TouchableOpacity onPress={() => setIsTransactionPinVisible(false)}>
              <AntDesign
                name="closecircle"
                size={22}
                color={"#D32F2F"}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>

          {error && (
            <Text className="text-danger font-medium text-[16px] text-center mt-2">
              {error}
            </Text>
          )}

          <PinComponent
            onComplete={(pin: string) => handleConfirmPayment(pin)}
            setModalState={setIsTransactionPinVisible}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    borderRadius: 100,
    backgroundColor: "#F5F5F5",
  },
  headerText: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 30, // to balance the back button width
  },
  beneficiaryContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: "#1400FB",
  },
  beneficiaryName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  beneficiaryTag: {
    fontSize: 16,
    color: "#888",
  },
  input: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#0000FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 50,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 3,
  },
  bottomSheetContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingTop: Platform.OS === "ios" ? 20 : 0,
    maxHeight: "100%",
    borderBottomWidth: 0,
  },
  bottomSheetContent: {
    paddingVertical: 24,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    maxHeight: "100%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderBottomWidth: 0, // Ensure no border at the bottom
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 15,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  closeIcon: {
    padding: 5,
    paddingRight: 10,
  },
});

export default PaymentScreen;
