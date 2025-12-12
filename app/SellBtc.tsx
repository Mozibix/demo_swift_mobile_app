import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
  FlatList,
  Modal,
  SafeAreaView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { BottomSheet } from "@rneui/themed";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import SellNetworks from "@/components/SellNetworks";
import DropDownPicker from "react-native-dropdown-picker";
import useWalletStore from "@/stores/useWalletStore";
import { cryptoExchangeApi } from "@/services/api";
import Button from "@/components/ui/Button";
import { showLogs } from "@/utils/logger";
import { cn, formatAmount, getErrorMessage } from "@/utils";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import KAScrollView from "@/components/ui/KAScrollView";
import PinComponent from "@/components/ui/PinComponent";
import { useAuth } from "@/context/AuthContext";
import Networks from "@/components/Networks";
import { showErrorToast } from "@/components/ui/Toast";
import { format } from "date-fns";

interface CryptoDetails {
  currency: any;
  dollarRate: number;
  naira_rate: number;
  fee: number;
  quidaxWalletAddress: any;
  quidaxWallet: any;
  networks: any[];
  swiftpay_fee: number;
}

const SellBtc = () => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const { user } = useAuth();
  const { crypto_id, cryptoName, price, quantity, limits, symbol } =
    useLocalSearchParams();
  const [balanceDetails, setBalanceDetails] = useState<{
    name: string;
    currency: string;
    balance: string;
  } | null>(null);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const handlePreview = () => {
    if (!usdtSellAmount) {
      return showErrorToast({
        title: `Enter amount of ${cryptoName} to sell`,
      });
    }

    if (+usdtSellAmount > parseFloat(balanceDetails?.balance!)) {
      return showErrorToast({
        title: "Insufficient crypto balance",
        desc: `Please fund your ${cryptoName} wallet to continue`,
      });
    }

    setIsPreviewVisible(true);
  };

  const handleContinue = () => {
    setIsPreviewVisible(false);
    setIsTransactionPinVisible(true);
  };

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const { verifyPin, getUserProfile, displayLoader, hideLoader } = useAuth();
  const networkItems = [
    { label: "BEP20", value: "bep20" },
    { label: "ERC20", value: "erc20" },
    { label: "TRC20", value: "trc20" },
    { label: "Polygon", value: "polygon" },
    { label: "Solana", value: "solana" },
    { label: "Celo", value: "celo" },
    { label: "Optimism", value: "optimism" },
    { label: "TON", value: "ton" },
  ];

  const { walletAddress } = useWalletStore(); // Retrieve wallet details

  const [selectedWalletAddress, setSelectedWalletAddress] = useState(
    walletAddress || ""
  );

  React.useEffect(() => {
    // Autofill the fields when walletAddress changes
    if (walletAddress) setSelectedWalletAddress(walletAddress);
  }, [walletAddress]);

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

  const [usdtSellAmount, setUsdtSellAmount] = useState("");
  const sellExchangeRate = 740; // Conversion rate for selling USDT to NGN

  // Calculate amount in NGN
  const amountInNGN = usdtSellAmount
    ? (parseFloat(usdtSellAmount) * sellExchangeRate).toFixed(2)
    : "0.00";

  const [cryptoDetails, setCryptoDetails] = useState<CryptoDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(Date.now().toString());
  const [error, setError] = useState<string | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  const fetchCryptoDetails = async (cryptoId: string) => {
    try {
      displayLoader();
      const response = await cryptoExchangeApi.getSellCryptoPage(cryptoId);
      showLogs("fetchCryptoDetails response", response);
      setCryptoDetails(response.data);
      setBalanceDetails({
        name: response.data.quidax_wallet.name,
        currency: response.data.quidax_wallet.currency,
        balance: response.data.quidax_wallet.balance,
      });
    } catch (err: any) {
      showLogs("fetchCryptoDetails error", err.response);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const calculateNairaAmount = (amount: string) => {
    try {
      if (!cryptoDetails?.naira_rate) alert("Exchange rate not available");

      const nairaAmount = +amount * (cryptoDetails?.naira_rate || 0);

      setCalculatedAmount(nairaAmount);

      // const feePercentage = cryptoDetails?.swiftpay_fee || 10;
      // const amountAfterFee = nairaAmount * (1 - feePercentage / 100);

      // setCalculatedAmount(amountAfterFee);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    }
  };

  const handleConfirmPayment = async (pin: string) => {
    setError("");
    setIsLoading(true);
    displayLoader();
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    try {
      if (!cryptoDetails) throw new Error("Crypto details not available");

      await cryptoExchangeApi.submitSellOrder({
        crypto_amount: parseFloat(usdtSellAmount),
        amount_in_naira: calculatedAmount,
        total: calculatedAmount,
        currency_id: cryptoDetails.currency?.id,
        pin: parseInt(otp.join("")),
        crypto_rate: cryptoDetails?.naira_rate,
      });

      getUserProfile();
      setIsTransactionPinVisible(false);
      setIsSuccessVisible(true);
    } catch (error: any) {
      showLogs("err", error);
      const firstErrorMessage = getErrorMessage(error);
      setError(
        error?.data?.message || firstErrorMessage || "Transaction failed"
      );
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    if (crypto_id) {
      fetchCryptoDetails(crypto_id as string);
    }
  }, [crypto_id, shouldRefresh]);

  useEffect(() => {
    if (usdtSellAmount) {
      calculateNairaAmount(usdtSellAmount);
    }
  }, [usdtSellAmount]);

  function getTotal(amount: number, fee: number) {
    return formatAmount(amount - fee);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View className={cn(IS_IOS_DEVICE ? "mx-5" : "pt-12")}>
        <View>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <AntDesign name="arrowleft" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Sell {cryptoName}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <KAScrollView styles={styles.scrollContainer}>
            {/* Price Section */}
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>₦{formatAmount(+price)}</Text>
            </View>

            {/* <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>Quantity</Text>
              <Text style={styles.detailValue}>{quantity}</Text>
            </View> */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>Payment Method</Text>
              <View style={styles.leftLine}>
                <Text style={styles.balanceName}>SwiftPay Balance</Text>
              </View>
            </View>
            <View style={styles.detailsContainer}>
              <Text className="text-swiftPayBlue">
                Note: You need to first fund your SwiftPay {cryptoName} wallet
                before you can sell crypto
              </Text>
            </View>
            {/* <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>Payment Duration</Text>
              <Text style={styles.detailValue}>15 Min(s)</Text>
            </View> */}

            {/* Balance Section */}
            <View style={styles.balanceSection}>
              <View>
                <Text style={styles.balanceLabel}>SwiftPay Balance</Text>
                <Text style={styles.balanceAmount}>
                  {isBalanceHidden
                    ? "******"
                    : formatAmount(user?.wallet_balance || 0)}
                </Text>
              </View>
              <TouchableOpacity onPress={toggleBalanceVisibility}>
                <AntDesign
                  name={isBalanceHidden ? "eyeo" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* <SellNetworks /> */}
            <Networks
              networks={cryptoDetails?.networks}
              onAddressSelected={() => {}}
              symbol={cryptoDetails?.currency.symbol}
              name={cryptoDetails?.currency.name}
              balanceDetails={balanceDetails}
              setShouldRefresh={setShouldRefresh}
              type="sell"
            />
            <View style={styles.notice}>
              <AntDesign name="exclamationcircle" color={"#0000ff"} size={16} />
              <Text style={styles.noticeText}>
                Note: Ensure you input the right info, as we would not be held
                liable for any loss of asset.
              </Text>
            </View>

            {/* <Text style={styles.label}>Crypto Network</Text>
          <TouchableOpacity
            style={styles.modalDropdown}
            onPress={() => setIsDropdownVisible(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedNetwork || "Select Network"}
            </Text>
            <AntDesign name="down" size={16} color="#666" />
          </TouchableOpacity>

          <Text style={styles.paymentText}>Your Wallet Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Wallet Address"
            value={selectedWalletAddress}
            onChangeText={(text) => setSelectedWalletAddress(text)}
            editable={true}
            selectTextOnFocus={true}
            keyboardType="default"
          /> */}

            <Text style={styles.paymentText}>
              Amount of {cryptoName} to Sell
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${cryptoName} Amount`}
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={usdtSellAmount}
              onChangeText={(text) => setUsdtSellAmount(text)}
            />

            {/* Display calculated NGN amount */}
            <Text style={styles.paymentText}>Amount to receive in NGN</Text>
            <View style={styles.estimate}>
              {/* <Text style={styles.estimateValue}>{amountInNGN} NGN</Text> */}
              <Text style={styles.estimateValue}>
                {formatAmount(calculatedAmount)} NGN
              </Text>
            </View>
            <Text style={styles.info}>
              {" "}
              SwiftPay charges a {cryptoDetails?.swiftpay_fee}% fee on all
              transactions
            </Text>

            <Button
              text="Proceed"
              onPress={handlePreview}
              disabled={!usdtSellAmount}
            />

            <Text style={styles.noteBottom}>
              Proceed to complete your Sell order
            </Text>
          </KAScrollView>

          {/* Preview Bottom Sheet */}
          <BottomSheet
            isVisible={isPreviewVisible}
            onBackdropPress={() => setIsPreviewVisible(false)}
          >
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Order Preview</Text>
                <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
                  <AntDesign name="closecircleo" size={20} color="red" />
                </TouchableOpacity>
              </View>
              <View className="mb-4">
                <Text style={styles.amount}>Total</Text>
                <Text style={styles.amount}>
                  ₦
                  {getTotal(
                    calculatedAmount,
                    ((cryptoDetails?.swiftpay_fee || 1) / 100) *
                      calculatedAmount
                  )}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Crypto to Sell</Text>
                <Text style={styles.bottomSheetText}>
                  {formatAmount(+usdtSellAmount)} {symbol}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Amount to receive</Text>
                <Text style={styles.bottomSheetText}>
                  {calculatedAmount.toFixed(2)} NGN
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Fee</Text>
                <Text style={styles.bottomSheetText}>
                  {(
                    ((cryptoDetails?.swiftpay_fee || 1) / 100) *
                    (calculatedAmount ?? 0)
                  ).toFixed(2)}{" "}
                  NGN
                </Text>
              </View>
              <TouchableOpacity
                style={styles.SellButton}
                onPress={handleContinue}
              >
                <Text style={styles.SellButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </BottomSheet>

          {/* Success Bottom Sheet */}
          {/* <BottomSheet
            isVisible={isSuccessVisible}
            onBackdropPress={() => setIsSuccessVisible(false)}
          >
            <View style={styles.bottomSheetContent}>
              <TouchableOpacity onPress={() => setIsSuccessVisible(false)}>
                <AntDesign name="closecircleo" size={20} color="red" />
              </TouchableOpacity>
              <Image
                source={require("../assets/icons/success.png")}
                style={styles.logo}
              />
              <Text style={styles.successBottomSheetHeader}>
                Your order has been completed
              </Text>
            </View>
          </BottomSheet> */}
        </View>

        <Modal
          visible={isDropdownVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsDropdownVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitles}>Select Network</Text>
              <FlatList
                data={networkItems}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedNetwork(item.label);
                      setIsDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setIsDropdownVisible(false)}
              >
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => {
            setIsTransactionPinVisible(false);
            setError("");
          }}
        >
          <View style={[styles.bottomSheetContent, { padding: 0 }]}>
            <View style={[styles.bottomSheetHeader, { padding: 20 }]}>
              <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsTransactionPinVisible(false);
                  setError("");
                }}
              >
                <AntDesign
                  name="closecircleo"
                  size={20}
                  color={"red"}
                  style={styles.icon}
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
            <Text style={styles.successBottomSheetHeader}>Sale Successful</Text>
            <Text style={styles.desc}>
              Crypto sale of {usdtSellAmount} {cryptoName} was successful
            </Text>

            <Button
              text="View Receipt"
              onPress={() => {
                setIsSuccessVisible(false);
                router.push({
                  pathname: "/TransactionReceipt",
                  params: {
                    isCrypto: "true",
                    isSellCypto: "true",
                    currentTransaction: JSON.stringify({
                      amount: usdtSellAmount as string,
                      amountToReceive: formatAmount(calculatedAmount),
                      senderName: user?.first_name + " " + user?.last_name,
                      source: "Sell Crypto",
                      description: `Sold ${usdtSellAmount} ${cryptoName} to receive ${formatAmount(
                        calculatedAmount
                      )} NGN`,
                      date: format(
                        new Date(),
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'000Z'"
                      ),
                      status: "Successful",
                      symbol: symbol,
                      transactionType: `Sell ${cryptoName} (${symbol})`,
                    }),
                  },
                });
              }}
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
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 150,
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
  placeholder: {
    width: 50,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: "#666",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00952A",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "medium",
    color: "#000",
  },
  balanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#D4E7F3",
  },
  row: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#000",
  },
  balanceAmount: {
    fontSize: 24,
    color: "#000",
    fontWeight: "700",
  },
  note: {
    color: "#1400fb",
    fontSize: 15,
    marginBottom: 20,
  },
  input: {
    borderColor: "#EAEAEA",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#EAEAEA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  flexInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: "#EAEAEA",
  },
  currencyText: {
    marginRight: 10,
    color: "#666",
    fontSize: 16,
  },
  pressableText: {
    color: "#1400FB",
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentText: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "500",
  },
  estimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#DFF1FC",
    padding: 10,
    borderRadius: 10,
  },
  SellButton: {
    backgroundColor: "#1400FB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  SellButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "medium",
  },
  noteBottom: {
    fontSize: 14,
    color: "#000",
    textAlign: "left",
    marginTop: 10,
  },
  est: {
    fontSize: 16,
    color: "#999",
    fontWeight: "700",
  },
  estTitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  leftLine: {
    borderLeftWidth: 3,
    borderLeftColor: "#1400fb",
    paddingHorizontal: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  balanceName: {
    color: "#666",
    fontWeight: "500",
    marginBottom: 5,
  },
  headline: {
    borderBottomWidth: 3,
    borderBottomColor: "#1400fb",
    borderRadius: 2,
    marginBottom: 20,
    width: 160,
    fontWeight: "500",
    fontSize: 16,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "500",
    left: 100,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
  },
  successBottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
    alignItems: "center",
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
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  icon: {
    alignSelf: "flex-end",
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
    marginBottom: 30,
  },
  successBottomSheetContainer: {
    borderWidth: 1,
    padding: 10,
    borderColor: "#ddd",
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
  },
  subText: {
    fontWeight: "700",
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 1,
    gap: 5,
    marginTop: 10,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12,
    color: "#0000ff",
    maxWidth: "90%",
  },
  estimateValue: {
    fontWeight: "700",
    fontSize: 18,
  },
  info: {
    fontSize: 12,
    color: "#000",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#f5f5f5",
  },
  modalDropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  dropdownText: {
    fontSize: 14,
    color: "#000",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#333",
    borderRadius: 10,
    width: "80%",
    padding: 20,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#666",
  },
  modalItemText: {
    fontSize: 16,
    color: "#fff",
  },
  closeModalButton: {
    marginTop: 10,
    alignSelf: "center",
  },
  closeModalText: {
    fontSize: 14,
    color: "red",
  },
  modalTitles: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#fff",
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
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#999",
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
});

export default SellBtc;
