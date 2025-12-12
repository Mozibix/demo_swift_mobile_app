import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  FlatList,
  Pressable,
} from "react-native";
import { BottomSheet } from "@rneui/themed";
import {
  apiService,
  BankUser,
  Favorite,
  SwiftpayFavorite,
  Transfer,
} from "@/services/api";
import { showLogs } from "@/utils/logger";
import { useAuth, User } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { showErrorToast } from "@/components/ui/Toast";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import useDataStore, { Bank } from "@/stores/useDataStore";
import RecentTransfers from "@/components/recent_transfers/recent-transfers";
import KAScrollView from "@/components/ui/KAScrollView";
import { _TSFixMe, cn } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";
import { COLORS } from "@/constants/Colors";
import Favorites from "@/components/recent_transfers/favourites";
// Import the BottomSheet component from react-native-elements

const MultipleBankTransfer: React.FC = () => {
  const [swiftPayTag, setSwiftPayTag] = useState("");
  const [bank, setBank] = useState("");
  const [showBanks, setShowBanks] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipient, setRecipient] = useState<BankUser | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState({
    name: "",
    code: "",
  });
  const { displayLoader, hideLoader } = useAuth();
  const { addBankRecipient } = useMultipleTransfer();
  const allBanks = useDataStore((state) => state.banks);
  const transfer_fee = useDataStore((state) => state.fixed_transfer_fee);
  const getBankTransferData = useDataStore(
    (state) => state.getBankTransferData
  );

  // State to manage tab selection
  const [selectedTab, setSelectedTab] = useState("Recent");

  // State variables for bottom sheet visibility
  const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const manualInputRef = useRef(true);

  useEffect(() => {
    if (accountNumber.length === 10 && manualInputRef.current) {
      handleAccountNumberComplete();
    }
  }, [accountNumber]);

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

  // showLogs("allBanks", allBanks);

  const filteredBanks = allBanks.filter((bank) =>
    bank?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank({ name: bank.name, code: bank.code });
    setShowBanks(false);
    setSearchQuery("");
    setRecipient(null);
    setRecipientName("");
    setAccountNumber("");
  };

  async function handleAccountNumberComplete() {
    try {
      displayLoader();
      const response = await apiService.verifyBankAccount(
        selectedBank.code,
        accountNumber
      );

      setRecipientName(response.data.accountName);
      setRecipient({
        account_name: response.data.accountName,
        account_number: response.data.accountNumber,
        bank_name: selectedBank.name,
        bank_code: selectedBank.code,
        amount,
        fee: 0,
        description: "Multiple bank transfer",
      });
    } catch (error: _TSFixMe) {
      showLogs("error", error.response);
      showErrorToast({
        title: "Account not found",
        desc: "Please verify the account number and try again",
      });
    } finally {
      hideLoader();
    }
  }

  const handleAdd = () => {
    // const existingUser = bankRecipients.find(
    //   (r) => r.account_number === recipient?.account_number
    // );
    // if (existingUser) {
    //   return showErrorToast({
    //     desc: `User with account number '${recipient?.account_number}' already added`,
    //   });
    // }

    console.log({ transfer_fee, recipient });
    if (recipient) {
      addBankRecipient({
        account_name: recipient.account_name,
        account_number: recipient.account_number,
        amount,
        bank_name: recipient.bank_name,
        bank_code: recipient.bank_code,
        fee: transfer_fee,
        description: remark ?? "Multiple transfer",
      });
      router.push("/AllMultipleBanks");
    }
  };

  const handleAccountNumberChange = (text: string) => {
    manualInputRef.current = true;
    setAccountNumber(text);
  };

  const handleSelectBeneficiary = async (item: Transfer | User) => {
    try {
      displayLoader();
      manualInputRef.current = false;
      const itemData = item as Transfer;
      setRecipientName(itemData.account_name);
      setAccountNumber(itemData.account_number);
      setSelectedBank({
        name: itemData.bank_name,
        code: itemData.bank_code,
      });
      setRecipient({
        account_name: itemData.account_name,
        account_number: itemData.account_number,
        bank_name: itemData.bank_name,
        bank_code: itemData.bank_code,
        amount,
        fee: 0,
        description: "Multiple Bank Transfer",
      });
    } catch (error: _TSFixMe) {
      showLogs("error", error.response);
      showErrorToast({
        title: "Account not found",
        desc: "Please verify the account number and try again",
      });
    } finally {
      hideLoader();
    }
  };

  function handleSelectFavorite(item: Favorite | SwiftpayFavorite) {
    manualInputRef.current = false;
    const itemData = item as Favorite;
    setRecipientName(itemData.acct_name);
    setAccountNumber(itemData.acct_number);
    setSelectedBank({
      name: itemData.bank_name,
      code: itemData.bank_code,
    });
    setRecipient({
      account_name: itemData.acct_name,
      account_number: itemData.acct_number,
      bank_name: itemData.bank_name,
      bank_code: itemData.bank_code,
      amount,
      fee: 0,
      description: "Multiple Bank Transfer",
    });
  }

  const renderBankCard = ({ item }: { item: Bank }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleSelectBank(item)}
      style={{
        padding: 12,
        marginVertical: 6,
        borderRadius: 8,
        // backgroundColor: "#EFF4FF",
        backgroundColor: "#f5f5f5",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {/* <View className="bg-[#c6d9ff] p-3 rounded-full"> */}
      <View className="p-3 rounded-full">
        <FontAwesome name="bank" size={18} color="#5648f9" />
      </View>
      <Text style={{ fontWeight: "500", fontSize: 15 }}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View className={cn(IS_ANDROID_DEVICE ? "mt-10 mx-5" : "mx-5")}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Transfer to Multiple Banks</Text>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => router.push("/Transactions")}
          >
            <Text style={styles.headerText2}>History</Text>
          </TouchableOpacity>
          <View className="mr-6" />
        </View>
        <KAScrollView>
          <Text style={styles.Subtitle}>Transaction Details</Text>

          <View style={styles.inputContainer}>
            <View className="flex-row justify-between items-center">
              <Text style={styles.label}>Bank Name</Text>
              <Pressable onPress={() => setShowBanks(true)}>
                <Text style={[styles.label, { color: "#1400FB" }]}>
                  Select Bank
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              value={selectedBank.name || ""}
              editable={false}
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              keyboardType="number-pad"
            />

            <View style={{ display: "none" }}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                editable={false}
              />
            </View>

            {recipientName && (
              <View style={styles.recipientContainer}>
                <View style={styles.recipientBox}>
                  <View style={styles.recipientContainer}>
                    <AntDesign name="checkcircle" size={18} color="#0000ff" />
                    <View>
                      <Text>Account Name</Text>
                      <Text style={styles.recipientName} numberOfLines={2}>
                        {recipientName}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="10,000"
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
            />
            <Text style={styles.label}>Remark</Text>
            <TextInput
              style={styles.input}
              placeholder="Part payment"
              value={remark}
              onChangeText={setRemark}
            />
          </View>

          {/* Tab Switcher */}
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <View style={styles.recentTopbar}>
                <TouchableOpacity
                  style={
                    selectedTab === "Recent" ? styles.activeTabButton : null
                  }
                  onPress={() => setSelectedTab("Recent")}
                >
                  <Text
                    style={
                      selectedTab === "Recent"
                        ? styles.activeTabText
                        : styles.tabText
                    }
                  >
                    Recent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    selectedTab === "Favorites" ? styles.activeTabButton : null
                  }
                  onPress={() => setSelectedTab("Favorites")}
                >
                  <Text
                    style={
                      selectedTab === "Favorites"
                        ? styles.activeTabText
                        : styles.tabText
                    }
                  >
                    Favorites
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedTab === "Recent" ? (
              <RecentTransfers onSelectBeneficiary={handleSelectBeneficiary} />
            ) : (
              // Favorites Tab Content
              <>
                {/* <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.users}>
                    <Image
                      source={require("../assets/banks/uba.png")}
                      style={styles.user}
                    />
                    <View>
                      <Text style={styles.name}>Jane Doe</Text>
                      <Text style={styles.account}>123456789 UBA</Text>
                    </View>
                  </View>
                  <View style={styles.users}>
                    <Image
                      source={require("../assets/banks/fcmb.png")}
                      style={styles.user}
                    />
                    <View>
                      <Text style={styles.name}>Michael Smith</Text>
                      <Text style={styles.account}>987654321 FCMB</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewMore}
                    onPress={() => router.push("/Beneficiaries")}
                  >
                    <Text style={styles.viewMoreText}>View more</Text>
                  </TouchableOpacity>
                </ScrollView> */}
                <Favorites
                  onSelectBeneficiary={handleSelectFavorite}
                  type="bank"
                />
              </>
            )}
          </View>
          <Button
            text="Add"
            onPress={handleAdd}
            disabled={!recipientName || !selectedBank.code || !amount}
          />
        </KAScrollView>

        {/* Payment Summary Bottom Sheet */}
        <BottomSheet
          isVisible={isPaymentSummaryVisible}
          onBackdropPress={() => setIsPaymentSummaryVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
              <TouchableOpacity
                onPress={() => setIsPaymentSummaryVisible(false)}
              >
                <AntDesign
                  name="closecircleo"
                  size={20}
                  color={"red"}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.successBottomSheetHeaderP}>₦ 4,680.00</Text>
            <View style={styles.successBottomSheetContainer}>
              <View style={styles.flex}>
                <Text style={styles.successBottomSheetTextLabel}>
                  Swiftpay Tag
                </Text>
                <Text style={styles.successBottomSheetText}>@Josiah67</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.successBottomSheetTextLabel}>
                  Recipient Name
                </Text>
                <Text style={styles.successBottomSheetText}>
                  Adeagbo Josiah
                </Text>
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
                <View
                  style={[styles.circle, isChecked && styles.checkedCircle]}
                >
                  {isChecked && (
                    <AntDesign name="check" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handlePay}>
              <Text style={styles.nextButtonText}>Pay</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Transaction PIN Bottom Sheet */}
        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
              <TouchableOpacity
                onPress={() => setIsTransactionPinVisible(false)}
              >
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
              Transfer Successful
            </Text>
            <Text style={styles.desc}>
              Your transfer to Segun Arinze for N4,890.00 is successful
            </Text>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => router.push("/Receipt")}
            >
              <Text style={styles.nextButtonText}>View Receipt</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={showBanks}
          onBackdropPress={() => setShowBanks(false)}
        >
          <View
            style={[
              styles.bottomSheetContent,
              { minHeight: 500, maxHeight: 600 },
            ]}
          >
            <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 18 }}>
              Select a Bank
            </Text>
            <View style={styles.bankInputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Search banks..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.iconWrapper}>
                <AntDesign name="search1" size={20} color="#888" />
              </View>
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.name}
              renderItem={renderBankCard}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View className="items-center justify-center">
                  <FontAwesome name="bank" size={60} color="#5648f9" />
                  <Text className="text-center text-gray-500 text-[17px] mt-4">
                    Something went wrong
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowBanks(false);
                      getBankTransferData();
                    }}
                  >
                    <Text className="text-center text-swiftPayBlue text-[17px] mt-4 font-semibold">
                      Retry
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 10,
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
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
    marginBottom: 25,
  },
  name: {
    fontWeight: "700",
  },
  account: {
    color: "#A3A3A3",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.swiftPayBlue,
  },
  activeTabText: {
    color: COLORS.swiftPayBlue,
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
  bankInputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "absolute",
    right: 10,
    top: 15,
  },

  recipientContainer: {
    marginBottom: 10,
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  recipientBox: {
    backgroundColor: "#EFF4FF",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
    width: "100%",
  },
  recipientName: {
    color: "#0000ff",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
});

export default MultipleBankTransfer;
