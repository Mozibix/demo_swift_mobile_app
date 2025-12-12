import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import LoadingComp from "../components/Loading";
import { formatCurrency } from "@/utils/formatters";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PinEntryBottomSheet from "../components/CustomBottomSheet";
import { showLogs } from "@/utils/logger";
import copyToClipboard, {
  _TSFixMe,
  formatAmount,
  getErrorMessage,
  navigationWithReset,
} from "@/utils";
import Button from "@/components/ui/Button";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast } from "@/components/ui/Toast";
import { apiService, CableHistoryData } from "@/services/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import Card from "@/components/ui/Card";
import { DEFAULT_PIN, IS_ANDROID_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";

interface CablePackage {
  id: number;
  cable_id: number;
  name: string;
  package_code: string;
  amount: number;
  price: number;
  created_at: Date;
  updated_at: Date;
}

interface VerifiedUserInterface {
  customer_id: string;
  customer_name: string;
  decoder_status: "ACTIVE" | "INACTIVE" | string; // Using union type for known statuses
  decoder_due_date: string; // Could be more specific if date format is consistent
}

const Tv = () => {
  const [Loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("TV");
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any | undefined>(
    undefined,
  );
  const [selectedPackage, setSelectedPackage] = useState<
    CablePackage | undefined
  >(undefined);
  const [CardNumber, setCardNumber] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [purchaseToken, setPurchaseToken] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isPlanDropdownVisible, setIsPlanDropdownVisible] = useState(false);
  const [history, setHistory] = useState<CableHistoryData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipVerification = useRef(false);
  const { verifyPin, getUserProfile, displayLoader, hideLoader } = useAuth();
  const navigation = useNavigation();

  //verified user states
  const [verifiedUser, setverifiedUser] = useState<
    VerifiedUserInterface | undefined
  >(undefined);
  const [loadingVerify, setLoadingVerify] = useState<boolean>(false);

  const networkItems = [
    { label: "Startimes", value: "Startimes" },
    { label: "DSTV", value: "DSTV" },
  ];
  const handleContinue = () => {
    if (
      (selectedProvider?.code !== "showmax" && verifiedUser == undefined) ||
      selectedPackage == undefined
    ) {
      showErrorToast({
        title: !verifiedUser
          ? "Please provide a valid smart card number"
          : "Please fill in all fields",
      });
    } else {
      setIsPreviewVisible(true);
    }
  };

  const handlePay = () => {
    setIsPreviewVisible(false);
    setIsTransactionPinVisible(true);
  };

  const providers = [
    {
      name: "DSTV",
      code: "dstv",
      logo: "https://swiftpaymfb.com/dstv.jpg",
    },
    {
      name: "StarTimes",
      code: "startimes",
      logo: "https://swiftpaymfb.com/startimes.png",
    },
    {
      name: "GOTV",
      code: "gotv",
      logo: "https://swiftpaymfb.com/gotv.jpeg",
    },
    {
      name: "Showmax",
      code: "showmax",
      logo: "https://swiftpaymfb.com/showmax.jpeg",
    },
  ];

  const plans =
    selectedTab === "TV"
      ? ["Basic", "Premium", "Family"]
      : ["1Mbps", "10Mbps", "50Mbps"];

  const handlePlanSelection = (plan: string) => {
    setSelectedPlan(plan);
    setIsPlanDropdownVisible(false);
  };

  const packages = ["Basic", "Premium", "Family"];
  const internetPackages = ["1Mbps", "10Mbps", "50Mbps"];

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleKeypadPress = (key: string) => {
    if (key === "←") {
      const newOtp = [...otp];
      const lastFilledIndex = newOtp.findIndex((digit) => digit === "");
      const indexToClear =
        lastFilledIndex === -1 ? newOtp.length - 1 : lastFilledIndex - 1;
      if (indexToClear >= 0) {
        newOtp[indexToClear] = "";
        setOtp(newOtp);
      }
    } else if (otp.join("").length < 4) {
      const newOtp = [...otp];
      const firstEmptyIndex = newOtp.findIndex((digit) => digit === "");
      if (firstEmptyIndex !== -1) {
        newOtp[firstEmptyIndex] = key;
        setOtp(newOtp);
      }
    }
  };

  const [allProviders, setAllProviders] = useState<any[]>([]);

  // const handleConfirmPayment = async () => {
  //   try {
  //     setIsTransactionPinVisible(false); // Hide the transaction pin bottom sheet
  //     setLoading(true);

  //     let userdata = await AsyncStorage.getItem("UserDetails");
  //     let user = userdata ? JSON.parse(userdata) : null;

  //     let intigrate = await axios({
  //       url: `https://swiftpaymfb.com/api/bills/cable/buy`,
  //       method: "post",
  //       headers: {
  //         Authorization: `Bearer ${await SecureStore.getItemAsync(
  //           "userToken"
  //         )}`,
  //         "Content-Type": "application/json",
  //       },
  //       data: JSON.stringify({
  //         phone: user.phone,
  //         provider_code: selectedProvider.code,
  //         card_number: CardNumber,
  //         package_id: selectedPackage?.id,
  //         pin: otp,
  //       }),
  //     });

  //     setIsSuccessVisible(true); // Show the success bottom sheet
  //   } catch (err: any) {
  //     Toast.show({
  //       type: "error",
  //       text1: err?.response?.data?.message || "unable to verify",
  //       text2: "Try again",
  //       position: "top",
  //     });
  //     console.log(err.response.data);
  //     setverifiedUser(undefined);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleConfirmPin = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    setIsProcessingPayment(true);

    try {
      await handleConfirmPayment(pin);
      setIsTransactionPinVisible(false);
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  async function fetchHistory() {
    try {
      const response = await apiService.getCableHistory();
      // showLogs("history", history);
      setHistory(response.data);
    } catch (error) {
      showLogs("history error", error);
    }
  }

  const handleConfirmPayment = async (pin: string) => {
    try {
      setIsTransactionPinVisible(false);
      setLoading(true);

      let userdata = await AsyncStorage.getItem("UserDetails");
      let user = userdata ? JSON.parse(userdata) : null;

      let response = await axios({
        url: `https://swiftpaymfb.com/api/bills/cable/buy`,
        method: "post",
        headers: {
          Authorization: `Bearer ${await SecureStore.getItemAsync(
            "userToken",
          )}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          phone: phoneNumber,
          provider_code: selectedProvider.code,
          card_number: CardNumber,
          package_id: selectedPackage?.id,
          customer_name: verifiedUser?.customer_name,
          pin: pin,
        }),
      });

      // showLogs("response.data", response.data);

      setPurchaseToken(response.data.data.token);
      setResponseMessage(response.data.message);

      getUserProfile();
      setIsSuccessVisible(true);
    } catch (err: any) {
      showLogs("error", err.response);
      const firstErrorMessage = getErrorMessage(err);
      showErrorToast({
        title: "An Error Occured",
        desc:
          firstErrorMessage ||
          err?.response?.data?.message ||
          "Unable to verify",
      });

      setverifiedUser(undefined);
    } finally {
      setLoading(false);
    }
  };

  async function getProviders() {
    setLoading(true);
    try {
      let response = await axios({
        url: "https://swiftpaymfb.com/api/bills/cable",
        method: "get",
        headers: {
          Authorization: `Bearer ${await SecureStore.getItemAsync(
            "userToken",
          )}`,
          "Content-Type": "application/json",
        },
      });
      // showLogs("PROVIDERS", response.data.data.providers);

      setAllProviders(response.data.data.providers);
      // console.log(response.data.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        Toast.show({
          type: "error",
          text1: "Session expired",
          text2: "You are logged out",
          position: "top",
        });
        await SecureStore.deleteItemAsync("userToken");
        router.push("/login");
      } else {
        Toast.show({
          type: "error",
          text1: "Couldnt load data",
          // text2: "You are logged out",
          position: "top",
        });
        // setError("Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (CardNumber?.length > 9) {
      if (skipVerification.current) {
        skipVerification.current = false;
        return;
      }
      verifyUserFunc();
    }
  }, [CardNumber]);

  async function verifyUserFunc() {
    setLoadingVerify(true);
    displayLoader();
    const token = await SecureStore.getItemAsync("userToken");

    try {
      let response = await axios({
        url: `https://swiftpaymfb.com/api/bills/cable/verify-customer?card_number=${CardNumber}&cable_provider_code=${selectedProvider.code}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // showLogs("verifyUser response", response);
      setverifiedUser(response.data.data);
    } catch (err: any) {
      showLogs("error", err.response);
      showErrorToast({
        title: "Could not verify number",
        desc:
          err?.response?.data?.message.trim() ||
          "Card number verification failed",
      });
      setverifiedUser(undefined);
    } finally {
      setLoadingVerify(false);
      hideLoader();
    }
  }

  useEffect(() => {
    getProviders();
    fetchHistory();
  }, []);

  // showLogs("allProviders", allProviders);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={20} />
        </TouchableOpacity>
        {/* <Text style={styles.title}>TV & Internet</Text> */}
        <Text style={styles.title}>TV</Text>
        <TouchableOpacity>
          {/* <Text style={styles.history}>History</Text> */}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {/* <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setSelectedTab("TV")}
          style={[styles.tab, selectedTab === "TV" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "TV" && styles.activeTabText,
            ]}
          >
            TV
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.navigate("/ComingSoon")} //{() => setSelectedTab("Internet")}
          style={[styles.tab, selectedTab === "Internet" && styles.activeTab]}
          // disabled={true}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Internet" && styles.activeTabText,
            ]}
          >
            Internet
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {selectedTab === "TV" ? (
          <>
            <View style={styles.selectionRow}>
              <View style={styles.flexHeader}>
                <Text style={styles.selectionLabel}>Select Provider</Text>
                {/* <TouchableOpacity onPress={() => router.push("/Beneficiaries")}>
                  <Text style={styles.beneficiaryLabel}>Beneficiaries</Text>
                </TouchableOpacity> */}
                <TouchableOpacity onPress={() => setShowHistory(true)}>
                  <Text style={styles.beneficiaryLabel}>Beneficiaries</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setProviderModalVisible(true)}
                style={styles.modalDropdown}
              >
                {selectedProvider ? (
                  <View style={styles.providerContainer}>
                    <Image
                      source={{
                        uri: providers.find(
                          (p) => p.code === selectedProvider.code,
                        )?.logo,
                      }}
                      style={styles.icon}
                      resizeMode="cover"
                    />
                    <Text>{selectedProvider.name}</Text>
                  </View>
                ) : (
                  <Text>Select Provider</Text>
                )}
                <AntDesign name="down" size={20} />
              </TouchableOpacity>
            </View>

            {/* <View style={styles.selectionRow}>
              <Text style={styles.selectionLabel}>Payment Method</Text>
              <View style={styles.paymentMethod}>
                <Text style={styles.paymentText}>30 days</Text>
              </View>
            </View> */}

            {selectedProvider?.code !== "showmax" && (
              <View>
                <Text style={styles.selectionLabel}>Smart Card Number:</Text>
                <TextInput
                  placeholder="547847GGU8"
                  style={[styles.input, { marginBottom: 0 }]}
                  value={CardNumber}
                  keyboardType="number-pad"
                  onChangeText={setCardNumber}
                  placeholderTextColor="#ccc"
                />
              </View>
            )}
            {selectedProvider?.code === "showmax" && (
              <View>
                <Text style={styles.selectionLabel}>Phone Number</Text>
                <TextInput
                  placeholder="0803 *** ****"
                  style={[styles.input, { marginBottom: 0 }]}
                  value={phoneNumber}
                  keyboardType="number-pad"
                  onChangeText={setPhoneNumber}
                  placeholderTextColor="#ccc"
                />
              </View>
            )}
            <View>
              {verifiedUser && (
                <View style={styles.recipientContainer}>
                  <View style={styles.recipientBox}>
                    <View style={styles.recipientContainer}>
                      <AntDesign name="checkcircle" size={18} color="#0000ff" />
                      <View style={styles.recipientTextContainer}>
                        <Text style={styles.recipientNameTitle}>
                          Customer Name
                        </Text>
                        <Text style={styles.recipientName} numberOfLines={2}>
                          {verifiedUser?.customer_name}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.selectionRow} className="mt-6">
              <Text style={styles.selectionLabel}>Package</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!selectedProvider) {
                    showErrorToast({
                      title: "Select Provider",
                      desc: "Please select a povider first",
                    });
                  } else {
                    setPackageModalVisible(true);
                  }
                }}
                style={styles.dropDown2}
              >
                {selectedPackage?.name ? (
                  <Text>
                    {selectedPackage?.name +
                      " " +
                      `(${formatAmount(selectedPackage?.price || 0)})` ||
                      "Please Select Package"}
                  </Text>
                ) : (
                  <Text>Please Select Package</Text>
                )}
                <AntDesign name="down" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.selectionLabel} className="mt-6">
              Amount
            </Text>
            <TextInput
              placeholder="1000"
              style={styles.input}
              keyboardType="number-pad"
              value={`N${formatCurrency(
                selectedPackage?.price ? selectedPackage?.price : 0,
              )}`}
              editable={false}
            />
            {/* <TouchableOpacity>
              <Text style={styles.beneficiaryLabel}>Save beneficiary</Text>
            </TouchableOpacity> */}
          </>
        ) : (
          <>
            <View style={styles.selectionRow}>
              <View style={styles.meterContainer}>
                <Text style={styles.label}>Provider</Text>
                <TouchableOpacity
                  style={styles.modalDropdown}
                  onPress={() => setIsDropdownVisible(true)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedNetwork || "Select Network"}
                  </Text>
                  <AntDesign name="down" size={16} color="#666" />
                </TouchableOpacity>
                <Text style={styles.selectionLabel}>Enter Hynet User Name</Text>

                <TextInput
                  placeholder="Enter hynet user name"
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Select Plan</Text>
              <TouchableOpacity
                style={styles.modalDropdown}
                onPress={() => setIsPlanDropdownVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedPlan || "Select Plan"}
                </Text>
                <AntDesign name="down" size={16} color="#666" />
              </TouchableOpacity>

              <Text style={styles.selectionLabel}>Enter Amount</Text>
              <TextInput
                placeholder="1000"
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>
          </>
        )}

        <Button
          text="Confirm"
          onPress={handleContinue}
          disabled={
            !selectedProvider ||
            !selectedPackage ||
            (!CardNumber && !phoneNumber) ||
            (selectedProvider.code !== "showmax" && !verifiedUser)
          }
        />
      </ScrollView>

      {/* Provider Modal */}
      <Modal
        visible={providerModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: "#fff" }]}>
            <Text style={[styles.modalTitles, { color: "#000" }]}>
              {selectedTab === "TV"
                ? "Select Provider"
                : "Select Internet Provider"}
            </Text>
            {/* <Picker
              style={{ color: "red" }}
              selectedValue={selectedProvider}
              onValueChange={(itemValue) => {
                setSelectedProvider(itemValue);
                setProviderModalVisible(false);
              }}
            >
              {(selectedTab === "TV" ? allProviders : internetProviders)?.map(
                (provider) => (
                  <Picker.Item
                    label={provider.name}
                    value={provider}
                    key={provider.id}
                  />
                )
              )}
            </Picker> */}

            <View style={{ height: "auto", justifyContent: "center" }}>
              <Picker
                selectedValue={selectedProvider?.id}
                onValueChange={(itemValue) => {
                  const selected = allProviders.find(
                    (p) => p.id === +itemValue,
                  );
                  showLogs("selected", selected);
                  setSelectedProvider(selected);
                  setSelectedPackage(undefined);
                  setProviderModalVisible(false);
                }}
                itemStyle={{ color: "#000" }}
              >
                {allProviders?.map((provider) => (
                  <Picker.Item
                    label={provider.name}
                    value={provider.id}
                    key={provider.id}
                  />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              onPress={() => setProviderModalVisible(false)}
              style={styles.modalClose}
            >
              <Text style={[styles.modalCloseText, { color: "#000" }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={packageModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: "white" }]}>
            <Text style={[styles.modalTitles, { color: "#000" }]}>
              {selectedTab === "TV" ? "Select Package" : "Select Package"}
            </Text>
            {/* <Picker
              itemStyle={{ color: "#000" }}
              selectedValue={selectedPackage}
              onValueChange={(itemValue) => {
                setSelectedPackage(itemValue);
                console.log({itemValue});
                setPackageModalVisible(false);
              }}
            >
              {(selectedTab === "TV"
                ? selectedProvider?.packages
                : internetProviders
              )?.map((provider: any) => (
                <Picker.Item
                  label={provider.name}
                  value={provider}
                  key={provider.id}
                />
              ))}
            </Picker> */}

            <Picker
              itemStyle={{ color: "#000" }}
              selectedValue={selectedPackage?.id}
              onValueChange={(itemValue) => {
                const selected = selectedProvider?.packages.find(
                  (p: _TSFixMe) => p?.id === +itemValue,
                );
                setSelectedPackage(selected);
                setPackageModalVisible(false);
              }}
            >
              {selectedProvider?.packages?.map((pkg: _TSFixMe) => (
                <Picker.Item
                  label={`${pkg.name} - ₦${pkg.price.toLocaleString()}`}
                  value={pkg.id}
                  key={pkg.id}
                />
              ))}
            </Picker>

            <TouchableOpacity
              onPress={() => setPackageModalVisible(false)}
              style={styles.modalClose}
            >
              <Text style={[styles.modalCloseText, { color: "#000" }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomSheet
        isVisible={isPreviewVisible}
        onBackdropPress={() => setIsPreviewVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle2}>Payment</Text>
          </View>
          <Text style={styles.amount}>
            {selectedProvider?.name} - {selectedPackage?.name}
          </Text>

          <View style={styles.flex}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.bottomSheetText}>
              ₦
              {formatCurrency(
                selectedPackage?.price ? selectedPackage?.price : 0,
              )}
            </Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.label}>Provider</Text>
            <Text style={styles.bottomSheetText}>{selectedProvider?.name}</Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.label}>Package</Text>
            <Text style={styles.bottomSheetText}>{selectedPackage?.name}</Text>
          </View>

          {selectedProvider?.code !== "showmax" && (
            <View style={styles.flex}>
              <Text style={styles.label}>SmartCard Number</Text>
              <Text style={styles.bottomSheetText}>{CardNumber}</Text>
            </View>
          )}

          {selectedProvider?.code === "showmax" && (
            <View style={styles.flex}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.bottomSheetText}>{phoneNumber}</Text>
            </View>
          )}
          {/* <View style={styles.flex}>
            <Text style={styles.label}>Cashback</Text>
            <Text style={styles.bottomSheetText}>+15Pts</Text>
          </View> */}
          {/* <TouchableOpacity style={styles.SellButton} onPress={handlePay}>
            <Text style={styles.SellButtonText}>Continue</Text>
          </TouchableOpacity> */}

          <Button text="Continue" onPress={handlePay} />
        </View>
      </BottomSheet>

      {/* <PinEntryBottomSheet
        isVisible={isTransactionPinVisible}
        onClose={() => setIsTransactionPinVisible(false)}
        onConfirm={handleConfirmPin}
        isProcessing={isProcessingPayment}
      /> */}

      <BottomSheet
        isVisible={isTransactionPinVisible}
        onBackdropPress={() => setIsTransactionPinVisible(false)}
      >
        <View style={[styles.bottomSheetContent, { padding: 0 }]}>
          {error && (
            <Text className="text-danger font-medium text-[16px] text-center mt-2">
              {error}
            </Text>
          )}

          <PinComponent
            onComplete={(pin: string) => handleConfirmPin(pin)}
            setModalState={setIsTransactionPinVisible}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        isVisible={isSuccessVisible}
        // onBackdropPress={() => setIsSuccessVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <Image
            source={require("../assets/icons/success.png")}
            style={styles.logo}
          />
          <Text style={styles.successBottomSheetHeader}>
            Subscription Successfully Initiated
          </Text>
          <Text style={styles.desc}>{responseMessage}</Text>

          {purchaseToken && (
            <View className="flex-row items-center gap-1 justify-center">
              <Text className="text-gray-600 text-[14px]">
                Token: {purchaseToken}
              </Text>
              <Ionicons
                name="copy-outline"
                size={18}
                color="black"
                onPress={() => copyToClipboard(purchaseToken, "Token")}
              />
            </View>
          )}

          <Button
            text="Close"
            onPress={() => navigationWithReset(navigation, "(tabs)")}
          />
        </View>
      </BottomSheet>

      <Modal
        visible={isDropdownVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitles}>Select Provider</Text>
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
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(200 * index + 1)}>
                  <TouchableOpacity
                    onPress={() => {
                      const foundProvider = allProviders.find((provider) =>
                        provider.packages?.some(
                          (pkg: _TSFixMe) =>
                            pkg.package_code === item.package_code,
                        ),
                      );

                      if (foundProvider) {
                        skipVerification.current = true;
                        setSelectedPackage(undefined);
                        setSelectedProvider(foundProvider);
                        if (item.provider_code === "showmax") {
                          setPhoneNumber(item.phone);
                        } else {
                          setverifiedUser({
                            customer_id: item.card_number,
                            customer_name: item.customer_name,
                            decoder_status: "",
                            decoder_due_date: "",
                          });
                          setCardNumber(item.card_number);
                        }
                        setShowHistory(false);
                      } else {
                        skipVerification.current = false;
                      }
                    }}
                  >
                    <Card>
                      <View className="flex-row items-center gap-1">
                        <Image
                          source={{
                            uri: providers.find(
                              (p) =>
                                p.name.toLowerCase() ===
                                item.provider_code.toLowerCase(),
                            )?.logo,
                          }}
                          style={styles.icon}
                          resizeMode="cover"
                        />

                        <View>
                          <Text className="text-[18px] font-medium capitalize">
                            {item.provider_code === "showmax"
                              ? item.provider_code
                              : (item.customer_name ?? "-")}
                          </Text>
                          <Text className="text-gray-200 text-[15px] mt-2 capitalize">
                            {item.provider_code === "showmax"
                              ? item.phone
                              : `${item.provider_code} . ${
                                  item.card_number ?? "-"
                                }`}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              )}
              ListEmptyComponent={() => (
                <View className="flex items-center justify-center">
                  <Image
                    source={require("../assets/Bills/tv.png")}
                    style={{
                      height: 80,
                      width: 80,
                    }}
                  />
                  <Text className="text-[16px] text-center text-gray-200 font-semibold mt-3">
                    No beneficiaries yet
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </BottomSheet>

      <Modal
        visible={isPlanDropdownVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPlanDropdownVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitles}>Select Plan</Text>
            <FlatList
              data={plans}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handlePlanSelection(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsPlanDropdownVisible(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <LoadingComp visible={Loading} />
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    marginTop: IS_ANDROID_DEVICE ? 40 : 0,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold" },
  history: { color: "green", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tab: { padding: 10, borderRadius: 10, marginHorizontal: 5 },
  activeTab: { backgroundColor: "blue", paddingHorizontal: 60 },
  tabText: { fontSize: 16, color: "grey" },
  activeTabText: { color: "white" },
  content: { paddingHorizontal: 15 },
  selectionRow: { marginVertical: 10 },
  selectionLabel: { fontSize: 16, marginBottom: 5, fontWeight: "500" },
  dropDown: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 100,
    objectFit: "contain",
  },
  providerContainer: { flexDirection: "row", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalClose: { marginTop: 10 },
  modalCloseText: { color: "green", fontSize: 14, textAlign: "center" },
  backButton: {
    backgroundColor: "#ddd",
    padding: 6,
    borderRadius: 50,
  },
  flexHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  beneficiaryLabel: {
    color: "#0000ff",
    fontWeight: "500",
  },
  paymentMethod: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "green",
    paddingHorizontal: 20,
  },
  paymentText: { color: "green", fontWeight: "bold" },
  dropDown2: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
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
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
  },
  meterContainer: {
    backgroundColor: "#fff",
    flexDirection: "column",
    borderRadius: 15,
    marginBottom: 20,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    marginBottom: 10,
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
  bottomSheetTitle2: {
    fontSize: 15,
    fontWeight: "bold",
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#0000ff",
    marginBottom: 20,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "700",
  },
  label: {
    fontSize: 15,
    marginBottom: 10,
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
  recipientContainer: {
    marginBottom: 20,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
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
  },
  otpText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  keypadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 3,
    // justifyContent: "center",
    marginVertical: 20,
    backgroundColor: "#f0f0f0",
  },
  keypadButton: {
    paddingHorizontal: 44,
    height: 50,
    margin: 3,
    borderRadius: 5,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  keypadButtonText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
  },
  recipientTextContainer: {},
  recipientNameTitle: {},
});

export default Tv;
