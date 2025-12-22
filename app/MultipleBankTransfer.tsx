import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import * as SecureStore from "expo-secure-store";
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
import { _TSFixMe, calculateSimilarity, cn } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";
import { COLORS } from "@/constants/Colors";
import Favorites from "@/components/recent_transfers/favourites";

interface BankAccount {
  bankName: string;
  accountNumber: string;
}

const MultipleBankTransfer: React.FC = () => {
  const params = useLocalSearchParams();
  const [preFilledAccounts, setPreFilledAccounts] = useState<BankAccount[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);

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
  const [banks, setBanks] = useState<Bank[]>([]);

  const [selectedTab, setSelectedTab] = useState("Recent");

  const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const manualInputRef = useRef(true);

  // Initialize with scanned accounts data
  // useEffect(() => {
  //   if (params.accounts) {
  //     try {
  //       const accounts = JSON.parse(params.accounts as string);
  //       setPreFilledAccounts(accounts);
  //       // Pre-fill first account
  //       if (accounts.length > 0) {
  //         loadAccountData(accounts[0], 0);
  //       }
  //     } catch (error) {
  //       console.error("Error parsing accounts data:", error);
  //     }
  //   }
  // }, [params.accounts]);

  const fetchBanks = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      const response = await fetch(
        "https://swiftpaymfb.com/api/bank-transfer",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setBanks(data.data.banks);
    } catch (error: any) {
      console.log("error", error.response);
    }
  };
  useEffect(() => {
    if (params.accounts && banks.length > 0) {
      try {
        const accounts = JSON.parse(params.accounts as string); // assuming it's an array of accounts
        const firstAccount = accounts[0]; // pick the first account

        if (firstAccount) {
          setPreFilledAccounts(firstAccount);

          // Load account data for the first account
          loadAccountData(firstAccount, 0);

          const bankName = firstAccount.bankName?.trim();

          if (bankName) {
            let matchedBank = banks.find(
              (b) => b.name.toLowerCase().trim() === bankName.toLowerCase()
            );

            if (!matchedBank) {
              let bestMatch = banks[0];
              let bestSimilarity = calculateSimilarity(bankName, banks[0].name);

              for (let i = 1; i < banks.length; i++) {
                const similarity = calculateSimilarity(bankName, banks[i].name);
                if (similarity > bestSimilarity) {
                  bestSimilarity = similarity;
                  bestMatch = banks[i];
                }
              }

              if (bestSimilarity > 0.6) {
                matchedBank = bestMatch;
                showLogs("Using fuzzy matched bank", {
                  inputName: bankName,
                  matchedName: matchedBank.name,
                  similarity: bestSimilarity,
                });
              }
            }

            if (matchedBank) {
              setSelectedBank({
                name: matchedBank.name,
                code: matchedBank.code,
              });
              showLogs("Bank found and set", {
                name: matchedBank.name,
                code: matchedBank.code,
              });
            } else {
              setSelectedBank({ name: bankName, code: "" });
              showLogs("Bank not found, user must verify", { bankName });
            }
          }

          setAccountNumber(firstAccount.accountNumber);
          handleAccountNumberChange(firstAccount.accountNumber);
        }
      } catch (error) {
        console.error("Error parsing account data:", error);
      }
    }
  }, [params.account, banks]);

  const loadAccountData = (account: BankAccount, index: number) => {
    setCurrentAccountIndex(index);
    setSelectedBank({ name: account.bankName, code: "" });
    setAccountNumber(account.accountNumber);
    setRecipientName("");
    setAmount("");
    setRemark("");
    // Auto-verify the account
    setTimeout(() => {
      handleAccountNumberComplete(account.accountNumber, account.bankName);
    }, 300);
  };

  useEffect(() => {
    if (accountNumber.length === 10 && manualInputRef.current) {
      handleAccountNumberComplete(accountNumber, selectedBank.name);
    }
  }, [accountNumber, selectedBank]);

  const handleNext = () => {
    setIsPaymentSummaryVisible(true);
  };

  const handlePay = () => {
    setIsPaymentSummaryVisible(false);
    setIsTransactionPinVisible(true);
  };

  const handleConfirmPayment = () => {
    setIsTransactionPinVisible(false);
    setIsSuccessVisible(true);
  };

  const [isChecked, setIsChecked] = useState(false);

  const toggleCheckbox = () => {
    setIsChecked(!isChecked);
  };

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const filteredBanks = allBanks.filter((bank) =>
    bank?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank({ name: bank.name, code: bank.code });
    setShowBanks(false);
    setSearchQuery("");
    setRecipient(null);
    setRecipientName("");
  };

  async function handleAccountNumberComplete(
    accountNum?: string,
    bankName?: string
  ) {
    try {
      displayLoader();
      const numToVerify = accountNum || accountNumber;
      const bankToUse = selectedBank.code
        ? selectedBank
        : {
            name: bankName || selectedBank.name,
            code: "",
          };

      if (!bankToUse.code) {
        const foundBank = allBanks.find((b) => b.name === bankToUse.name);
        if (foundBank) {
          bankToUse.code = foundBank.code;
        }
      }

      const response = await apiService.verifyBankAccount(
        bankToUse.code,
        numToVerify
      );

      setRecipientName(response.data.accountName);
      setRecipient({
        account_name: response.data.accountName,
        account_number: response.data.accountNumber,
        bank_name: bankToUse.name,
        bank_code: bankToUse.code,
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

      // Load next account if available
      if (
        preFilledAccounts.length > 0 &&
        currentAccountIndex < preFilledAccounts.length - 1
      ) {
        const nextIndex = currentAccountIndex + 1;
        loadAccountData(preFilledAccounts[nextIndex], nextIndex);
      } else {
        router.push("/AllMultipleBanks");
      }
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

  useEffect(() => {
    fetchBanks();
  }, []);

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
        backgroundColor: "#f5f5f5",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
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
            onPress={() => router.push("/transfer")}
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

        {preFilledAccounts.length > 0 && (
          <View
            style={{
              backgroundColor: "#F0F7FF",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#0000ff" }}>
              Account {currentAccountIndex + 1} of {preFilledAccounts.length}
            </Text>
            {currentAccountIndex < preFilledAccounts.length - 1 && (
              <Text style={{ fontSize: 12, color: "#666" }}>
                {preFilledAccounts.length - currentAccountIndex - 1} more to go
              </Text>
            )}
          </View>
        )}

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

            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={selectedBank?.name || ""}
                editable={false}
              />

              <TouchableOpacity
                onPress={() => {
                  router.push({ pathname: "/AccountScannerScreen" });
                }}
              >
                <MaterialIcons name="qr-code" size={23} color="#1400FB" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Account Number</Text>

            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={accountNumber}
                onChangeText={handleAccountNumberChange}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                onPress={() => {
                  router.push({ pathname: "/AccountScannerScreen" });
                }}
              >
                <MaterialIcons name="qr-code" size={23} color="#1400FB" />
              </TouchableOpacity>
            </View>

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
              <Favorites
                onSelectBeneficiary={handleSelectFavorite}
                type="bank"
              />
            )}
          </View>
          <Button
            text={
              preFilledAccounts.length > 0 &&
              currentAccountIndex < preFilledAccounts.length - 1
                ? `Add & Next (${
                    preFilledAccounts.length - currentAccountIndex - 1
                  } remaining)`
                : "Add"
            }
            onPress={handleAdd}
            disabled={!recipientName || !selectedBank.code || !amount}
          />
        </KAScrollView>

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
                  autoFocus={index === 0}
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
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  tagInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
});

export default MultipleBankTransfer;
