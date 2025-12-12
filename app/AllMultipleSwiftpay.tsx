import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { BottomSheet } from "@rneui/themed";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import Button from "@/components/ui/Button";
import { IS_ANDROID_DEVICE, IS_IOS_DEVICE } from "@/constants";

const AllMultipleSwiftpay: React.FC = () => {
  const { recipients, removeRecipient, getTotalAmount } = useMultipleTransfer();

  const [swiftPayTag, setSwiftPayTag] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");

  // State to manage tab selection
  const [selectedTab, setSelectedTab] = useState("Recent"); // Default to 'Recent'

  // State variables for bottom sheet visibility
  const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const handleNext = () => {
    setIsPaymentSummaryVisible(true); // Show the payment summary bottom sheet
  };

  const handlePay = () => {
    setIsPaymentSummaryVisible(false); // Hide the payment summary bottom sheet
    setIsTransactionPinVisible(true); // Show the transaction pin bottom sheet
  };

  const handleConfirmPayment = () => {
    setIsTransactionPinVisible(false); // Hide the transaction pin bottom sheet
    setIsSuccessVisible(true); // Show the success bottom sheet
  };

  const [isChecked, setIsChecked] = useState(false);

  const toggleCheckbox = () => {
    setIsChecked(!isChecked); // Toggle checkbox state
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={() => router.push("/MultipleSwiftpayTransfer")}
          >
            <AntDesign name="plus" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Add New User</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ marginHorizontal: IS_IOS_DEVICE ? 15 : 0 }}
      >
        {recipients.map((recipient, index) => (
          <View key={index} style={styles.users}>
            <Image
              source={
                recipient.user.profile_photo
                  ? { uri: recipient.user.profile_photo }
                  : require("../assets/icons/user1.png")
              }
              style={[styles.user, { borderRadius: 20 }]}
            />
            <View>
              <Text style={styles.name}>{recipient.user.first_name}</Text>
              <Text style={styles.account}>{recipient.swiftPayTag}</Text>
            </View>
            <View style={styles.status}>
              <Text style={styles.statusText}>₦{recipient.amount}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (recipients.length === 1) {
                    router.back();
                  }
                  removeRecipient(swiftPayTag);
                }}
              >
                <AntDesign name="closecircle" color={"red"} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.total}>
          Total Amount: ₦{getTotalAmount().toLocaleString()}
        </Text>
        {/* <Text style={styles.subtotal}>Multiple Transfer Fees: ₦20.00</Text> */}

        <Button
          text="Send"
          disabled={recipients.length === 0}
          onPress={() => router.push("/MultipleSwiftpaySummary")}
        />
      </ScrollView>

      {/* Payment Summary Bottom Sheet */}
      {/* <BottomSheet isVisible={isPaymentSummaryVisible} onBackdropPress={() => setIsPaymentSummaryVisible(false)}>
        <View style={styles.bottomSheetContent}>
        <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setIsPaymentSummaryVisible(false)}>
                <AntDesign name='closecircleo' size={20} color={'red'} style={styles.icon} />
              </TouchableOpacity>
            </View>
          
          <Text style={styles.successBottomSheetHeaderP}>₦ 4,680.00</Text>
          <View style={styles.successBottomSheetContainer}>
                <View style={styles.flex}>
                <Text style={styles.successBottomSheetTextLabel}>Swiftpay Tag</Text>
                <Text style={styles.successBottomSheetText}>@Josiah67</Text>
                </View>
                <View style={styles.flex}>
                <Text style={styles.successBottomSheetTextLabel}>Recipient Name</Text>
                <Text style={styles.successBottomSheetText}>Adeagbo Josiah</Text>
                </View>
                <View style={styles.flex}>
                <Text style={styles.successBottomSheetTextLabel}>Amount</Text>
                <Text style={styles.successBottomSheetText}>4,680.00 NGN</Text>
                </View>
                <View style={styles.flex}>
                <Text style={styles.successBottomSheetTextLabel}>Remark</Text>
                <Text style={styles.successBottomSheetText}>Part Payment</Text>
                </View>
            </View>
            <Text style={styles.balanceTitle}>Payment Method</Text>
            <View style={styles.balanceContainer}>
              <View style={styles.balance}>
                <Text style={styles.swiftpay}>SwiftPay Balance</Text>
                <Text style={styles.balanceText}>$ 2,345.98</Text>
              </View>
              <TouchableOpacity onPress={toggleCheckbox}>
                <View style={[styles.circle, isChecked && styles.checkedCircle]}>
                  {isChecked && <AntDesign name="check" size={16} color="white" />}
                </View>
              </TouchableOpacity>
            </View>
          <TouchableOpacity style={styles.nextButton} onPress={handlePay}>
            <Text style={styles.nextButtonText}>Pay</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet> */}

      {/* Transaction PIN Bottom Sheet */}
      <BottomSheet
        isVisible={isTransactionPinVisible}
        onBackdropPress={() => setIsTransactionPinVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
            <TouchableOpacity onPress={() => setIsTransactionPinVisible(false)}>
              <AntDesign
                name="closecircleo"
                size={20}
                color={"red"}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.successBottomSheetHeader}>Enter Pin</Text>
          <Text style={styles.desc}>Enter pin to complete transaction</Text>

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
                autoFocus={index === 0} // Auto-focus the first input
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleConfirmPayment}
          >
            <Text style={styles.nextButtonText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Success Bottom Sheet */}
      {/* <BottomSheet isVisible={isSuccessVisible} onBackdropPress={() => setIsSuccessVisible(false)}>
        <View style={styles.bottomSheetContent}>
          
          <Image source={require('../assets/icons/success.png')} style={styles.logo} />
          <Text style={styles.successBottomSheetHeader}>Transfer Successful</Text>
      <Text style={styles.desc}>Your transfer to Segun Arinze for N4,890.00 is successful</Text>

      <TouchableOpacity style={styles.nextButton} onPress={() => router.push('/Receipt')}>
            <Text style={styles.nextButtonText}>View Receipt</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  note: {
    color: "#0000ff",
    fontSize: 13,
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 10,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginHorizontal: IS_ANDROID_DEVICE ? 0 : 15,
    marginTop: IS_ANDROID_DEVICE ? 16 : 0,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
  },
  headerText2: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: "#009329",
  },
  icon: {
    width: 25,
    height: 25,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFF4FF",
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 15,
  },
  label: {
    fontWeight: "500",
    marginBottom: 5,
  },
  Subtitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  recentContainer: {
    backgroundColor: "#F2F2F2",
    padding: 10,
    borderRadius: 10,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  recentTopbar: {
    flexDirection: "row",
    gap: 40,
    alignItems: "center",
  },
  user: {
    width: 40,
    height: 40,
  },
  users: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 20,
  },
  name: {
    fontWeight: "700",
  },
  account: {
    color: "#A3A3A3",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#00CB14",
  },
  activeTabText: {
    color: "#00CB14",
    fontSize: 16,
    fontWeight: "500",
  },
  tabText: {
    color: "#888",
    fontWeight: "500",
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
  subText: {
    fontWeight: "700",
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  reason: {
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  image: {
    width: "100%", // Full width of the container
    height: 40, // Fixed height
    resizeMode: "cover", // Or 'contain', depending on your preference
    borderRadius: 5,
    marginTop: -20,
  },
  imageContainer: {
    alignItems: "center",
    width: "100%", // Ensure the container is full width
    height: 20,
    marginBottom: "5%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    padding: 10,
    borderRadius: 25,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12, // Circular shape
    borderWidth: 2,
    borderColor: "#888",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkedCircle: {
    backgroundColor: "#4CAF50", // Color when checked
    borderColor: "#4CAF50",
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f2f2f2",
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  balance: {
    flexDirection: "column",
  },
  swiftpay: {
    color: "#888",
    fontSize: 13,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: "700",
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
  viewMore: {
    alignItems: "center",
  },
  viewMoreText: {
    textDecorationLine: "underline",
    color: "#666",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#0000ff",
    padding: 8,
    borderRadius: 100,
    paddingHorizontal: 8,
    alignSelf: "center",
    marginTop: 10,
  },
  addButtonContainer: {
    flexDirection: "column",
    alignSelf: "center",
    marginLeft: "18%",
    paddingLeft: 25,
  },
  total: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtotal: {
    color: "#666",
    fontSize: 13,
  },
  status: {
    flexDirection: "row",
    justifyContent: "space-between", // Aligns items on both ends
    alignItems: "center", // Centers items vertically
    flex: 1, // Ensures the status takes up the full available space
  },
  statusText: {
    textAlign: "center", // Center the text within its space
    flex: 1, // Make the text take up all available space
    fontSize: 14,
    fontWeight: "bold",
    color: "#00952A",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
});

export default AllMultipleSwiftpay;
