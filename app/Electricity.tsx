import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import KAScrollView from "@/components/ui/KAScrollView";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast } from "@/components/ui/Toast";
import { DEFAULT_PIN, IS_ANDROID_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { apiService, ElectricityHistoryData } from "@/services/api";
import copyToClipboard, { formatAmount, formatBalance } from "@/utils";
import { formatCurrency } from "@/utils/formatters";
import { showLogs } from "@/utils/logger";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Define the type for the provider
interface Provider {
  id: number;
  name: string;
  code: string;
  status: string;
  logo?: string;
}

interface VerificationResponse {
  customer: {
    customer_id: string;
    customer_name: string;
    customer_address: string;
  };
}

const Electricity = () => {
  // Use the Provider type for the selectedProvider state
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  ); // Allow null or a provider object
  const [isModalVisible, setModalVisible] = useState(false);
  const [user, setuser] = useState<any>();
  const [selectedTab, setSelectedTab] = useState("Prepaid");
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bundles, setBundles] = useState<number[]>([]);
  const [history, setHistory] = useState<ElectricityHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPinContainer, setShowPinContainer] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [verifiedCustomer, setVerifiedCustomer] = useState<
    VerificationResponse["customer"] | null
  >(null);
  const [purchaseToken, setPurchaseToken] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const { displayLoader, hideLoader, verifyPin, getUserProfile } = useAuth();

  const providerIcons: Record<string, { uri: string }> = {
    "aba-electric": {
      uri: "https://abapower.com/wp-content/uploads/2022/11/cropped-APLE-Logo.png",
    },
    "benin-electric": {
      uri: "https://beninelectric.com/wp-content/uploads/2022/10/BEDC-Logo-new-dark-1.png",
    },
    "enugu-electric": {
      uri: "https://res.cloudinary.com/dwdsjbetu/image/upload/v1749236417/download_bmsabw.jpg",
    },
    "yola-electric": {
      uri: "https://www.yedc.com.ng/assets/images/logo.png",
    },
    "abuja-electric": {
      uri: "https://www.abujaelectricity.com/wp-content/uploads/2024/01/aedc_logo_02.png",
    },
    "eko-electric": {
      uri: "https://ekedp.com/front/assets/images/resources/logo-1.png",
    },
    "ibadan-electric": {
      uri: "https://www.ibedc.com/assets/img/logo.png",
    },
    "ikeja-electric": {
      uri: "https://www.ikejaelectric.com/wp-content/uploads/2020/05/Ikeja-Electric-Logo-new-1.png",
    },
    "jos-electric": {
      uri: "https://jedplc.com/img/jed-logo.png",
    },
    "kaduna-electric": {
      uri: "https://kadunaelectric.com/wp-content/uploads/2024/12/logo_no_bg-1.png",
    },
    "kano-electric": {
      uri: "https://kedcoerp.com/files/ERPBannerx200.png",
    },
    "portharcourt-electric": {
      uri: "https://phed.com.ng/assets/image001.png",
    },
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDropdown(false);
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

  // const handleConfirmPayment = () => {
  //   handlePurchase();
  // };

  // const handleContinue = () => {
  //   console.log("confirm..");
  //   setModalVisible(false);
  //   setIsTransactionPinVisible(true);
  // };

  // Fetch providers and bundles on component mount
  useEffect(() => {
    fetchProviders();
    fetchHistory();
    getUser();
  }, []);

  const fetchProviders = async () => {
    try {
      displayLoader();
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(
        "https://swiftpaymfb.com/api/bills/electricity",
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch providers");

      const data = await response.json();
      // showLogs("providers", data.data.providers);
      const enhancedProviders = data.data.providers.map((provider: any) => ({
        ...provider,
        logo: providerIcons[provider.code]?.uri ?? null,
      }));
      // setProviders(data.data.providers);
      setProviders(enhancedProviders);
      const filteredBundles = data.data.bundles.filter(
        (bundle: number) => bundle >= 1000
      );
      setBundles(filteredBundles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      hideLoader();
    }
  };

  async function fetchHistory() {
    try {
      const response = await apiService.getElectricityHistory();
      // showLogs("history", response.data);
      setHistory(response.data);
    } catch (error) {
      showLogs("history error", error);
    }
  }

  async function getUser() {
    let data = await AsyncStorage.getItem("UserDetails");

    setuser(JSON.parse(data ? data : ""));
  }

  // useEffect(() => {
  //   meterNumber.length > 9 ? verifyCustomer() : null;
  // }, [meterNumber]);

  const verifyCustomer = async () => {
    if (!selectedProvider) {
      return showErrorToast({
        title: "No provider selected",
        desc: "Please select a Provider",
      });
    }

    setIsLoading(true);
    displayLoader();
    try {
      const token = await SecureStore.getItemAsync("userToken");
      console.log(selectedProvider.code, selectedTab);

      const response = await fetch(
        `https://swiftpaymfb.com/api/bills/electricity/verify-customer?provider_code=${
          selectedProvider.code
        }&meter_number=${meterNumber}&package=${selectedTab.toLowerCase()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const customer = await response.json();
      showLogs("customer", customer);

      setVerifiedCustomer(customer.data.data);
    } catch (err) {
      console.log(err);
      showErrorToast({
        title: "Verification failed",
        desc: "We could not find any customer with that meter number",
      });
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const handlePurchase = async (pin: string) => {
    // setShowPinContainer(false);
    // setPurchaseToken("5345636652356");
    // setIsSuccessVisible(true);
    // return;
    if (!selectedProvider || !meterNumber || !amount) return;

    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    setError("");
    setIsLoading(true);
    setShowPinContainer(false);
    displayLoader();

    try {
      const token = await SecureStore.getItemAsync("userToken");

      const payload = {
        meter_number: meterNumber,
        provider_code: selectedProvider.code,
        package: selectedTab.toLowerCase(),
        phone: user.phone,
        pin,
        amount: parseInt(amount),
        customer_name: verifiedCustomer?.customer_name,
        customer_address: verifiedCustomer?.customer_address,
      };

      const response = await axios.post(
        "https://swiftpaymfb.com/api/bills/electricity/buy",
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showLogs("handlePurchase response", response);

      const purchaseData = response.data;
      showLogs("handlePurchase data", {
        purchaseData,
      });

      getUserProfile();
      setPurchaseToken(purchaseData.data.data.token);

      setTimeout(() => {
        setIsSuccessVisible(true);
      }, 500);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Purchase failed";

      showErrorToast({
        title: "Purchase failed",
        desc:
          errorMessage ||
          "Ensure all fields are filled and a customer is found with that meter number",
      });
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const renderProviderDropdown = () => {
    if (!providers || providers.length === 0) {
      return (
        <View style={styles.emptyDropdownContainer}>
          <Text style={styles.dropdownText}>
            {isLoading ? "Loading providers..." : "No providers available"}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.dropdownContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carouselScroll}
          contentContainerStyle={styles.carouselContent}
        >
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={[
                styles.carouselItem,
                selectedProvider?.id === provider.id &&
                  styles.selectedCarouselItem,
              ]}
              onPress={() => handleProviderSelect(provider)}
            >
              {provider.logo ? (
                <Image
                  source={{ uri: provider.logo }}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 50,
                    objectFit: "fill",
                    marginBottom: 5,
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.providerIcon,
                    selectedProvider?.id === provider.id &&
                      styles.selectedProviderIcon,
                  ]}
                >
                  <Text
                    style={[
                      styles.providerInitial,
                      selectedProvider?.id === provider.id &&
                        styles.selectedProviderInitial,
                    ]}
                  >
                    {provider.name.charAt(0)}
                  </Text>
                </View>
              )}

              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    selectedProvider?.id === provider.id &&
                      styles.selectedProviderName,
                  ]}
                >
                  {provider.name}
                </Text>
                <Text
                  style={[
                    styles.providerStatus,
                    {
                      color: provider.status === "active" ? "#0FA078" : "#666",
                    },
                  ]}
                >
                  {provider.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderBundleButtons = () => {
    if (!bundles || bundles.length === 0) {
      return (
        <View style={styles.tabButtonRow}>
          <View style={styles.tabbutton}>
            <Text>₦ 0.00</Text>
          </View>
          <View style={styles.tabbutton}>
            <Text>₦ 0.00</Text>
          </View>
          <View style={styles.tabbutton}>
            <Text>₦ 0.00</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabButtonRow}>
        {bundles.map((bundle) => (
          <TouchableOpacity
            key={bundle}
            style={styles.tabbutton}
            onPress={() => setAmount(bundle.toString())}
          >
            <Text>₦ {bundle.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View className="mx-2">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <AntDesign name="arrowleft" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Electricity</Text>
        </View>

        <KAScrollView styles={{ paddingBottom: 100 }}>
          {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {selectedTab === "Prepaid" ? (
            <View>
              <View style={styles.cardContainer}>
                <Text className="font-medium text-[17px] mb-3">
                  Service Prepaid Provider
                </Text>
                <TouchableOpacity
                  style={styles.electricityHeader}
                  onPress={() => {
                    setShowDropdown(!showDropdown);
                    setVerifiedCustomer(null);
                    setMeterNumber("");
                  }}
                >
                  <View style={styles.subHeader}>
                    <Image
                      source={
                        selectedProvider?.logo
                          ? selectedProvider.logo
                          : require("../assets/energy.png")
                      }
                      style={styles.icon}
                    />
                    <Text style={[styles.dropdownLabel, { maxWidth: 200 }]}>
                      {selectedProvider
                        ? selectedProvider.name
                        : "Select Provider"}
                    </Text>
                  </View>
                  <Entypo
                    style={{ right: 10, marginTop: -10 }}
                    name={
                      showDropdown ? "chevron-small-up" : "chevron-small-down"
                    }
                    size={20}
                  />
                </TouchableOpacity>

                {showDropdown && renderProviderDropdown()}

                {/* Header Buttons */}
                {/* Header Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.prepaidButton}
                    onPress={() => {
                      setSelectedTab("Prepaid");
                      setVerifiedCustomer(null);
                      setMeterNumber("");
                    }}
                  >
                    <Text style={styles.prepaidButtonText}>Prepaid</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.postpaidButton}
                    onPress={() => {
                      setSelectedTab("Postpaid");
                      setVerifiedCustomer(null);
                      setMeterNumber("");
                    }}
                  >
                    <Text style={styles.postpaidButtonText}>Postpaid</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.meterContainer}>
                <View style={styles.row1}>
                  <Text className="font-medium text-[17px]">Meter Number</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowHistory(true)}
                    style={styles.row2}
                  >
                    <Text className="font-medium text-swiftPayBlue">
                      Beneficiaries
                    </Text>
                    <Entypo
                      name="chevron-small-down"
                      size={15}
                      color="#1400FB"
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Enter meter number"
                  style={styles.input}
                  value={meterNumber}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    setMeterNumber(text);
                    setVerifiedCustomer(null);
                  }}
                />

                {!verifiedCustomer && (
                  <Button
                    text="Verify Customer"
                    smallText
                    disabled={!meterNumber}
                    onPress={verifyCustomer}
                    classNames="w-auto self-end p-3"
                  />
                )}

                {verifiedCustomer && (
                  <View className="mb-6 bg-gray-100 p-3 rounded-lg pr-10 mt-5">
                    <View className="mb-4">
                      <Text className="text-gray-300 text-[16px]">
                        Customer Name
                      </Text>
                      <Text className="font-semibold text-[16px]">
                        {verifiedCustomer?.customer_name}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-300 text-[16px]">
                        Customer Address
                      </Text>
                      <Text className="font-semibold text-[16px]">
                        {verifiedCustomer?.customer_address}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.amountContainer}>
                <Text className="font-medium text-[17px] mb-3">Amount</Text>
                {/* {renderBundleButtons()} */}
                <View>
                  <View style={styles.tabButtonContainer}>
                    {bundles?.map((bundle) => (
                      <TouchableOpacity
                        key={bundle}
                        style={[
                          styles.tabsbutton,
                          Number(bundle) == Number(amount)
                            ? { borderWidth: 1, borderColor: "blue" }
                            : null,
                        ]}
                        onPress={() => setAmount(bundle.toString())}
                      >
                        <Text className="text-[14px] font-medium">
                          ₦ {formatAmount(bundle)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.amountInputContainer}>
                    <Text className="text-[17px] font-bold">₦</Text>
                    <TextInput
                      placeholder="Enter Amount"
                      style={styles.amountInput}
                      keyboardType="numeric"
                      onChangeText={setAmount}
                      value={amount}
                    />
                  </View>
                </View>
                <Button
                  text="Pay"
                  onPress={toggleModal}
                  disabled={!selectedProvider || !meterNumber || !amount}
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.cardContainer}>
                <Text className="font-medium text-[17px] mb-3">
                  Service Postpaid Provider
                </Text>
                <TouchableOpacity
                  style={styles.electricityHeader}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <View style={styles.subHeader}>
                    <Image
                      source={
                        selectedProvider?.logo
                          ? selectedProvider.logo
                          : require("../assets/energy.png")
                      }
                      style={styles.icon}
                    />
                    <Text style={[styles.dropdownLabel, { maxWidth: 200 }]}>
                      {selectedProvider
                        ? selectedProvider.name
                        : "Select Provider"}
                    </Text>
                  </View>
                  <Entypo
                    style={{ right: 10 }}
                    name={
                      showDropdown ? "chevron-small-up" : "chevron-small-down"
                    }
                    size={20}
                  />
                </TouchableOpacity>

                {showDropdown && renderProviderDropdown()}

                {/* Header Buttons */}
                {/* Header Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#f5f5f5",
                      padding: 10,
                      paddingHorizontal: 40,
                      borderRadius: 10,
                    }}
                    onPress={() => {
                      setSelectedTab("Prepaid");
                      setVerifiedCustomer(null);
                      setMeterNumber("");
                    }}
                  >
                    <Text
                      style={{
                        color: "#000",
                      }}
                    >
                      Prepaid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: "#F0F4F3",
                      padding: 10,
                      paddingHorizontal: 40,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#0FA078",
                    }}
                    onPress={() => {
                      setSelectedTab("Postpaid");
                      setVerifiedCustomer(null);
                      setMeterNumber("");
                    }}
                  >
                    <Text
                      style={{
                        color: "#0fa078",
                      }}
                    >
                      Postpaid
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.meterContainer}>
                <View style={styles.row1}>
                  <Text className="font-medium text-[17px]">Meter Number</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowHistory(true)}
                    style={styles.row2}
                  >
                    <Text className="font-medium text-swiftPayBlue">
                      Beneficiaries
                    </Text>
                    <Entypo
                      name="chevron-small-down"
                      size={15}
                      color="#1400FB"
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Enter meter number"
                  style={styles.input}
                  value={meterNumber}
                  onChangeText={setMeterNumber}
                />

                {!verifiedCustomer && (
                  <Button
                    text="Verify Customer"
                    smallText
                    disabled={!meterNumber}
                    onPress={verifyCustomer}
                    classNames="w-auto self-end p-3"
                  />
                )}

                {verifiedCustomer && (
                  <View className="mb-6 bg-gray-100 p-3 rounded-lg pr-10 mt-5">
                    <View className="mb-4">
                      <Text className="text-gray-300 text-[16px]">
                        Customer Name
                      </Text>
                      <Text className="font-semibold text-[16px]">
                        {verifiedCustomer?.customer_name}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-300 text-[16px]">
                        Customer Address
                      </Text>
                      <Text className="font-semibold text-[16px]">
                        {verifiedCustomer?.customer_address}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.amountContainer}>
                <Text className="font-medium text-[17px] mb-3">Amount</Text>
                {/* {renderBundleButtons()} */}
                <View>
                  {/* First row */}
                  <View style={styles.tabButtonRow}>
                    {bundles?.slice(0, 3).map((bundle) => (
                      <TouchableOpacity
                        key={bundle}
                        style={styles.tabbutton}
                        onPress={() => setAmount(bundle.toString())}
                      >
                        <Text>₦ {bundle.toFixed(2)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Second row */}
                  <View style={[styles.tabButtonRow, { marginTop: 10 }]}>
                    {bundles?.slice(3, 6).map((bundle) => (
                      <TouchableOpacity
                        key={bundle}
                        style={[
                          styles.tabbutton,
                          Number(bundle) == Number(amount)
                            ? { borderWidth: 1, borderColor: "blue" }
                            : null,
                        ]}
                        onPress={() => setAmount(bundle.toString())}
                      >
                        <Text>₦ {bundle.toFixed(2)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.amountInputContainer}>
                    <Text className="text-[20px] font-bold">₦</Text>
                    <TextInput
                      placeholder="Enter Amount"
                      style={styles.amountInput}
                      keyboardType="numeric"
                      onChangeText={setAmount}
                      value={amount}
                    />
                  </View>
                </View>
                <Button
                  text="Pay"
                  onPress={toggleModal}
                  disabled={!selectedProvider || !meterNumber || !amount}
                />
              </View>
            </View>
          )}
        </KAScrollView>

        <BottomSheet
          isVisible={showHistory}
          onBackdropPress={() => setShowHistory(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={[styles.bottomSheetTitle, { fontWeight: "600" }]}>
                Beneficiaries
              </Text>
            </View>

            <View className="-mt-4">
              <FlatList
                data={history}
                keyExtractor={(history) => history.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: provider, index }) => (
                  <Animated.View entering={FadeInDown.delay(200 * index + 1)}>
                    <TouchableOpacity
                      onPress={() => {
                        setVerifiedCustomer({
                          customer_id: provider.meter_number,
                          customer_address: provider.customer_address,
                          customer_name: provider.customer_name,
                        });
                        const currentProvider = providers.find(
                          (p) => p.code === provider.provider_code
                        );
                        handleProviderSelect(currentProvider!);
                        setMeterNumber(provider.meter_number);
                        setShowHistory(false);
                      }}
                    >
                      <Card>
                        <Text className="text-[17px] font-medium">
                          {provider.provider_name}
                        </Text>
                        <Text className="text-gray-200 text-[15px] mt-2">
                          {provider.customer_name} .{provider.meter_number} .{" "}
                          {provider.package_code}
                        </Text>
                      </Card>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                ListEmptyComponent={() => (
                  <View className="flex items-center justify-center mt-5 mb-6">
                    <Image
                      source={require("../assets/Bills/electricity.png")}
                      style={{
                        height: 100,
                        width: 100,
                      }}
                    />
                    <Text className="text-gray-200 mt-6 font-semibold text-[17px]">
                      No beneficiaries yet
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={showPinContainer}
          onBackdropPress={() => setShowPinContainer(false)}
        >
          <View style={(styles.bottomSheetContent, { padding: 0 })}>
            {error && (
              <Text className="text-danger font-medium text-[16px] text-center mt-2">
                {error}
              </Text>
            )}

            <PinComponent
              onComplete={(pin: string) => handlePurchase(pin)}
              setModalState={setShowPinContainer}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle2}>Payment</Text>
            </View>
            <Text style={styles.amount}>₦{formatCurrency(Number(amount))}</Text>

            <View style={styles.flex}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.bottomSheetText}>
                ₦{formatCurrency(Number(amount))}
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Package</Text>
              <Text style={styles.bottomSheetText}>{selectedTab}</Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Meter Number</Text>
              <Text style={styles.bottomSheetText}>{meterNumber}</Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Provider</Text>
              <Text style={styles.bottomSheetText}>
                {selectedProvider?.code}
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Customer Name</Text>
              <Text style={styles.bottomSheetText}>
                {" "}
                {verifiedCustomer?.customer_name}
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Customer Address</Text>
              <Text style={[styles.bottomSheetText, { maxWidth: 200 }]}>
                {" "}
                {verifiedCustomer?.customer_address}
              </Text>
            </View>

            <View
              className="mb-6 p-3 rounded-lg pr-10 mt-5"
              style={{ backgroundColor: "#ebf5ff" }}
            >
              <View>
                <Text className="text-[17px] mb-4 font-semibold">
                  Payment Method
                </Text>
                <Text className="text-[15px] mb-1">SwiftPay Balance</Text>
                <Text className="text-swiftPayBlue text-[20px] font-bold">
                  ₦{formatBalance(user?.wallet_balance)}
                </Text>
              </View>
            </View>

            <Button
              text="Confirm"
              onPress={() => {
                setModalVisible(false);
                setShowPinContainer(true);
              }}
              classNames="mb-5"
            />
          </View>
        </BottomSheet>

        {/* <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
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
        </BottomSheet> */}

        <BottomSheet
          isVisible={isSuccessVisible}
          onBackdropPress={() => {
            setIsSuccessVisible(false);
            router.back();
          }}
        >
          <View style={styles.bottomSheetContent}>
            <Image
              source={require("../assets/icons/success.png")}
              style={styles.logo}
            />
            <Text style={styles.successBottomSheetHeader}>
              Purchase Successful
            </Text>

            {purchaseToken ? (
              <View className="flex-row items-center gap-1 justify-center">
                <Text style={styles.desc}>Token: {purchaseToken}</Text>
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color="black"
                  onPress={() => copyToClipboard(purchaseToken, "Token")}
                />
              </View>
            ) : (
              <Text style={styles.desc}>
                Purchase is processing. You'll receive your token soon in your
                email.
              </Text>
            )}

            <Button
              onPress={() => {
                setIsSuccessVisible(false);
                router.push("/BillReceipt");
              }}
              text="View Receipt"
              classNames="pt-6"
            />
          </View>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
};

export default Electricity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
    marginTop: IS_ANDROID_DEVICE ? 50 : 10,
  },
  backButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  icon2: {
    width: 30,
    height: 30,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 5,
  },
  cardContainer: {
    backgroundColor: "#fff",
    padding: 10,
    flexDirection: "column",
    borderRadius: 15,
    marginBottom: 20,
  },
  meterContainer: {
    backgroundColor: "#fff",
    padding: 15,
    flexDirection: "column",
    borderRadius: 15,
    marginBottom: 20,
  },
  electricityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 13,
    backgroundColor: "#F0F4F3",
    borderRadius: 12,
  },
  subHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  prepaidButton: {
    backgroundColor: "#F0F4F3",
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0FA078",
  },
  prepaidButtonText: {
    color: "#0fa078",
  },
  postpaidButton: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  postpaidButtonText: {
    color: "#555",
  },
  row1: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
  },
  input: {
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#f5f5f5",
  },
  amountContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
  },
  tabbutton: {
    backgroundColor: "#f5f5f5",
    width: 90,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 15,
  },
  tabButtonRow: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  tabButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  tabsbutton: {
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },

  label: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    marginBottom: 20,
  },
  amountInput: {
    padding: 8,
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  payButton: {
    backgroundColor: "#0000ff",
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: -10,
  },
  dropdownContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  emptyDropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginTop: 10,
    padding: 20,
    alignItems: "center",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  selectedDropdownItem: {
    backgroundColor: "#F0F4F3",
  },
  providerIconContainer: {
    marginRight: 15,
  },
  providerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F4F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedProviderIcon: {
    backgroundColor: "#0FA078",
  },
  providerInfo: {
    alignItems: "center",
    width: "100%",
  },
  providerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  selectedProviderName: {
    color: "#0FA078",
  },
  providerStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  providerInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0FA078",
  },
  selectedProviderInitial: {
    color: "#fff",
  },
  dropdownText: {
    textAlign: "center",
    color: "#666",
    padding: 10,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tabButton: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: "#0FA078",
  },
  tabButtonText: {
    color: "#555",
  },
  activeTabButtonText: {
    color: "#fff",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 1,
  },
  amount: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#0000ff",
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "700",
  },
  bottomSheetTitle2: {
    fontSize: 15,
    fontWeight: "bold",
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
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
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
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

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  loadingText: {
    textAlign: "center",
    marginVertical: 10,
    color: "#666",
  },
  carouselScroll: {
    flexGrow: 0,
    paddingVertical: 5,
  },

  carouselContent: {
    paddingHorizontal: 10,
  },

  carouselItem: {
    width: 150,
    marginRight: 12,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "transparent",
  },

  selectedCarouselItem: {
    borderColor: "#0FA078",
    backgroundColor: "#F0F4F3",
  },
});
