import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState, useEffect, Fragment } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useToast } from "react-native-toast-notifications";
import { BottomSheet } from "@rneui/themed";
import { apiService, Bank, BankTransfer, UserProfile } from "../services/api";
// Import the BottomSheet component from react-native-elements
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showLogs } from "@/utils/logger";
import PinComponent from "@/components/ui/PinComponent";
import { pink600 } from "react-native-paper/lib/typescript/styles/themes/v2/colors";
import useDataStore from "@/stores/useDataStore";
import { _TSFixMe, calculateSimilarity, getInitials } from "@/utils";
import KAScrollView from "@/components/ui/KAScrollView";
import LoadingComp from "@/components/Loading";
import { DEFAULT_PIN } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast } from "@/components/ui/Toast";
import { Beneficiary } from "./Beneficiaries";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import { COLORS } from "@/constants/Colors";

const { height } = Dimensions.get("window");

interface BankAccount {
  bankName: string;
  accountNumber: string;
}

const SingleBankTransfer: React.FC = () => {
  const params = useLocalSearchParams();

  const toast = useToast();
  const [selectedBank, setSelectedBank] = useState({
    name: "",
    code: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [isBankSheetVisible, setIsBankSheetVisible] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  // const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<BankTransfer[]>([]);
  const [favorites, setFavorites] = useState<BankTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBanks, setShowBanks] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactionFee] = useState(10.0); // Add transaction fee state

  // State variables for bottom sheet visibility
  const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyPin, displayLoader, hideLoader } = useAuth();
  const manualInputRef = useRef(true);
  const [preFilledAccount, setPreFilledAccount] = useState<BankAccount | null>(
    null
  );

  const { transferSource } = useMultipleTransfer();

  const [transferAmount, setTransferAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");

  const allBanks = useDataStore((state) => state.banks);

  // transfer fee
  const [fixedTransferFee, setFixedTransferFee] = useState();
  const [percentageTransferFee, setPercentageTransferFee] = useState();

  // Add this to state declarations
  const [selectedTab, setSelectedTab] = useState("Recent");

  // Add these state variables
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [feeAmount, setFeeAmount] = useState<number>(0);

  const getBankTransferData = useDataStore(
    (state) => state.getBankTransferData
  );

  useEffect(() => {
    fetchBanks();
    getFavorites();
    fetchUserProfile();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
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
      // setFilteredBanks(data.data.banks);
      // showLogs("data.data.banks", data.data.banks);
      // showLogs("data.data.recent_tranfers", data.data.recent_tranfers);
      const transfersObj = data.data.recent_tranfers;
      // showLogs("data.data.banks", data.data.recent_tranfers);
      const transfersArray = Object.values(transfersObj);
      // showLogs("transfersArray", transfersArray);
      setRecentTransfers(transfersArray as BankTransfer[]);
      // setRecentTransfers(data.data.recent_tranfers);
      // setFavorites(data.data.recent_tranfers);
      setFixedTransferFee(data.data.fixed_transfer_fee);
      setPercentageTransferFee(data.data.percentage_transfer_fee);
    } catch (error: any) {
      console.log("error", error.response);
      Alert.alert("Error", "Failed to fetch banks and beneficiaries");
    } finally {
      setLoading(false);
    }
  };

  async function getFavorites() {
    try {
      const beneficiaries = await apiService.getBankTransferBeneficiaries();
      setFavorites(
        beneficiaries.data.transfers.filter(
          (b: Beneficiary) => b.is_beneficiary
        )
      );
    } catch (error) {
      showLogs("error getting beneficiaries", error);
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      setUserProfile(response);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch profile"
      );
    }
  };

  // const handleBankInputChange = (text: string) => {
  //   const filtered = banks.filter((bank) =>
  //     bank?.name.toLowerCase().includes(text.toLowerCase())
  //   );
  //   setFilteredBanks(filtered);
  // };

  // const handleAccountNumberChange = async (number: string) => {
  //   setAccountNumber(number);
  //   setRecipientName("");

  //   if (number?.length === 10 && selectedBank) {
  //     try {
  //       setVerifying(true);
  //       console.log("selectedBank", selectedBank);
  //       const response = await apiService.verifyBankAccount(
  //         selectedBank.code,
  //         number
  //       );
  //       showLogs("response", response);

  //       if (response.status === "success") {
  //         setRecipientName(response.data.account_name);
  //         // toast.show(response.data.account_name, {
  //         //   type: "success",
  //         //   duration: 3000,
  //         // });
  //       } else {
  //         setRecipientName("");
  //         toast.show("Could not verify account", {
  //           type: "danger",
  //           duration: 3000,
  //         });
  //       }
  //     } catch (error: any) {
  //       console.log(
  //         "Verification error:",
  //         error.response?.data || error.message
  //       );
  //       setRecipientName("");
  //       toast.show("Failed to verify account", {
  //         type: "danger",
  //         duration: 3000,
  //       });
  //     } finally {
  //       setVerifying(false);
  //     }
  //   }
  // };

  const handleAccountNumberChange = async (
    number: string,
    bankOverride?: { code: string; name: string }
  ) => {
    setAccountNumber(number);
    setRecipientName("");

    // setRecipientName(response.data.accountName);

    const bank = bankOverride || selectedBank;

    if (number?.length === 10 && bank?.code) {
      try {
        setVerifying(true);
        showLogs("using bank", { bank, number });

        const response = await apiService.verifyBankAccount(bank.code, number);

        if (response.status === "success") {
          setRecipientName(response.data.accountName);
        } else {
          setRecipientName("");
          toast.show("Could not verify account", {
            type: "danger",
            duration: 3000,
          });
        }
      } catch (error: any) {
        showLogs("Verification error:", error.response?.data || error.message);
        setRecipientName("");
        toast.show("Failed to verify account", {
          type: "danger",
          duration: 3000,
        });
      } finally {
        setVerifying(false);
        hideLoader();
      }
    }
  };

  // const handleBankSelection = (bank: Bank) => {
  //   setSelectedBank(bank);
  //   setIsBankSheetVisible(false);

  //   // If we already have a 10-digit account number, verify it with the new bank
  //   if (accountNumber?.length === 10) {
  //     handleAccountNumberChange(accountNumber);
  //   }
  // };

  // Modify handleNext to calculate fees
  const handleNext = async () => {
    try {
      setIsConfirming(true);
      if (!selectedBank || !accountNumber || !recipientName) {
        Alert.alert("Error", "Please enter valid bank details");
        return;
      }

      if (!amount || parseFloat(amount) < 100) {
        Alert.alert("Error", "Please enter a valid amount (minimum 100)");
        return;
      }

      if (!userProfile || parseFloat(amount) > userProfile.wallet_balance) {
        Alert.alert("Error", "Insufficient balance");
        return;
      }

      // Calculate fees
      const amountValue = parseFloat(amount);
      const percentageFee = (amountValue * (percentageTransferFee || 0)) / 100;
      const totalFee = percentageFee + (fixedTransferFee || 0);
      const calculatedTotal = amountValue + totalFee;

      setFeeAmount(totalFee);
      setTotalAmount(calculatedTotal);
      setIsPaymentSummaryVisible(true);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Failed to proceed");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleTransfer = async (pin: string) => {
    try {
      displayLoader();
      setIsTransferring(true);
      if (!selectedBank || !accountNumber || !recipientName) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please enter valid bank details",
        });
        return;
      }

      const amountValue = parseFloat(amount);
      const percentageFee = (amountValue * (percentageTransferFee || 0)) / 100;
      const totalFee = percentageFee + (fixedTransferFee || 0);
      const calculatedTotal = amountValue + totalFee;

      // const transferToastId = toast.show("Initiating bank transfer...", {
      //   type: "success",
      //   duration: 0,
      // });

      setIsTransactionPinVisible(false);

      const response = await apiService.bankTransfer({
        bank_code: selectedBank.code,
        bank_account_number: accountNumber,
        amount: amountValue,
        account_name: recipientName,
        description: remark || "Transfer",
        bank_name: selectedBank?.name,
        pin: parseInt(pin),
        total_amount: calculatedTotal,
        fee_amount: totalFee,
        source_link:
          transferSource === "send_to_africa" ? transferSource : null,
      });

      const transactionDetails = {
        amount: amountValue,
        totalAmount: calculatedTotal,
        feeAmount: totalFee,
        recipientName: recipientName,
        recipientBank: selectedBank?.name,
        recipientAccount: accountNumber,
        recipientTag: response.data?.recipient_tag || "",
        senderName: `${userProfile?.first_name} ${userProfile?.last_name}`,
        description: remark || "Transfer",
        reference: response.data?.reference || `REF${Date.now()}`,
        date: new Date().toISOString(),
        status: response.data?.status || "Processing",
        transactionType: "Bank Transfer",
      };

      await AsyncStorage.setItem(
        "lastTransaction",
        JSON.stringify(transactionDetails)
      );

      // Show success toast
      Toast.show({
        type: "success",
        text1: "Transfer Initiated",
        text2: "Your transfer is being processed",
        position: "bottom",
        visibilityTime: 2000,
      });

      setSelectedBank({ name: "", code: "" });
      setAccountNumber("");
      setRecipientName("");
      setAmount("");
      setRemark("");
      setOtp("");

      setTransferAmount(amountValue.toLocaleString());
      setTransferRecipient(recipientName);

      router.push({
        pathname: "/TransactionReceipt",
        params: {
          currentTransaction: JSON.stringify(transactionDetails),
          type: "transfer",
        },
      });
    } catch (error: any) {
      console.error("Bank transfer error:", error);
      toast.show(
        error.response?.data?.message || "An error occurred. Please try again.",
        {
          type: "danger",
          duration: 4000,
        }
      );
    } finally {
      setIsTransferring(false);
      hideLoader();
    }
  };

  // Update handleConfirmPayment to use handleTransfer
  const handleConfirmPayment = async (pin: string) => {
    if (pin.length !== 4) {
      Alert.alert("Error", "Please enter a valid 4-digit PIN");
      return;
    }

    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    await handleTransfer(pin);
  };

  useEffect(() => {
    if (params.account && banks.length > 0) {
      try {
        const account = JSON.parse(params.account as string);

        setPreFilledAccount(account);

        const bankName = account.bankName?.trim();

        if (bankName) {
          let matchedBank = banks.find(
            (b) => b.name.toLowerCase().trim() === bankName.toLowerCase()
          );

          // If no exact match, find the most similar one
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
            setSelectedBank({ name: matchedBank.name, code: matchedBank.code });
            showLogs("Bank found and set", {
              name: matchedBank.name,
              code: matchedBank.code,
            });
          } else {
            setSelectedBank({ name: bankName, code: "" });
            showLogs("Bank not found, user must verify", { bankName });
          }
        }

        setAccountNumber(account.accountNumber);
        handleAccountNumberChange(account.accountNumber);
      } catch (error) {
        console.error("Error parsing account data:", error);
      }
    }
  }, [params.account, banks]);

  const [isChecked, setIsChecked] = useState(true);

  const toggleCheckbox = () => {
    setIsChecked(!isChecked); // Toggle checkbox state
  };

  const [otp, setOtp] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const filteredBanks = allBanks.filter((bank) =>
    bank?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank({ name: bank.name, code: bank.code });
    setShowBanks(false);
    setSearchQuery("");
    setRecipientName("");
  };

  const renderBankCard = ({ item }: { item: _TSFixMe }) => (
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

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      // Move to the previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Add this to handlePay function
  const handlePay = () => {
    setIsPaymentSummaryVisible(false);
    setIsTransactionPinVisible(true);
  };

  if (verifying) {
    return <LoadingComp visible />;
  }

  function RecentTransferItem({
    item,
    index,
  }: {
    item: _TSFixMe;
    index: number;
  }) {
    return (
      <Animated.View entering={FadeInDown.delay(20 * index)}>
        <TouchableOpacity
          key={item?.id}
          style={styles.userItem}
          onPress={() => {
            const matchedBank = banks?.find(
              (bank) => bank?.code === item?.bank_code
            );
            // showLogs("item", item);

            if (!matchedBank) {
              showErrorToast({
                title: "Something went wrong verifying bank",
                desc: "Please enter bank details again",
              });
            }
            setSelectedBank({
              name: matchedBank?.name!,
              code: matchedBank?.code!,
            });
            setAccountNumber(item.account_number);
            setRecipientName(item.account_name);
            // handleAccountNumberChange(item.account_number);
            // handleAccountNumberChange(item.account_number, true, matchedBank);
          }}
        >
          <View style={styles.userInfo}>
            <View style={styles.bankInitialContainer}>
              <Text className="text-[#0000ff] font-semibold text-base">
                {getInitials(item.account_name)}
              </Text>
            </View>
            <View>
              <Text style={styles.userName} numberOfLines={1}>
                {item.account_name || "Unknown"}
              </Text>
              <Text style={styles.userTag} numberOfLines={1}>
                {item.account_number} • {item.bank_name}
              </Text>
              <Text></Text>
            </View>
            {/* <AntDesign
              name="right"
              size={16}
              color="#BBBBBB"
              style={styles.chevron}
            /> */}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/transfer")}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Transfer to Bank</Text>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => router.push("/Transactions")}
        >
          <Text style={styles.headerText2}>History</Text>
        </TouchableOpacity>
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
              style={[
                styles.tagInput,
                accountNumber ? styles.filledInput : null,
              ]}
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              keyboardType="numeric"
              maxLength={10}
              placeholderTextColor="#AAA"
            />

            <TouchableOpacity
              onPress={() => {
                router.push({ pathname: "/AccountScannerScreen" });
              }}
            >
              <MaterialIcons name="qr-code" size={23} color="#1400FB" />
            </TouchableOpacity>
          </View>

          {accountNumber && accountNumber?.length === 10 && recipientName && (
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
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="10,000"
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
              placeholderTextColor="#AAA"
            />
          </View>
          <Text style={styles.label}>Remark</Text>
          <TextInput
            style={styles.input}
            placeholder="Part payment"
            value={remark}
            onChangeText={setRemark}
            placeholderTextColor="#AAA"
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "Recent" ? styles.activeTabButton : null,
              ]}
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
              style={[
                styles.tabButton,
                selectedTab === "Favorites" ? styles.activeTabButton : null,
              ]}
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

          {/* Conditional Rendering Based on Selected Tab */}
          {selectedTab === "Recent" ? (
            // Recent Tab Content
            <View style={styles.tabContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : recentTransfers?.length > 0 ? (
                <>
                  {recentTransfers.map((item, index) => (
                    <RecentTransferItem
                      item={item}
                      index={index}
                      key={item.id}
                    />
                  ))}
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() =>
                      router.push({
                        pathname: "/Beneficiaries",
                        params: {
                          data: JSON.stringify(recentTransfers),
                        },
                      })
                    }
                  >
                    <Text style={styles.viewAllText}>View all</Text>
                    <AntDesign name="right" size={16} color="#0000ff" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noTransfersContainer}>
                  <Text style={styles.noTransfersText}>
                    No recent transfers
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Fragment>
              <View style={styles.tabContent}>
                {favorites?.length > 0 ? (
                  <Fragment>
                    {favorites.map((item, index) => (
                      <RecentTransferItem
                        item={item}
                        index={index}
                        key={item.id}
                      />
                    ))}

                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={() =>
                        router.push({
                          pathname: "/Beneficiaries",
                          params: {
                            data: JSON.stringify(recentTransfers),
                          },
                        })
                      }
                    >
                      <Text style={styles.viewAllText}>View all</Text>
                      <AntDesign name="right" size={16} color="#0000ff" />
                    </TouchableOpacity>
                  </Fragment>
                ) : (
                  <View style={styles.noTransfersContainer}>
                    <Text style={styles.noTransfersText}>No favorites yet</Text>
                  </View>
                )}
              </View>
            </Fragment>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedBank ||
              !accountNumber ||
              !amount ||
              !recipientName ||
              isConfirming) &&
              styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={
            !selectedBank ||
            !accountNumber ||
            !amount ||
            !recipientName ||
            isConfirming
          }
        >
          {isConfirming ? (
            <LoadingComp visible />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </KAScrollView>

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
            keyExtractor={(item) => item.code.toString()}
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

      <BottomSheet
        isVisible={isPaymentSummaryVisible}
        onBackdropPress={() => setIsPaymentSummaryVisible(false)}
        backdropStyle={styles.bottomSheetBackdrop}
        containerStyle={styles.bottomSheetContainer}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetHeaderRow}>
            <Text style={styles.bottomSheetHeaderTitle}>Complete Payment</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsPaymentSummaryVisible(false)}
            >
              <AntDesign name="close" size={18} color="#777" />
            </TouchableOpacity>
          </View>

          <Text style={styles.amountTotalText}>
            ₦{totalAmount.toLocaleString()}
          </Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>
                ₦{parseFloat(amount || "0").toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transaction Fee</Text>
              <Text style={styles.summaryValue}>
                ₦{feeAmount.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₦{totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.paymentMethodSection}>
            <Text style={styles.paymentMethodTitle}>Payment Method</Text>
            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodLabel}>SwiftPay Balance</Text>
                <Text style={styles.paymentMethodAmount}>
                  ₦{userProfile?.wallet_balance.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={toggleCheckbox}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.checkbox, isChecked && styles.checkboxActive]}
                >
                  {isChecked && (
                    <AntDesign name="check" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePay}
            disabled={isTransferring}
            activeOpacity={0.9}
          >
            {isTransferring ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.payButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Transaction PIN Bottom Sheet */}
      <BottomSheet
        isVisible={isTransactionPinVisible}
        onBackdropPress={() => setIsTransactionPinVisible(false)}
        backdropStyle={styles.bottomSheetBackdrop}
        containerStyle={styles.bottomSheetContainer}
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
        containerStyle={styles.fullScreenBottomSheet}
      >
        <View style={[styles.bottomSheetContent, { height }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(tabs)")}
            >
              <AntDesign name="arrowleft" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/")}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Icon and Amount */}
          <View style={styles.transactionInfo}>
            <View style={styles.successIconContainer}>
              <FontAwesome name="check-circle" size={60} color="#00C853" />
            </View>
            <Text style={styles.successTitle}>Transfer Successful!</Text>
            <Text style={styles.successAmount}>₦{amount}</Text>
            <Text style={styles.successRecipient}>to {recipientName}</Text>
          </View>

          {/* Transaction Details Card */}
          <View style={styles.transferDetailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Processing</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank</Text>
              <Text style={styles.detailValue}>{selectedBank?.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValue}>{accountNumber}</Text>
            </View>
          </View>

          {/* Transaction Status Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              The transaction is being processed, kindly hold on for a status
              update.
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => router.push("/Receipt")}
          >
            <Text style={styles.shareButtonText}>
              <FontAwesome name="share" size={18} color="#000" /> View Receipt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/Report")}
          >
            <Text style={styles.reportText}>Report an Issue</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* <BottomSheet
        isVisible={isBankSheetVisible}
        onBackdropPress={() => setIsBankSheetVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Select a Bank</Text>
          <View style={styles.bankInputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Search bank"
              onChangeText={handleBankInputChange}
            />
            <View style={styles.iconWrapper}>
              <AntDesign name="search1" size={20} color="#888" />
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item?.id?.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bankItem}
                  onPress={() => {
                    handleBankSelection(item);
                  }}
                >
                  <View style={styles.bankInitialContainer}>
                    <Text style={styles.bankInitialText}>
                      {item?.name?.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.bankName}>{item?.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.bankList}
            />
          )}
        </View>
      </BottomSheet> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  bankList: {
    maxHeight: 300, // Adjust as needed
    marginTop: 10,
  },
  chevron: {
    marginLeft: "auto",
    color: "#BBBBBB",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  reportButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
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
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    marginBottom: 20,
    borderRadius: 10,
    color: "#333",
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },
  selectInput: {
    backgroundColor: "#F5F7FF",
  },
  filledInput: {
    backgroundColor: "#F5F7FF",
    borderColor: "#0000ff20",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#0000ff",
    marginRight: 8,
    fontWeight: "600",
  },
  amountInput: {
    flex: 1,
    padding: 14,
    borderWidth: 0,
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -15,
    marginBottom: 15,
    marginLeft: 5,
  },
  verifyingText: {
    marginLeft: 8,
    color: "#0000ff",
    fontSize: 13,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f6f6f6",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerText2: {
    fontSize: 15,
    fontWeight: "600",
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
    gap: 10,
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
  tabButton: {
    paddingBottom: 8,
    marginRight: 15,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#0000ff",
  },
  activeTabText: {
    color: "#0000ff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 15,
  },
  fullScreenBottomSheet: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheetContainer: {
    backgroundColor: "transparent",
  },
  bottomSheetContent: {
    padding: 24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  bottomSheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bottomSheetHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  amountTotalText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    marginBottom: 24,
  },
  summaryContainer: {
    backgroundColor: "#F8F9FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    left: 96,
    marginBottom: 10,
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F7FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E9FF",
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  paymentMethodAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  // checkboxContainer: {
  //   height: 24,
  //   width: 24,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9CA3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#0000ff",
    borderColor: "#0000ff",
  },
  payButton: {
    backgroundColor: "#0000ff",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#0000ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pinInstructionsContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  pinTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  pinSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    maxWidth: "80%",
  },
  // otpContainer: {
  //   flexDirection: "row",
  //   justifyContent: "center",
  //   marginBottom: 32,
  //   gap: 12,
  // },
  // otpInput: {
  //   width: 60,
  //   height: 60,
  //   borderWidth: 1.5,
  //   borderColor: "#E0E0E0",
  //   borderRadius: 12,
  //   textAlign: "center",
  //   fontSize: 24,
  //   fontWeight: "700",
  //   color: "#222",
  //   backgroundColor: "#F7F9FF",
  // },
  confirmPinButton: {
    backgroundColor: "#0000ff",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#0000ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  confirmPinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPinButton: {
    alignItems: "center",
    padding: 12,
  },
  forgotPinText: {
    color: "#0000ff",
    fontSize: 14,
    fontWeight: "500",
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
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  successBottomSheetContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    fontSize: 15,
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
    fontSize: 12,
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
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  bankInitialContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c6d9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  bankInitialText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0000ff",
  },
  bankName: {
    fontSize: 16,
  },
  bank: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  doneText: {
    color: "#00C853",
    fontSize: 18,
  },
  transactionInfo: {
    alignItems: "center",
    marginVertical: 20,
  },
  processingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5,
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepCompleted: {
    alignItems: "center",
    flexDirection: "column",
  },
  stepCurrent: {
    alignItems: "center",
    flexDirection: "column",
  },
  stepPending: {
    alignItems: "center",
    flexDirection: "column",
  },
  stepText: {
    marginTop: 5,
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  dateText: {
    fontSize: 10,
    color: "#BDBDBD",
  },
  messageContainer: {
    backgroundColor: "#FFF4E5",
    padding: 10,
    borderRadius: 8,
    marginVertical: 20,
    marginTop: 100,
  },
  messageText: {
    color: "#FF8C00",
    fontSize: 13,
  },
  shareButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  shareButtonText: {
    color: "#000",
    fontSize: 16,
  },
  reportText: {
    color: "#1E88E5",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 30,
  },
  progressBarContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepContainer2: {
    alignItems: "center",
    left: -55,
  },
  stepContainer3: {
    alignItems: "center",
    left: -100,
  },
  progressLineCompleted: {
    width: 100,
    height: 3,
    backgroundColor: "#00C853",
    marginTop: -60,
    left: -25,
  },
  progressLinePending: {
    width: 100,
    height: 3,
    backgroundColor: "#BDBDBD",
    marginTop: -60,
    left: -85,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#0000ff",
    marginBottom: 8,
  },
  successRecipient: {
    fontSize: 16,
    color: "#666",
  },
  transferDetailsCard: {
    backgroundColor: "#F8F9FF",
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF9800",
    marginRight: 6,
  },
  statusText: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "600",
  },
  recipientContainer: {
    flexDirection: "row",
    gap: 8,

    marginBottom: 20,
  },
  recipientBox: {
    backgroundColor: "#EFF4FF",
    width: "100%",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  recipientName: {
    color: "#0000ff",
    fontSize: 15,
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  tabContent: {
    paddingHorizontal: 5,
  },
  userItem: {
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  userTag: {
    fontSize: 13,
    color: "#666",
  },
  noTransfersContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noTransfersText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  viewAllText: {
    color: "#0000ff",
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 10,
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

export default SingleBankTransfer;
