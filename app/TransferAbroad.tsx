import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import KAScrollView from "@/components/ui/KAScrollView";
import PinComponent from "@/components/ui/PinComponent";
import { showLogs } from "@/utils/logger";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheet } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { apiService, TransferAbroadRequest } from "../services/api";
import { _TSFixMe, cn, formatAmount, getErrorMessage } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import { showErrorToast } from "@/components/ui/Toast";

const TransferAbroad = () => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // API data states
  const [fixedFee, setFixedFee] = useState(0);
  const [percentageFee, setPercentageFee] = useState(0);
  const [currencyOptions, setCurrencyOptions] = useState<{
    [key: string]: string[];
  }>({});
  const [currencyLogos, setCurrencyLogos] = useState<{ [key: string]: string }>(
    {}
  );
  const [domiciliaryBanks, setDomiciliaryBanks] = useState<{
    [key: string]: string;
  }>({});
  const [transferRates, setTransferRates] = useState<
    Array<{
      id: number;
      currency: string;
      rate: number;
      fixed_fee: number;
      percentage_fee: number;
      created_at: string;
      updated_at: string;
    }>
  >([]);

  // Form data states
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [description, setDescription] = useState("");
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [streetName, setStreetName] = useState("");
  const [streetNumber, setStreetNumber] = useState("");

  const { cryptoName, price, quantity, limits } = useLocalSearchParams();

  const [isCurrencyDropdownVisible, setCurrencyDropdownVisible] =
    useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({
    name: "USD",
    icon: require("../assets/icons/dollar.png"),
  });

  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isCountryDropdownVisible, setCountryDropdownVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: "Nigeria (domiciliary account)",
  });
  const [isNigeriaSelected, setIsNigeriaSelected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBankDropdownVisible, setBankDropdownVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState({
    name: "Select Bank",
    code: "",
  });
  const [banksList, setBanksList] = useState<{ name: string; code: string }[]>(
    []
  );
  const [countries, setCountries] = useState<{ name: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ name: string; icon: any }[]>(
    []
  );
  const { displayLoader, hideLoader, verifyPin, getUserProfile, user } =
    useAuth();

  useEffect(() => {
    fetchTransferData();
  }, []);

  const fetchTransferData = async () => {
    try {
      setInitialLoading(true);
      const response = await apiService.getTransferAbroadPage();
      // showLogs("getTransferAbroadPage response", response);

      if (response.status === "success" && response.data) {
        setFixedFee(response.data.fixed_fee);
        setPercentageFee(response.data.percentage_fee);
        setCurrencyOptions(response.data.currencies);
        setCurrencyLogos(response.data.currency_logos);
        setDomiciliaryBanks(response.data.domiciliary_banks);
        setTransferRates(response.data.int_transfer_rates as _TSFixMe);

        // Process the currency data
        const currencyArr = Object.keys(response.data.currencies).map(
          (key) => ({
            name: key,
            icon:
              response.data.currency_logos[key] ||
              require("../assets/icons/dollar.png"),
          })
        );
        setCurrencies(currencyArr);

        // Set initial selected currency if available
        if (currencyArr.length > 0) {
          setSelectedCurrency(currencyArr[0]);
        }

        // Process the countries data
        const countryArr: { name: string }[] = [];
        Object.keys(response.data.currencies).forEach((currency) => {
          response.data.currencies[currency].forEach((country) => {
            countryArr.push({ name: country });
          });
        });
        setCountries(countryArr);

        // Set initial selected country if available
        if (countryArr.length > 0) {
          setSelectedCountry(countryArr[0]);
          setIsNigeriaSelected(
            countryArr[0].name === "Nigeria (domiciliary account)"
          );
        }

        // Process the banks data
        const banksArr = Object.entries(response.data.domiciliary_banks).map(
          ([code, name]) => ({ code, name: name as string })
        );
        setBanksList(banksArr);

        // Set initial selected bank if available
        if (banksArr.length > 0) {
          setSelectedBank({ name: banksArr[0].name, code: banksArr[0].code });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load transfer data",
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "An unknown error occurred",
        });
      }

      // Fallback to default values
      setCurrencies([
        { name: "USD", icon: require("../assets/icons/dollar.png") },
        { name: "EUR", icon: require("../assets/icons/euro.png") },
        { name: "GBP", icon: require("../assets/icons/pounds.png") },
      ]);

      setCountries([
        { name: "Nigeria (domiciliary account)" },
        { name: "US" },
        { name: "UK" },
        { name: "Europe" },
      ]);

      setBanksList([
        { name: "First City Monument Bank", code: "214" },
        { name: "Providus Bank", code: "101" },
        { name: "Other Banks", code: "044" },
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  // Get the current rate for the selected currency
  const getCurrentRate = () => {
    const rate = transferRates.find(
      (r) => r.currency === selectedCurrency.name
    );
    return rate ? rate.rate : 0;
  };

  // Calculate naira amount when amount or selected currency changes
  useEffect(() => {
    const calculateNairaAmount = () => {
      if (!amount || isNaN(parseFloat(amount))) return;

      const amountValue = parseFloat(amount);
      const currentRate = getCurrentRate();

      // Calculate the amount in naira based on the transfer rate
      const nairaAmount = amountValue * currentRate;

      // Calculate fee based on API percentage and fixed fee
      const fee = nairaAmount * (percentageFee / 100) + fixedFee;

      setTotalFee(fee);
      setCalculatedAmount(nairaAmount + fee);
    };

    calculateNairaAmount();
  }, [amount, selectedCurrency, percentageFee, fixedFee, transferRates]);

  const handleCurrencySelect = (currency: { name: string; icon: any }) => {
    setSelectedCurrency(currency);
    setCurrencyDropdownVisible(false);

    // Update countries available for the selected currency
    if (currencyOptions[currency.name]) {
      const newCountries = currencyOptions[currency.name].map((name) => ({
        name,
      }));
      setCountries(newCountries);

      // Reset selected country to first in the list
      if (newCountries.length > 0) {
        setSelectedCountry(newCountries[0]);
        setIsNigeriaSelected(
          newCountries[0].name === "Nigeria (domiciliary account)"
        );
      }
    }
  };

  const handleCountrySelect = (country: { name: string }) => {
    setSelectedCountry(country);
    setCountryDropdownVisible(false);
    setIsNigeriaSelected(country.name === "Nigeria (domiciliary account)");
  };

  const handleBankSelect = (bank: { name: string; code: string }) => {
    setSelectedBank(bank);
    setBankDropdownVisible(false);
  };

  const handleReview = () => {
    // Validate required fields
    if (
      !amount ||
      !accountNumber ||
      !bankName ||
      !accountName ||
      !swiftCode ||
      !routingNumber
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill all required fields",
      });
      return;
    }

    // Show preview bottom sheet
    setIsPreviewVisible(true);
  };

  const handlePay = () => {
    setIsPreviewVisible(false); // Hide the preview bottom sheet
    setIsTransactionPinVisible(true); // Show the transaction pin bottom sheet
  };

  const handleConfirmPayment = async (pin: string) => {
    setError(null);

    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    try {
      setLoading(true);
      displayLoader();
      setIsTransactionPinVisible(false);

      const parsedAmount = parseFloat(amount);

      // Prepare request data
      const requestData: TransferAbroadRequest = {
        amount: parsedAmount,
        total_fee: totalFee,
        total_amount: calculatedAmount,
        account_number: accountNumber,
        account_name: accountName,
        bank_name: bankName,
        swift_code: swiftCode,
        routing_number: routingNumber,
        selectedCurrency: selectedCurrency.name,
        country: selectedCountry.name,
        description: description || "International transfer",
        // Optional address details can be added if needed
        pin: +pin,
        city,
        postal_code: postalCode,
        street_name: streetName,
        street_number: streetNumber,
      };

      const response = await apiService.transferMoneyAbroad(requestData);

      if (response.status === "success") {
        // Store transaction details for receipt
        const transactionDetails = {
          recipientName: accountName,
          bankName: bankName,
          accountNumber: accountNumber,
          amount: parsedAmount,
          fee: totalFee,
          total: calculatedAmount,
          currency: selectedCurrency.name,
          reference: response.data?.reference || "",
          date: new Date().toISOString(),
          status: "SUCCESS",
        };

        await AsyncStorage.setItem(
          "lastTransaction",
          JSON.stringify(transactionDetails)
        );

        getUserProfile();
        setIsTransactionPinVisible(false);
        setIsSuccessVisible(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Transfer Failed",
          text2:
            response.message ||
            "An error occurred while processing your transfer",
        });
      }
    } catch (error: any) {
      showLogs("error", error.response);

      const firstErrorMessage = getErrorMessage(error);

      if (error instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Transfer Failed",
          text2: firstErrorMessage || error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Transfer Failed",
          text2: "An unknown error occurred",
        });
      }
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    // Set OTP value at the current index
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to the next input
    if (text && index < 3) {
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

  function getNGNAmount() {
    const rateByCurrency = transferRates.find(
      (item) => item.currency === selectedCurrency.name
    )?.rate;
    return +amount * (rateByCurrency ?? 0);
  }

  function getIntlFee() {
    const currentCurrency = transferRates.find(
      (item) => item.currency === selectedCurrency.name
    );

    return (
      (currentCurrency?.fixed_fee ?? 0) +
      (currentCurrency?.percentage_fee! / 100) * +amount
    );
  }

  function getTotal() {
    const currentCurrency = transferRates.find(
      (item) => item.currency === selectedCurrency.name
    );
    const totalIntlFee = getIntlFee();
    const totalIntlFeeInNaira = totalIntlFee * (currentCurrency?.rate ?? 0);
    const totalNGN = getNGNAmount();
    const swiftPayFee = totalFee;

    return totalIntlFeeInNaira + totalNGN + swiftPayFee;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LoadingComp visible={loading} />
      <View className={cn(IS_IOS_DEVICE ? "mx-5" : "pt-12")}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Transfer Abroad</Text>
          <View style={styles.placeholder} />
        </View>

        <KAScrollView>
          <Text style={styles.headline}>Transaction Information</Text>
          {/* Info Note */}
          <Text style={styles.note}>
            Note: Ensure you fill in the right bank details, as we would not be
            liable for any asset loss due to wrong info.
          </Text>
          {/* Address Input */}
          <Text style={styles.paymentText}>
            Amount in {selectedCurrency.name}
          </Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.input2}
              placeholder={`Enter amount`}
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.currencyPicker}
              onPress={() => setCurrencyDropdownVisible(true)}
            >
              <View style={styles.valueContainer}>
                {typeof selectedCurrency.icon === "string" ? (
                  <Image
                    source={{ uri: selectedCurrency.icon }}
                    style={styles.currencyLogo}
                  />
                ) : (
                  <Image
                    source={selectedCurrency.icon}
                    style={styles.currencyLogo}
                  />
                )}
                <Text style={styles.valueText}>{selectedCurrency.name}</Text>
                <AntDesign name="caretdown" color={"#fff"} />
              </View>
            </TouchableOpacity>
          </View>
          {/* <Text style={styles.paymentText}>Country</Text>
          <TouchableOpacity
            style={styles.countryPicker}
            onPress={() => setCountryDropdownVisible(true)}
          >
            <View style={styles.valueContainer2}>
              <Text>{selectedCountry.name}</Text>
              <AntDesign name="down" color={"#000"} size={16} />
            </View>
          </TouchableOpacity>

          <Text style={styles.sub}>
            SwiftPay charges a {percentageFee}% and ₦{fixedFee} fee on all
            transactions
          </Text> */}
          {/* {isNigeriaSelected && (
            <View style={styles.domiciliaryBanks}>
              <Text style={styles.paymentText}>Select Domiciliary Bank</Text>
              <TouchableOpacity
                style={styles.countryPicker}
                onPress={() => setBankDropdownVisible(true)}
              >
                <View style={styles.valueContainer2}>
                  <Text>{selectedBank.name}</Text>
                  <AntDesign name="down" color={"#000"} size={16} />
                </View>
              </TouchableOpacity>
              <Text style={styles.sub} className="mb-6">
                SwiftPay charges a {percentageFee}% and ₦{fixedFee} fee on all
                transactions
              </Text>
            </View>
          )} */}
          <Text style={styles.headline}>Receiver Details</Text>
          <Text style={styles.note}>
            Note: Ensure your Bank supports {selectedCurrency.name} transfer.
            {/* {isNigeriaSelected
              ? " Recommended Bank - Domiciliary Account."
              : ""} */}
          </Text>
          <Text style={styles.paymentText}>Account Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={accountName}
              onChangeText={setAccountName}
            />
          </View>
          <Text style={styles.paymentText}>Account Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholder="2345XXXXXX"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>
          <Text style={styles.paymentText}>Bank Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={bankName}
              onChangeText={setBankName}
            />
          </View>
          <Text style={styles.paymentText}>Swift Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={swiftCode}
              onChangeText={setSwiftCode}
            />
          </View>
          <Text style={styles.paymentText}>Routing Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={routingNumber}
              onChangeText={setRoutingNumber}
            />
          </View>
          <Text style={styles.paymentText}>Description</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <Text style={styles.paymentText}>City</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <Text style={styles.paymentText}>Postal Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </View>
          <Text style={styles.paymentText}>Street Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              keyboardType="default"
              value={streetName}
              onChangeText={setStreetName}
            />
          </View>
          <Text style={styles.paymentText}>Street Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholderTextColor="#666"
              value={streetNumber}
              onChangeText={setStreetNumber}
            />
          </View>
          {/* Buy Button */}
          {/* <TouchableOpacity
            style={styles.buyButton}
            onPress={handleReview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyButtonText}>Continue</Text>
            )}
          </TouchableOpacity> */}
          <Button
            text="Continue"
            isLoading={loading}
            loadingText="Processing..."
            disabled={
              !accountName.trim() ||
              !accountNumber.trim() ||
              !bankName.trim() ||
              (!routingNumber.trim() && !swiftCode.trim()) ||
              !description.trim() ||
              !city.trim() ||
              !postalCode.trim() ||
              !streetName.trim() ||
              !streetNumber.trim()
            }
            onPress={handleReview}
          />
        </KAScrollView>

        {/* Bottom Sheet for Preview */}
        <BottomSheet
          isVisible={isPreviewVisible}
          onBackdropPress={() => setIsPreviewVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Payment Preview</Text>
              <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
                <AntDesign
                  name="closecircleo"
                  size={20}
                  color={"red"}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>

            <Text className="text-center font-medium text-[20px]">Total</Text>
            <Text style={styles.amount}>₦{formatAmount(getTotal())}</Text>

            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Account Name</Text>
              <Text style={styles.bottomSheetText}>{accountName}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Bank Name</Text>
              <Text style={styles.bottomSheetText}>{bankName}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Account Number</Text>
              <Text style={styles.bottomSheetText}>{accountNumber}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Swift Code</Text>
              <Text style={styles.bottomSheetText}>{swiftCode}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Routing Number</Text>
              <Text style={styles.bottomSheetText}>{routingNumber}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Amount in NGN</Text>
              <Text style={styles.bottomSheetText}>
                ₦{formatAmount(getNGNAmount())}
              </Text>
            </View>
            {/* <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>
                Amount in {selectedCurrency.name}
              </Text>
              <Text style={styles.bottomSheetText}>
                {selectedCurrency.name === "USD"
                  ? "$"
                  : selectedCurrency.name === "EUR"
                  ? "€"
                  : "£"}
                {parseFloat(amount || "0").toFixed(2)}
              </Text>
            </View> */}
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>SwiftPay Fee</Text>
              <Text style={styles.bottomSheetText}>
                ₦{formatAmount(totalFee)}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Int'l transfer fee</Text>
              <Text style={styles.bottomSheetText}>
                {formatAmount(getIntlFee())} {selectedCurrency.name}
              </Text>
            </View>

            <View style={styles.paymentMethod}>
              <Text style={styles.title}>Payment Method</Text>
              <Text style={styles.balanceTitle}>SwiftPay Balance</Text>
              <Text style={styles.balance}>
                ₦{formatAmount(user?.wallet_balance ?? 0)}
              </Text>
            </View>
            <TouchableOpacity style={styles.buyButton} onPress={handlePay}>
              <Text style={styles.buyButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Currency Dropdown Modal */}
        {isCurrencyDropdownVisible && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={isCurrencyDropdownVisible}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={() => setCurrencyDropdownVisible(false)}
            />
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownHeaderText}>Select Currency</Text>
              {currencies.map((currency, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleCurrencySelect(currency)}
                >
                  {typeof currency.icon === "string" ? (
                    <Image
                      source={{ uri: currency.icon }}
                      style={styles.dropdownIcon}
                    />
                  ) : (
                    <Image source={currency.icon} style={styles.dropdownIcon} />
                  )}
                  <Text style={styles.dropdownText}>{currency.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Modal>
        )}

        {isCountryDropdownVisible && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={isCountryDropdownVisible}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={() => setCountryDropdownVisible(false)}
            />
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownHeaderText}>Select Country</Text>
              {countries.map((country, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.dropdownText}>{country.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Modal>
        )}

        {isBankDropdownVisible && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={isBankDropdownVisible}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={() => setBankDropdownVisible(false)}
            />
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownHeaderText}>Select bank</Text>
              {banksList.map((bank, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleBankSelect(bank)}
                >
                  <Text style={styles.dropdownText}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Modal>
        )}

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View
            style={[styles.bottomSheetContent, { padding: 0, paddingTop: 20 }]}
          >
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

            {error && (
              <Text className="text-danger font-medium text-[16px] text-center">
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
              Transfer Initiated Successfully
            </Text>
            <Text style={styles.desc}>
              Your payment to {accountName} for{" "}
              {selectedCurrency.name === "USD"
                ? "$"
                : selectedCurrency.name === "EUR"
                ? "€"
                : "£"}
              {parseFloat(amount || "0").toFixed(2)} is successful
            </Text>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                setIsSuccessVisible(false);
                router.push("/(tabs)");
              }}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 15,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    paddingBottom: 30,
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
  // ... rest of the styles remain the same
  balanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
  },
  row: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666",
  },
  balanceAmount: {
    fontSize: 24,
    color: "#000",
    fontWeight: "700",
  },
  note: {
    color: "#0000ff",
    fontSize: 13,
    marginBottom: 20,
  },
  input: {
    borderColor: "#EAEAEA",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
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
    paddingVertical: 15,
    paddingHorizontal: 5,
    fontSize: 16,
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
    marginBottom: 5,
    fontWeight: "500",
  },
  estimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: -10,
  },
  buyButton: {
    backgroundColor: "#1400FB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buyButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "medium",
  },
  noteBottom: {
    fontSize: 15,
    color: "#666",
    textAlign: "left",
    marginTop: 10,
  },
  est: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  estTitle: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
  },
  leftLine: {
    borderLeftWidth: 3,
    borderLeftColor: "#1400fb",
    paddingHorizontal: 3,
    borderRadius: 2,
  },
  balanceName: {
    color: "#666",
    fontWeight: "500",
    marginBottom: 5,
  },
  headline: {
    borderRadius: 2,
    marginBottom: 10,
    width: 160,
    fontWeight: "500",
    fontSize: 16,
    marginTop: 40,
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
    marginRight: 10,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 20,
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
  currencyLogo: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  currencyPicker: {
    backgroundColor: "#0000ff",
    flexDirection: "row",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    padding: 10,
  },
  valueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
  },
  valueContainer2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  valueText: {
    color: "#fff",
  },
  amountContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    padding: 5,
    justifyContent: "space-between",
    borderColor: "#ccc",
    marginBottom: 20,
  },
  input2: {
    flex: 1,
    paddingHorizontal: 10,
  },
  estSub: {
    color: "#888",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  dropdownContainer: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  dropdownIcon: { width: 24, height: 24, marginRight: 10 },
  dropdownText: { fontSize: 16 },
  countryPicker: {
    backgroundColor: "#fff",
    flexDirection: "row",
    borderRadius: 10,
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    paddingHorizontal: 10,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  sub: {
    color: "#555",
    marginTop: -10,
    marginBottom: -20,
    fontSize: 12,
  },
  domiciliaryBanks: {
    marginTop: 5,
  },
  paymentMethod: {
    backgroundColor: "#DFF1FC",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  balanceTitle: {
    fontSize: 14,
    color: "#555",
  },
  balance: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0000ff",
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
});

export default TransferAbroad;
