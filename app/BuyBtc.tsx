import LoadingComp from "@/components/Loading";
import Networks from "@/components/Networks";
import Button from "@/components/ui/Button";
import KAScrollView from "@/components/ui/KAScrollView";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, apiService } from "@/services/api";
import useWalletStore from "@/stores/useWalletStore";
import {
  _TSFixMe,
  cn,
  formatAmount,
  formatAmountMinimal,
  formatBalance,
} from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useCryptoDetails } from "../hooks/useApi";

export interface Network {
  id: string;
  name: string;
  deposits_enabled: boolean;
  withdraws_enabled: boolean;
  payment_address: string | null;
}

export interface BuyCryptoData {
  currency: {
    id: number;
    uuid: string;
    name: string;
    symbol: string;
    icon: string;
    price_in_usd: number;
  };
  swiftpay_fee: number;
  naira_rate: number;
  networks: Network[];
  quidax_wallet: {
    default_network: string;
  };
}

export interface CryptoOrder {
  fee_amount: number;
  sub_total: number;
  crypto_fee: number;
}

const BuyBtc = () => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState<CryptoOrder | null>(null);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [destinationTag, setDestinationTag] = useState("");
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const { name, price, uuid, symbol, price_in_usd, crypto_id } =
    useLocalSearchParams();
  const [cryptoData, setCryptoData] = useState<BuyCryptoData | null>(null);
  const [networkItems, setNetworkItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [refetchString, setRefetchString] = useState("");
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [convertedBalance, setConvertedBalance] = useState(0);
  const [shouldRefresh, setShouldRefresh] = useState(Date.now().toString());
  const [balanceDetails, setBalanceDetails] = useState<{
    name: string;
    currency: string;
    balance: string;
  } | null>(null);
  const { verifyPin, getUserProfile, displayLoader, hideLoader } = useAuth();
  const storeNetwork = useWalletStore((state) => state.setNetwork);
  const storeSetWalletAddress = useWalletStore(
    (state) => state.setWalletAddress
  );

  // Custom toast function that works across platforms
  const showToast = (message: string, duration = "SHORT") => {
    if (Platform.OS === "android") {
      ToastAndroid.show(
        message,
        duration === "SHORT" ? ToastAndroid.SHORT : ToastAndroid.LONG
      );
    } else {
      Alert.alert("", message);
    }

    hideLoader();
  };

  const [isLoading, setIsLoading] = useState({
    createOrder: false,
    submitOrder: false,
    fetchCryptoData: false,
  });

  useEffect(() => {
    if (crypto_id) {
      fetchCryptoData();
    }

    fetchUserProfile();
  }, [crypto_id, shouldRefresh]);

  const fetchCryptoData = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, fetchCryptoData: true }));
      setNetworkError(null);
      // console.log("crypto_id", crypto_id);
      const response = await apiService.getBuyCryptoPage(Number(crypto_id));
      // showLogs("getBuyCryptoPage response", response);

      if (response.status === "success") {
        setCryptoData(response.data);
        const networks = response.data.networks.map((network: Network) => ({
          label: network.name,
          value: network.id,
        }));
        setNetworkItems(networks);
        // setSwiftpayFee(response.data.swiftpay_fee);
        const quidax_wallet = response.data.quidax_wallet;
        setBalanceDetails({
          name: quidax_wallet.name,
          currency: quidax_wallet.currency,
          balance: quidax_wallet.balance,
        });

        // Set default network if available
        // if (response.data.quidax_wallet?.default_network) {
        //   setSelectedNetwork(response.data.quidax_wallet.default_network);
        // }
      }
    } catch (error: _TSFixMe) {
      showLogs("Error getting crypto data:", error);
      setNetworkError("Failed to load network data. Please try again.");
      // showToast("Failed to load network data. Please try again.", "LONG");
    } finally {
      setIsLoading((prev) => ({ ...prev, fetchCryptoData: false }));
    }
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const handlePreview = () => {
    if (!selectedWalletAddress) {
      showToast("Please select a wallet address first", "LONG");
      return;
    }

    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      showToast("Please enter a valid USDT amount", "LONG");
      return;
    }

    if (!selectedNetwork) {
      showToast("Please select a network", "LONG");
      return;
    }

    setPreviewError(null);
    setIsPreviewVisible(true);
  };

  const handleContinue = () => {
    setPreviewError(null);
    const crypto_fee_naira =
      (cryptoData?.naira_rate ?? 0) * (orderDetails?.crypto_fee ?? 0);
    const swiftpay_fee = orderDetails?.fee_amount;
    const naira_amount = +amountInNGN;

    const total = getTotal(crypto_fee_naira, swiftpay_fee!, +naira_amount);
    if (total > (userProfile?.wallet_balance ?? 0)) {
      setPreviewError(
        "Insufficient Funds. Please fund your SwifPay account to continue"
      );
      return;
    }

    setIsPreviewVisible(false);
    setIsTransactionPinVisible(true);
  };

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const { walletAddress, network } = useWalletStore();
  const setAddress = useWalletStore((state) => state.setNetwork);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<
    string | null
  >(walletAddress || "");
  const clearStoredAddress = useWalletStore(
    (state) => state.clearStoredAddress
  );

  const walletAddressInputRef = useRef<TextInput>(null);

  useEffect(() => {
    clearStoredAddress();
    if (walletAddress) setSelectedWalletAddress(walletAddress);
    if (network) setSelectedNetwork(network);
  }, [walletAddress, network]);

  const handleAddressSelected = () => {
    setTimeout(() => {
      (scrollViewRef.current as _TSFixMe)?.scrollTo({
        y: 450,
        animated: true,
      });
      // walletAddressInputRef.current?.focus();
    }, 500);
  };

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
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

  const [usdtAmount, setUsdtAmount] = useState("");

  // Calculate amount in NGN
  const [amountInNGN, setAmountInNGN] = useState("0.00");

  const [swiftpayFee, setSwiftpayFee] = useState(0);

  const { data: cryptoDetails } = useCryptoDetails(uuid as string);

  useEffect(() => {
    if (usdtAmount && cryptoData?.naira_rate) {
      const ngnAmount = parseFloat(usdtAmount) * cryptoData.naira_rate;
      setAmountInNGN(ngnAmount.toFixed(2));

      const fee = ngnAmount * (cryptoData.swiftpay_fee / 1000);
      setSwiftpayFee(+fee.toFixed(2));
    }
  }, [usdtAmount, cryptoData?.naira_rate, cryptoData?.swiftpay_fee]);

  const createOrder = async () => {
    if (!userProfile?.wallet_balance || userProfile.wallet_balance === 0) {
      showErrorToast({
        title: "Insufficient funds",
        desc: "Please fund your SwifPay account to continue",
      });
      return;
    }
    if (+amountInNGN > userProfile?.wallet_balance!) {
      return showErrorToast({
        title: "Insufficient funds",
        desc: "Please fund your SwifPay account to continue",
      });
    }
    if (
      !selectedWalletAddress ||
      !usdtAmount ||
      !selectedNetwork ||
      !cryptoData
    ) {
      return showErrorToast({
        title: "Please fill in all fields",
      });
    }

    try {
      setIsLoading((prev) => ({ ...prev, createOrder: true }));
      displayLoader();

      const response = await apiService.createCryptoOrder({
        amount: parseFloat(usdtAmount),
        nairaAmount: parseFloat(amountInNGN),
        currency_code: symbol as string,
        crypto_network: selectedNetwork as string,
      });

      setPreviewError(null);
      setIsPreviewVisible(true);

      setOrderDetails(response as _TSFixMe);
    } catch (error: any) {
      showLogs("Create order error:", error);
      showErrorToast({
        title: "Something went wrong",
        desc:
          error.message ||
          error.data.message ||
          "Failed to create order. Please try again.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, createOrder: false }));
      hideLoader();
    }
  };

  function getTotal(
    crypto_fee_in_naira: number,
    swifypay_fees: number,
    naira_amount: number
  ) {
    return crypto_fee_in_naira + swifypay_fees + naira_amount;
  }

  const fetchUserProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get("https://swiftpaymfb.com/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // console.log("User profile response:", response.data);

      if (response.status === 200) {
        await AsyncStorage.setItem(
          "UserDetails",
          JSON.stringify(response.data.data)
        );
        setUserProfile(response.data.data);
        console.log(response.data.data.profile_photo);

        setConvertedBalance(response.data.data.wallet_balance);
        await AsyncStorage.setItem(
          "WalletBalance",
          JSON.stringify(response.data.data.wallet_balance)
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        alert("Session expired. Please login again.");
        await SecureStore.deleteItemAsync("userToken");
        router.push("/login");
      } else {
        alert("Failed to load profile data");
      }
    } finally {
      hideLoader();
    }
  };

  const handleConfirmPayment = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    if (
      !orderDetails ||
      !selectedWalletAddress ||
      !usdtAmount ||
      !selectedNetwork
    ) {
      showToast("Missing order information. Please try again.", "LONG");
      return;
    }

    setIsTransactionPinVisible(false);

    try {
      displayLoader();
      setIsLoading((prev) => ({ ...prev, submitOrder: true }));

      const crypto_fee_naira =
        (cryptoData?.naira_rate ?? 0) * (orderDetails?.crypto_fee ?? 0);
      const swiftpay_fee = orderDetails?.fee_amount;
      const naira_amount = +amountInNGN;

      const total = getTotal(crypto_fee_naira, swiftpay_fee, +naira_amount);

      showLogs("buy crypto payload", {
        wallet_address: selectedWalletAddress,
        crypto_amount: +usdtAmount,
        amount_in_naira: +amountInNGN,
        crypto_fee_in_naira: crypto_fee_naira,
        destination_tag: destinationTag || null,
        total,
        crypto_network: selectedNetwork || (network as string),
        currency_id: cryptoData?.currency.id,
        crypto_fee: orderDetails?.crypto_fee,
        crypto_rate: cryptoData?.naira_rate ?? 0,
      });

      const response = await apiService.submitCryptoOrder({
        pin: +pin,
        wallet_address: selectedWalletAddress,
        crypto_amount: +usdtAmount,
        amount_in_naira: +amountInNGN,
        crypto_fee_in_naira: crypto_fee_naira,
        destination_tag: destinationTag || null,
        total,
        crypto_network: network as string,
        currency_id: cryptoData?.currency.id,
        crypto_fee: orderDetails?.crypto_fee,
        crypto_rate: cryptoData?.naira_rate ?? 0,
      });

      // showLogs("submitCryptoOrder response", response);

      getUserProfile();
      setIsSuccessVisible(true);
      // showSuccessToast({
      //   title: "Successful!",
      //   desc: "Payment successful!",
      // });
    } catch (error: any) {
      showLogs("submit order error", error);
      showErrorToast({
        title: "Something went wrong",
        desc: error.message || "Payment failed. Please try again.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, submitOrder: false }));
      hideLoader();
    }
  };

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
            <Text style={styles.headerText}>Buy {name}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Show loading indicator when fetching crypto data */}
          {isLoading.fetchCryptoData ? (
            <LoadingComp visible />
          ) : (
            <KAScrollView>
              {/* Price Section */}
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Price</Text>

                <Text style={styles.priceValue}>
                  ₦{new Intl.NumberFormat().format(cryptoData?.naira_rate ?? 0)}
                </Text>
              </View>

              <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>Payment Method</Text>
                <Text style={styles.balanceName} className="text-[#111]">
                  SwiftPay Balance
                </Text>
              </View>

              {/* Balance Section */}
              <View style={styles.balanceSection}>
                <View>
                  <Text style={styles.balanceLabel}>SwiftPay Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {isBalanceHidden
                      ? "******"
                      : `₦${formatBalance(convertedBalance)}`}
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

              {/* Display error message if network loading failed */}
              {networkError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{networkError}</Text>
                </View>
              )}

              {/* Pass cryptoData networks to Networks component with callback */}
              {cryptoData?.networks ? (
                <Networks
                  networks={cryptoData.networks}
                  onAddressSelected={handleAddressSelected}
                  setSelectedNetwork={setSelectedNetwork}
                  symbol={symbol}
                  name={name}
                  balanceDetails={balanceDetails}
                  setShouldRefresh={setShouldRefresh}
                  setDestinationTag={setDestinationTag}
                  callback={fetchCryptoData}
                  type="buy"
                />
              ) : (
                <Networks
                  onAddressSelected={handleAddressSelected}
                  symbol={symbol}
                  name={name}
                  setSelectedNetwork={setSelectedNetwork}
                  balanceDetails={balanceDetails}
                  setShouldRefresh={setShouldRefresh}
                  setDestinationTag={setDestinationTag}
                  callback={fetchCryptoData}
                  type="buy"
                />
              )}

              <View style={styles.notice}>
                <AntDesign
                  name="exclamationcircle"
                  color={"#0000ff"}
                  size={16}
                />
                <Text style={styles.noticeText}>
                  Note: Ensure you input the right info, as we would not be held
                  liable for any loss of asset.
                </Text>
              </View>

              <Text style={styles.label}>Crypto Network</Text>
              <TouchableOpacity
                style={styles.modalDropdown}
                onPress={() => setIsDropdownVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedNetwork || "Select Network"}
                </Text>
                <AntDesign name="down" size={16} color="#666" />
              </TouchableOpacity>

              {/* Input Fields */}
              <Text style={styles.paymentText}>Your Wallet Address</Text>
              <TextInput
                ref={walletAddressInputRef}
                style={styles.input}
                placeholder="Enter Wallet Address"
                value={selectedWalletAddress as string}
                onChangeText={(text) => setSelectedWalletAddress(text)}
                editable={true}
                selectTextOnFocus={true}
                keyboardType="default"
              />

              <Text style={styles.paymentText}>Amount of {symbol} to buy</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter ${symbol} Amount`}
                placeholderTextColor="#666"
                value={usdtAmount}
                keyboardType="numeric"
                onChangeText={(text) => setUsdtAmount(text)}
              />

              {destinationTag && (
                <>
                  <Text style={styles.paymentText}>Destination Tag</Text>
                  <TextInput
                    style={styles.input}
                    value={destinationTag}
                    keyboardType="numeric"
                    onChangeText={setDestinationTag}
                    editable={false}
                  />
                </>
              )}

              {/* Display calculated NGN amount */}
              <Text style={styles.paymentText}>Amount to pay in NGN</Text>
              <View style={styles.estimate}>
                <Text style={styles.estimateValue}>
                  {formatAmount(+amountInNGN)} NGN
                </Text>
              </View>
              <Text style={styles.info}>
                SwiftPay charges {cryptoData?.swiftpay_fee}% on all transactions
              </Text>

              <Button
                onPress={createOrder}
                text="Proceed"
                loadingText="Processing...."
                disabled={isLoading.createOrder}
                isLoading={isLoading.createOrder}
              />

              <Text style={styles.noteBottom}>
                The coin you buy will be sent to the wallet address above.
              </Text>
            </KAScrollView>
          )}

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
              {/* <Text style={styles.amount}>
                {cryptoData?.currency.name || name}
              </Text> */}

              <View className="mb-3">
                <Text
                  style={[styles.amount, { fontWeight: "500", fontSize: 19 }]}
                >
                  Total
                </Text>
                <Text style={styles.amount}>
                  ₦
                  {formatAmount(
                    getTotal(
                      (cryptoData?.naira_rate ?? 0) *
                        (orderDetails?.crypto_fee ?? 0),
                      orderDetails?.fee_amount!,
                      +amountInNGN
                    )
                  )}
                </Text>
              </View>
              <View style={styles.flex} className="mt-5">
                <Text style={styles.bottomSheetText}>Wallet Address</Text>
                <Text
                  style={[
                    styles.bottomSheetText,
                    { maxWidth: 200, textAlign: "right" },
                  ]}
                >
                  {walletAddress}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Network</Text>
                <Text style={styles.bottomSheetText}>{selectedNetwork}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Price in NGN</Text>
                <Text style={styles.bottomSheetText}>
                  {formatAmountMinimal(+amountInNGN)} NGN
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Crypto Amount</Text>
                <Text style={styles.bottomSheetText}>
                  {usdtAmount} {symbol}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Crypto Fees</Text>
                <Text style={styles.bottomSheetText}>
                  {orderDetails?.crypto_fee} {symbol}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>Crypto Fees in Naira</Text>
                <Text style={styles.bottomSheetText}>
                  {formatAmount(
                    (cryptoData?.naira_rate ?? 0) *
                      (orderDetails?.crypto_fee ?? 0)
                  )}{" "}
                  NGN
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetText}>SwiftPay Fees</Text>
                <Text style={styles.bottomSheetText}>
                  {formatAmount(orderDetails?.fee_amount ?? 0)} NGN
                </Text>
              </View>

              {previewError && (
                <Text className="text-danger font-medium text-[16px] text-center mt-2">
                  {previewError}
                </Text>
              )}

              <Button
                text="Continue"
                loadingText="Processing..."
                onPress={handleContinue}
                disabled={isLoading.createOrder}
                isLoading={isLoading.createOrder}
              />
            </View>
          </BottomSheet>

          {/* Network Dropdown Modal */}
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
                        setSelectedNetwork(item.value);
                        setIsDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>
                        {item.label} ({item.value})
                      </Text>
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

          {/* Transaction PIN Bottom Sheet */}
          <BottomSheet
            isVisible={isTransactionPinVisible}
            onBackdropPress={() =>
              !isLoading.submitOrder && setIsTransactionPinVisible(false)
            }
          >
            <View
              style={[
                styles.bottomSheetContent,
                { padding: 0, paddingTop: 20 },
              ]}
            >
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
                <TouchableOpacity
                  onPress={() =>
                    !isLoading.submitOrder && setIsTransactionPinVisible(false)
                  }
                  disabled={isLoading.submitOrder}
                >
                  <AntDesign
                    name="closecircleo"
                    size={20}
                    color={isLoading.submitOrder ? "#ccc" : "red"}
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
                onComplete={(pin: string) => {
                  handleConfirmPayment(pin);
                }}
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
              <Text style={styles.successBottomSheetHeader}>
                Payment Successful
              </Text>
              <Text style={styles.desc}>
                Your payment of {usdtAmount} {symbol} (₦{amountInNGN}) is
                successful
              </Text>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => {
                  setIsSuccessVisible(false);
                  router.push({
                    pathname: "/TransactionReceipt",
                    params: {
                      isCrypto: "true",
                      currentTransaction: JSON.stringify({
                        amount: usdtAmount as string,
                        recipientName:
                          userProfile?.first_name +
                          " " +
                          userProfile?.last_name,
                        senderName:
                          userProfile?.first_name +
                          " " +
                          userProfile?.last_name,
                        source: "Buy Crypto",
                        description: `Bought ${usdtAmount} ${name} for ${formatAmount(
                          +amountInNGN
                        )} NGN`,
                        nairaAmount: formatAmount(+amountInNGN),
                        date: format(
                          new Date(),
                          "yyyy-MM-dd'T'HH:mm:ss.SSS'000Z'"
                        ),
                        status: "Successful",
                        symbol: symbol,
                        transactionType: `Buy ${name} (${symbol})`,
                        walletAddress: selectedWalletAddress,
                        network: selectedNetwork,
                      }),
                    },
                  });
                }}
              >
                <Text style={styles.nextButtonText}>View Receipt</Text>
              </TouchableOpacity>
            </View>
          </BottomSheet>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 180,
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
  buyButton: {
    backgroundColor: "#1400FB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  disabledButton: {
    backgroundColor: "#8d8dff",
  },
  buyButtonText: {
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
    left: 110,
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
    marginRight: 12,
  },
  flex: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  amount: {
    textAlign: "center",
    fontSize: 23,
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
    fontSize: 15,
    color: "#1400FB",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#ffeeee",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffaaaa",
    marginVertical: 10,
  },
  errorText: {
    color: "#cc0000",
    fontSize: 14,
  },
  currencyDetails: {
    paddingHorizontal: 4,
  },
  limitText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});

export default BuyBtc;
