import RecommendedScrollCards from "@/components/RecommendedScrollCards";
import { AntDesign, Entypo, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import * as Contacts from "expo-contacts";
import { router, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";

import LoadingComp from "@/components/Loading";
import PinComponent from "@/components/ui/PinComponent";
import { DEFAULT_PIN } from "@/constants";
import { COLORS } from "@/constants/Colors";
import { useBuyAirtime, useConfirmPurchase, useNetworks } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { formatDateAgo, navigationWithReset } from "@/utils";
import { percentagePrice } from "@/utils/formatters";
import { showLogs } from "@/utils/logger";
import Animated, {
  FadeInDown,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface CardItem {
  id: string;
  title: string;
  amount: string;
  growth: string;
  description: string;
}

// Update the Network interface
interface Network {
  id: number;
  name: string;
  img_url: string;
  image_full_url: string;
  vtu_code: string;
  airtime_biller_code: string | null;
  airtime_item_code: string | null;
  data_biller_code: string | null;
  created_at: string;
  updated_at: string;
  dataPlans: DataPlan[];
}

// Add balance to UserProfile interface
interface UserProfile {
  wallet_balance: number;
}

// Add new interfaces
interface DataPlan {
  id: number;
  network_id: number;
  title: string;
  name: string;
  price: string;
  data_size: string;
  vtu_code: string;
  validity: string;
  created_at: string;
  updated_at: string;
}

interface Recent {
  id: number;
  user_id: number;
  phone_number: string;
  network_code: string;
  network_name: string;
  type: "data" | "airtime";
  created_at: string;
  updated_at: string;
}

interface CashbackConfiguration {
  airtime_cashback_fixed: string; // Fixed ₦10 cashback for airtime
  airtime_cashback_percentage: string; // 10% (0.1) cashback for airtime
  data_cashback_fixed: string; // Fixed ₦10 cashback for data
  data_cashback_percentage: string; // 10% (0.1) cashback for data
}

const AirtimeData = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [activeTab, setActiveTab] = useState("Airtime");
  const refRBSheet = useRef<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isDataPlanDetailsVisible, setIsDataPlanDetailsVisible] =
    useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [recentNumbers, setRecentNumbers] = useState<any[]>([]);
  const [allRecentNumbers, setAllRecentNumbers] = useState<Recent[]>([]);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { width } = Dimensions.get("window");
  const [searchText, setSearchText] = useState("");
  const ITEM_WIDTH = Dimensions.get("window").width * 0.8;

  const [networks, setNetworks] = useState<Network[]>([]);
  interface AirtimeBundle {
    amount: number;
    label: string;
  }

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const userData = await AsyncStorage.getItem("UserDetails");
        if (userData !== null) {
          const parsedData = JSON.parse(userData);
          setUserProfile(parsedData);
        }
      } catch (error) {
        console.error("Error retrieving user details:", error);
      }
      return null;
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    if (!searchText) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        contact.name?.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredContacts(filtered);
    }
  }, [searchText, contacts]);

  const [airtimeBundles, setAirtimeBundles] = useState<AirtimeBundle[]>([]);
  const [error, setError] = useState("");
  interface PurchaseDetails {
    cost: number;
    total_cashback?: number;
  }
  const [purchaseDetails, setPurchaseDetails] =
    useState<PurchaseDetails | null>(null);
  const API_BASE_URL = "https://swiftpaymfb.com/api";

  const [customAmount, setCustomAmount] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isConfirmingDataPurchase, setIsConfirmingDataPurchase] =
    useState(false);
  const [isProcessingDataPurchase, setIsProcessingDataPurchase] =
    useState(false);
  const navigation = useNavigation();

  const { data: networksData, isLoading: isLoadingNetworks } = useNetworks();

  const {
    mutate: confirmPurchaseMutation,
    isPending: isConfirmingPurchaseMutation,
  } = useConfirmPurchase();

  const { mutate: buyAirtimeMutation, isPending: isProcessingPaymentMutation } =
    useBuyAirtime();

  const handleInputFocus = () => {
    setIsDropdownVisible(true);
  };

  const handleInputBlur = () => {
    setIsDropdownVisible(false);
  };

  const RecommendedCards = [
    {
      id: "1",
      title: "Solana",
      amount: "$21,234",
      growth: "+3.76%",
      description: "Buy & Sell Crypto at amazing rates!",
    },
    {
      id: "2",
      title: "Bitcoin",
      amount: "$29,234",
      growth: "+1.76%",
      description: "Buy & Sell Crypto at amazing rates!",
    },
    {
      id: "3",
      title: "Ethereum",
      amount: "$1,934",
      growth: "-2.54%",
      description: "Buy & Sell Crypto at amazing rates!",
    },
  ];

  const toggleModal = () => setIsModalVisible(!isModalVisible);

  const chooseContact = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        setContacts(data);
        setTimeout(() => refRBSheet.current.open(), 500);
      }
    } else {
      Alert.alert(
        "Permission Denied",
        "Permission to access contacts was denied.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
    setLoading(false);
  };

  const selectContact = (contact: any) => {
    setError("");
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      let rawNumber = contact.phoneNumbers[0].number;

      if (rawNumber) {
        let normalized = rawNumber.replace(/\s+/g, "");

        if (normalized.startsWith("+234")) {
          normalized = normalized.replace("+234", "0");
        }

        normalized = normalized.replace(/\D/g, "");

        if (normalized.length === 11) {
          setPhoneNumber(normalized);
        } else {
          alert("Invalid phone number format.");
          return;
        }
      }
    }

    refRBSheet.current.close();
    setSearchText("");
    Keyboard.dismiss();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % RecommendedCards.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const FetchNumbers = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");

        const response = await axios.get(
          `${API_BASE_URL}/bills/airtime-data/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        console.log("Number Response:", response?.data?.data);

        if (response?.data?.status === "success") {
          const fetchedNumbers = response?.data?.data.map((item: any) => ({
            phone_number: item.phone_number,
            network_name: item.network_name,
            network_code: item.network_code,
            type: item.type,
            created_at: item.updated_at,
          }));
          setAllRecentNumbers(fetchedNumbers);
          setRecentNumbers(
            fetchedNumbers.filter(
              (item: Recent) => item.type === activeTab.toLowerCase(),
            ),
          );
        }
      } catch (error: any) {
        setError(error?.response?.data?.message || "Failed to fetch numbers");
      }
    };

    FetchNumbers();
  }, []);

  const handleNumberSelect = (selectedNumber: {
    phone_number: string;
    network_code: string;
  }) => {
    setPhoneNumber(selectedNumber.phone_number);
    setSelectedNetwork(
      networks.find(
        (network) => network.vtu_code === selectedNumber.network_code,
      ) || null,
    );
    setIsDropdownVisible(false);
  };

  const deleteAllNumbers = async () => {
    Alert.alert(
      "Delete All Numbers",
      "Are you sure you want to delete all recent numbers?",
      [
        { text: "Cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("recentNumbers");
              setRecentNumbers([]); // Clear the state
            } catch (error) {
              console.error(
                "Failed to delete all numbers from AsyncStorage",
                error,
              );
            }
          },
        },
      ],
    );
  };

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleBundleSelection = (bundle: AirtimeBundle) => {
    console.log("start here");
    setCustomAmount(bundle.amount.toString());

    if (!bundle.amount) {
      setError("Please enter a valid amount");
      return;
    }

    if (bundle.amount < 50) {
      setError("Minimum amount is ₦50");
      return;
    }

    setPurchaseDetails({
      cost: bundle.amount,
      total_cashback: purchaseDetails?.total_cashback || 1,
    });

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
    if (!cleanPhoneNumber || cleanPhoneNumber.length !== 11) {
      setError("Please enter a valid 11-digit phone number");
      return;
    }

    setIsPreviewVisible(true);

    console.log("passed End Bundle");
  };

  const handleConfirmPayment = () => {
    setError("");
    if (isPreviewVisible) {
      setIsPreviewVisible(false);
      setIsTransactionPinVisible(true);
    }
  };

  useEffect(() => {
    if (networksData?.data?.networks) {
      setNetworks(networksData?.data?.networks);
      setAirtimeBundles(networksData?.data?.airtime_bundles || []);
      if (networksData?.data?.networks.length > 0) {
        setSelectedNetwork(networksData?.data?.networks[0]);
      }
    }
  }, [networksData]);

  const networkIcons = {
    mtn: {
      uri: "https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg",
    },
    airtel: {
      uri: "https://s3-ap-southeast-1.amazonaws.com/bsy/iportal/images/airtel-logo-white-text-vertical.jpg",
    },
    glo: {
      uri: "https://play-lh.googleusercontent.com/mU1dMWlW2KwsnFlv5odNCJ_UPLBxRfXAVloigb4WUjrDBddaNGsre1omOdoB1xEGdFvO",
    },
    "9mobile": {
      uri: "https://swiftpaymfb.com/etisalat.png",
    },
  };

  const NetworkIcon = ({ specificNetwork }: any) => {
    let selectedNetworkhere = selectedNetwork;

    if (specificNetwork) {
      selectedNetworkhere = specificNetwork;
    }
    if (!selectedNetworkhere || !selectedNetworkhere.vtu_code) {
      return <ActivityIndicator size="small" color="black" />;
    }

    const networkImage =
      networkIcons[selectedNetworkhere.vtu_code as keyof typeof networkIcons];

    return networkImage ? (
      <Image
        source={networkImage}
        style={styles.networkIcon}
        resizeMode="contain"
      />
    ) : (
      <View style={styles.networkIconText}>
        <Text style={styles.networkInitial}>
          {selectedNetworkhere.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  // showLogs("networks", networks);

  const renderNetworkItem = (network: Network) => (
    <TouchableOpacity
      key={network.id}
      onPress={() => {
        setSelectedNetwork(network);
        setIsModalVisible(false);
      }}
      style={styles.networkItem}
    >
      <Image
        source={{ uri: network.image_full_url }}
        className="h-12 w-12 rounded-full object-center mr-2 bg-[#dedede]"
      />
      <Text style={styles.networkname}>{network.name}</Text>
    </TouchableOpacity>
  );

  const [Rates_Charges, setRates_Charges] =
    useState<CashbackConfiguration | null>();

  const fetchDataPlans = async (networkId: number) => {
    try {
      setIsLoadingPlans(true);
      setError("");
      const token = await SecureStore.getItemAsync("userToken");
      console.log(token);
      const response = await axios.get(`${API_BASE_URL}/bills/airtime-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      showLogs("Data response:", JSON.stringify(response?.data));

      if (response.data.status === "success") {
        setRates_Charges({
          airtime_cashback_fixed: response.data.data.airtime_cashback_fixed,
          airtime_cashback_percentage:
            response.data.data.airtime_cashback_percentage,
          data_cashback_fixed: response.data.data.data_cashback_fixed,
          data_cashback_percentage: response.data.data.data_cashback_percentage,
        });
        const network = response?.data?.data?.networks.find(
          (n: Network) => n.id === networkId,
        );
        if (network) {
          setDataPlans(network?.data_plans || []);
        }
      } else {
        setError("Failed to fetch data plans");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch data plans");
      setDataPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const processPurchase = async (pin: string) => {
    try {
      console.log("Start airtime purchase");
      setError("");
      setIsProcessingPayment(true);

      if (!phoneNumber) {
        setError("Please enter phone number");
        setIsTransactionPinVisible(false);
        setIsProcessingPayment(false);
        return;
      }

      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      if (!cleanPhoneNumber || cleanPhoneNumber.length !== 11) {
        setError("Please enter a valid 11-digit phone number");
        setIsTransactionPinVisible(false);
        setIsProcessingPayment(false);
        return;
      }

      const finalCost =
        (purchaseDetails?.cost ?? 0) -
        networksData?.data?.airtime_cashback_fixed;

      // showLogs("payload", {
      //   airtime_amount: purchaseDetails?.cost || 0,
      //   cost: finalCost || 0,
      //   phone: cleanPhoneNumber,
      //   network_code: selectedNetwork?.vtu_code || "",
      // });

      buyAirtimeMutation(
        {
          airtime_amount: purchaseDetails?.cost || 0,
          cost: finalCost || 0,
          phone: cleanPhoneNumber,
          network_code: selectedNetwork?.vtu_code || "",
        },
        {
          onSuccess: (data) => {
            setIsTransactionPinVisible(false);
            setIsSuccessVisible(true);
            // saveNumberToAsyncStorage(cleanPhoneNumber);
            setIsProcessingPayment(false);
          },
          onError: (err: any) => {
            console.log("error occured");
            showLogs("buy airtime error", err.response.data);
            const errorMessage =
              err?.response?.data?.message || "Purchase failed";
            setError(errorMessage);
            setIsTransactionPinVisible(false);
            setIsProcessingPayment(false);
          },
        },
      );
    } catch (error) {
      console.log(error);
      setIsProcessingPayment(false);
    }
  };

  const processDataPurchase = async (pin: string) => {
    try {
      setLoading(true);
      setIsProcessingPayment(true);
      setError("");
      const token = await SecureStore.getItemAsync("userToken");

      if (!phoneNumber) {
        setError("Please enter phone number");
        setIsTransactionPinVisible(false);
        setIsProcessingPayment(false);
        return;
      }

      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      if (!cleanPhoneNumber || cleanPhoneNumber.length !== 11) {
        setError("Please enter a valid 11-digit phone number");
        setIsTransactionPinVisible(false);
        setIsProcessingPayment(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/bills/buy-data`,
        {
          phone: cleanPhoneNumber,
          pin: pin,
          plan_id: selectedPlan?.id,
          network_code: selectedNetwork?.vtu_code,
          is_ported: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.data.status === "success") {
        setIsTransactionPinVisible(false);
        setIsSuccessVisible(true);
      } else {
        setError(response.data.message || "Purchase failed");
      }
    } catch (err: any) {
      showLogs("purchase data error:", err.response.data);
      setError(err?.response?.data?.message || "Purchase failed");
      setIsTransactionPinVisible(false);
    } finally {
      setIsProcessingPayment(false);
      setLoading(false);
      setIsProcessingDataPurchase(false);
    }
  };

  const handleConfirmPin = async (pin: string) => {
    setError("");
    const errorMessage = "You entered an invalid PIN, please try again";

    try {
      if (pin !== DEFAULT_PIN) {
        const response = await apiService.verifyUserPin(pin);
        if (response.status !== "success") {
          setError(errorMessage);
          return;
        }
      }

      setIsTransactionPinVisible(false);

      if (activeTab === "Airtime") {
        await processPurchase(pin);
      } else {
        await processDataPurchase(pin);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred";
      showLogs("Purchase error", message);
      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (selectedNetwork && activeTab === "Data") {
      fetchDataPlans(selectedNetwork.id);
    }
  }, [selectedNetwork, activeTab]);

  const TopTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "Airtime" && styles.activeTab]}
        onPress={() => {
          setActiveTab("Airtime");
          setRecentNumbers(
            allRecentNumbers.filter((item) => item.type === "airtime"),
          );
        }}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "Airtime" && styles.activeTabText,
          ]}
        >
          Airtime
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "Data" && styles.activeTab]}
        onPress={() => {
          setActiveTab("Data");
          setRecentNumbers(
            allRecentNumbers.filter((item) => item.type === "data"),
          );
        }}
      >
        <Text
          style={[styles.tabText, activeTab === "Data" && styles.activeTabText]}
        >
          Data
        </Text>
      </TouchableOpacity>
    </View>
  );

  const HandleBack = () => {
    setIsTransactionPinVisible(false);
    setIsSuccessVisible(false);
    navigationWithReset(navigation, "(tabs)");
  };

  const handleDataPlanSelection = (plan: any) => {
    setSelectedPlan(plan);
    setIsDataPlanDetailsVisible(true);
  };

  const confirmDataPurchase = async (planId: number) => {
    if (planId) {
      setIsTransactionPinVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            // style={styles.backbutton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Airtime & Data</Text>

          <TouchableOpacity activeOpacity={0.8}>
            {/* <Text style={styles.historyText}>History</Text> */}
          </TouchableOpacity>
        </View>

        <LoadingComp visible={isProcessingPayment || loading} />

        <TopTabBar />

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === "Airtime" ? (
            <View>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity
                  style={styles.network}
                  onPress={toggleModal}
                  disabled={!selectedNetwork}
                >
                  <Image
                    source={{ uri: selectedNetwork?.image_full_url }}
                    className="h-12 w-12 rounded-full object-center mr-2 bg-[#dedede]"
                  />

                  <AntDesign name="down" size={15} />
                </TouchableOpacity>
                <TextInput
                  placeholder="Enter Number"
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor="#999"
                  // onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity onPress={chooseContact}>
                  <FontAwesome
                    name="phone"
                    size={24}
                    color="white"
                    style={styles.callButton}
                  />
                </TouchableOpacity>
              </View>

              <Pressable
                onPress={() => setIsDropdownVisible(!isDropdownVisible)}
                className="flex-row items-center justify-end gap-2 -mt-4"
              >
                <Text style={styles.dropdownItemText}>
                  {isDropdownVisible ? "Hide Recents" : "Show Recents"}
                </Text>
                <Entypo
                  name={
                    isDropdownVisible
                      ? "chevron-small-up"
                      : "chevron-small-down"
                  }
                  size={24}
                  color="#444"
                />
              </Pressable>

              {isDropdownVisible && (
                <Animated.View
                  style={styles.dropdownContainer}
                  entering={ZoomIn.delay(100)}
                  exiting={ZoomOut.delay(100)}
                >
                  <Text className="font-medium text-[15px] uppercase">
                    Recent Purchases
                  </Text>
                  <FlatList
                    data={recentNumbers}
                    scrollEnabled={false}
                    keyExtractor={(recentNumbers) =>
                      recentNumbers.phone_number.toString()
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handleNumberSelect(item)}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.dropdownItemText}>
                          {item.phone_number}
                        </Text>
                        <View>
                          <Text style={styles.network}>
                            {item.network_name}
                          </Text>
                          <Text style={[styles.network, { color: "#444" }]}>
                            {formatDateAgo(item.created_at)}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                    ListEmptyComponent={() => (
                      <Text className="text-gray-200 text-[15px] capitalize mt-3">
                        No recent purchases for {activeTab}
                      </Text>
                    )}
                  />
                </Animated.View>
              )}

              <Animated.View
                entering={FadeInDown.delay(200)}
                layout={LinearTransition.springify().damping(14)}
              >
                {loading && <LoadingComp visible />}
                <Text style={styles.topUpLabel}>Top up</Text>

                <View style={styles.topUpOption}>
                  {airtimeBundles.map((bundle, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.6}
                      style={styles.topUpCard}
                      onPress={() => handleBundleSelection(bundle)}
                    >
                      <Text style={styles.cashbackText}>
                        ₦{networksData?.data?.airtime_cashback_fixed || 1}{" "}
                        Cashback{" "}
                      </Text>
                      <Text style={styles.amountText}>₦{bundle.label}</Text>
                      <Text style={styles.payText}>Pay ₦{bundle.amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.slider}>
                  <View style={styles.amountInputContainer}>
                    <TextInput
                      placeholder="₦ 50-500,00"
                      style={styles.amountInput}
                      keyboardType="numeric"
                      value={customAmount}
                      onChangeText={setCustomAmount}
                    />
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => {
                        const amountValue = parseInt(customAmount);
                        if (!amountValue || amountValue < 100) {
                          setError("Please enter an amount of at least ₦100");
                          return;
                        }
                        const customBundle: AirtimeBundle = {
                          amount: amountValue,
                          label: amountValue.toString(),
                        };
                        handleBundleSelection(customBundle);
                      }}
                    >
                      <Text style={styles.payButtonText}>Pay</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.recommendedLabel}>Recommended</Text>
                  {/* Recommended cards */}

                  <FlatList
                    ref={flatListRef}
                    data={RecommendedCards}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.recommendedCard}>
                        <View>
                          <Text style={styles.recommendedTitle}>
                            {item.title}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Text style={styles.recommendedAmount}>
                              {item.amount}
                            </Text>
                            <Text
                              style={[
                                styles.recommendedGrowth,
                                parseFloat(item.growth) < 0 &&
                                  styles.negativeGrowth,
                              ]}
                            >
                              {item.growth}
                            </Text>
                          </View>
                          {/* Ensure this description text is wrapped properly */}
                          <Text
                            style={styles.recommendedDescription}
                            numberOfLines={2}
                          >
                            Buy and Sell Crypto at amazing rates today
                          </Text>
                        </View>
                      </View>
                    )}
                    getItemLayout={(data, index) => ({
                      length: ITEM_WIDTH,
                      offset: ITEM_WIDTH * index,
                      index,
                    })}
                    onScrollToIndexFailed={(info) => {
                      setTimeout(() => {
                        flatListRef.current?.scrollToIndex({
                          index: info.index,
                          animated: true,
                        });
                      }, 500);
                    }}
                  />
                </View>

                <View style={styles.paginationContainer}>
                  {RecommendedCards?.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentIndex
                          ? styles.activeDot
                          : styles.inactiveDot,
                      ]}
                    />
                  ))}
                </View>
              </Animated.View>
            </View>
          ) : (
            <View>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity style={styles.network} onPress={toggleModal}>
                  {selectedNetwork?.image_full_url && (
                    <Image
                      source={{ uri: selectedNetwork?.image_full_url }}
                      className="h-12 w-12 rounded-full object-center mr-2 bg-[#dedede]"
                    />
                  )}
                  <AntDesign name="down" size={15} />
                </TouchableOpacity>

                <TextInput
                  placeholder="Enter Number"
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />

                <TouchableOpacity onPress={chooseContact}>
                  <FontAwesome
                    name="phone"
                    size={24}
                    color="white"
                    style={styles.callButton}
                  />
                </TouchableOpacity>
              </View>

              <Pressable
                onPress={() => setIsDropdownVisible(!isDropdownVisible)}
                className="flex-row items-center justify-end gap-2 -mt-4"
              >
                <Text style={styles.dropdownItemText}>
                  {isDropdownVisible ? "Hide Recents" : "Show Recents"}
                </Text>
                <Entypo
                  name={
                    isDropdownVisible
                      ? "chevron-small-up"
                      : "chevron-small-down"
                  }
                  size={24}
                  color="#444"
                />
              </Pressable>

              {isDropdownVisible && (
                <Animated.View
                  style={styles.dropdownContainer}
                  entering={ZoomIn.delay(100)}
                  exiting={ZoomOut.delay(100)}
                >
                  <Text className="font-medium text-[15px] uppercase">
                    Recent Purchases
                  </Text>
                  <FlatList
                    data={recentNumbers}
                    scrollEnabled={false}
                    keyExtractor={(recentNumbers) =>
                      recentNumbers.phone_number.toString()
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handleNumberSelect(item)}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.dropdownItemText}>
                          {item.phone_number}
                        </Text>
                        <View>
                          <Text style={styles.network}>
                            {item.network_name}
                          </Text>
                          <Text style={[styles.network, { color: "#444" }]}>
                            {formatDateAgo(item.created_at)}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                    ListEmptyComponent={() => (
                      <Text className="text-gray-200 text-[15px] capitalize mt-3">
                        No recent purchases for {activeTab}
                      </Text>
                    )}
                  />
                </Animated.View>
              )}

              <Animated.View
                entering={FadeInDown.delay(200)}
                layout={LinearTransition.springify().damping(14)}
                className="mt-4"
              >
                <RecommendedScrollCards />

                <View style={styles.planContainer}>
                  <View style={styles.sort}>
                    <Text style={styles.activetopUpLabel}>Top up</Text>
                  </View>

                  {isLoadingPlans ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                  ) : (
                    <View style={styles.topUpOptions}>
                      {dataPlans && dataPlans.length > 0 ? (
                        dataPlans.map((plan) => (
                          <TouchableOpacity
                            activeOpacity={0.6}
                            key={plan.id}
                            style={styles.topUpDataCard}
                            onPress={() => handleDataPlanSelection(plan)}
                            // onPress={() => {
                            // setSelectedPlan(plan);
                            // confirmDataPurchase(plan.id);
                            // }}
                            disabled={isConfirmingDataPurchase}
                          >
                            <Text style={styles.amountText}>{plan?.title}</Text>
                            <Text style={styles.planDate}>{plan.validity}</Text>
                            <Text style={styles.payText}>₦{plan.price}</Text>
                            <Text style={styles.cashbackTextData}>
                              {isConfirmingDataPurchase
                                ? "Loading..."
                                : "Select"}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noDataText}>
                          No data plans available
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={isModalVisible}
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            {networks && networks.length > 0 ? (
              networks.map(renderNetworkItem)
            ) : (
              <View style={styles.networkItem}>
                <Text>No networks available</Text>
              </View>
            )}
          </View>
        </Modal>

        <RBSheet
          ref={refRBSheet}
          height={400}
          openDuration={250}
          customStyles={{
            container: {
              justifyContent: "center",
              alignItems: "center",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              minHeight: "85%",
            },
          }}
        >
          <Text style={styles.bottomSheetTitle}>Select a Contact</Text>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search contact"
              style={styles.inputSearch}
              value={searchText}
              onChangeText={setSearchText}
            />
            <AntDesign name="search1" size={20} />
          </View>
          <FlatList
            contentContainerStyle={{ width: width - 20 }}
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectContact(item)}
                style={styles.contactItem}
                activeOpacity={0.6}
              >
                <Text style={styles.contactName}>{item.name}</Text>
                {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                  <Text style={styles.contactNumber}>
                    {item.phoneNumbers[0].number}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View className="flex items-center justify-center pt-20">
                <Image
                  source={require("../assets/Bills/phone.png")}
                  style={{
                    height: 150,
                    width: 150,
                    resizeMode: "cover",
                  }}
                />
                <Text className="text-gray-200 mt-3 text-[17px] font-semibold">
                  No contact found
                </Text>
              </View>
            )}
          />
        </RBSheet>

        <BottomSheet
          isVisible={isPreviewVisible}
          onBackdropPress={() => setIsPreviewVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle2}>Payment</Text>
            </View>
            <Text style={styles.amount}>
              ₦
              {Number(purchaseDetails?.cost) -
                (Number(networksData?.data?.airtime_cashback_fixed) +
                  percentagePrice(
                    Number(purchaseDetails?.cost),
                    Number(networksData?.data?.airtime_cashback_percentage),
                  )) || "0"}
            </Text>

            <View style={styles.flex}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.bottomSheetText}>
                ₦{Number(purchaseDetails?.cost) || "0"}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Provider</Text>
              <Text style={styles.bottomSheetText}>
                {selectedNetwork?.name}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Mobile number</Text>
              <Text style={styles.bottomSheetText}>{phoneNumber}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Balance</Text>
              <Text style={styles.bottomSheetText}>
                ₦{userProfile?.wallet_balance?.toLocaleString() || "0"}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Cashback</Text>
              <Text style={styles.bottomSheetText}>
                {networksData?.airtime_cashback_fixed}₦
                {networksData
                  ? Number(networksData?.data?.airtime_cashback_fixed) +
                    percentagePrice(
                      Number(purchaseDetails?.cost),
                      Number(networksData?.data?.airtime_cashback_percentage),
                    )
                  : "0"}
              </Text>
            </View>
            {/* Show loading indicators */}
            {(loading || isConfirmingPurchaseMutation) && (
              <ActivityIndicator
                size="small"
                color="#0000ff"
                style={styles.loader}
              />
            )}
            <TouchableOpacity
              style={[
                styles.SellButton,
                (isProcessingPaymentMutation ||
                  !userProfile?.wallet_balance ||
                  userProfile.wallet_balance < (purchaseDetails?.cost || 0)) &&
                  styles.disabledButton,
              ]}
              onPress={handleConfirmPayment}
              disabled={
                isProcessingPaymentMutation ||
                !userProfile?.wallet_balance ||
                userProfile.wallet_balance < (purchaseDetails?.cost || 0)
              }
            >
              <Text style={styles.SellButtonText}>
                {isProcessingPaymentMutation ? "Processing..." : "Continue"}
              </Text>
            </TouchableOpacity>
            {userProfile?.wallet_balance &&
              userProfile.wallet_balance < (purchaseDetails?.cost || 0) && (
                <Text style={styles.insufficientFundsText}>
                  Insufficient balance. Please top up your wallet.
                </Text>
              )}
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
          onBackdropPress={() => setIsSuccessVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successBottomSheetHeader}>
              Subscription Successful
            </Text>
            <Text style={styles.desc}>Your subscription is successful</Text>

            <TouchableOpacity style={styles.nextButton} onPress={HandleBack}>
              <Text style={styles.nextButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={isDataPlanDetailsVisible}
          onBackdropPress={() => setIsDataPlanDetailsVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle2}></Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsDataPlanDetailsVisible(false)}
              >
                <AntDesign name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedNetwork && selectedPlan ? (
              <>
                <View style={styles.networkInfoContainer}>
                  <Text style={styles.networkPrice}>
                    ₦
                    {Number(selectedPlan?.price) -
                      (Number(networksData?.data?.data_cashback_fixed) +
                        percentagePrice(
                          Number(selectedPlan?.price),
                          Number(networksData?.data?.data_cashback_percentage),
                        ))}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.label}>Product Name</Text>
                  <View style={styles.networkInfoContainer}>
                    <NetworkIcon />
                    <Text style={styles.networkName}>
                      {selectedNetwork?.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <Text style={styles.bottomSheetText}>
                    {phoneNumber || ""}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.label}>Data Bundle</Text>
                  <Text style={styles.bottomSheetText}>
                    {selectedPlan?.title?.split("-")[0]}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.label}>Cashback</Text>
                  <Text style={styles.bottomSheetText}>
                    ₦
                    {networksData
                      ? Number(networksData?.data?.data_cashback_fixed) +
                        percentagePrice(
                          Number(selectedPlan?.price),
                          Number(networksData?.data?.data_cashback_percentage),
                        )
                      : "0"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.SellButton}
                  onPress={() => {
                    setIsDataPlanDetailsVisible(false);
                    confirmDataPurchase(selectedPlan?.id);
                  }}
                  disabled={isConfirmingDataPurchase}
                >
                  <Text style={styles.SellButtonText}>
                    {isConfirmingDataPurchase ? "Processing..." : "Continue"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.noDataText}>No plan details available</Text>
            )}
          </View>
        </BottomSheet>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AirtimeData;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  deleteIcon: {
    marginLeft: 10,
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  historyText: {
    color: "green",
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginHorizontal: 10,
  },
  activeTab: {
    backgroundColor: "#0000ff",
    paddingHorizontal: 50,
  },
  tabText: {
    color: "black",
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  networkIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: "cover",
    backgroundColor: "#dedede",
    borderRadius: 100,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  callButton: {
    backgroundColor: "#0000ff",
    padding: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  topUpLabel: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "700",
  },
  activetopUpLabel: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "700",
    borderBottomWidth: 4,
    borderBottomColor: "#0000ff",
    color: "#0000ff",
  },
  topUpOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  topUpOption: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
  },
  topUpCard: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    width: "31.8%",
    marginBottom: 10,
    alignItems: "center",
    flexDirection: "column",
  },
  topUpDataCard: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    width: "31.8%",
    marginBottom: 10,
    alignItems: "center",
    flexDirection: "column",
  },
  cashbackText: {
    fontSize: 11,
    color: "#0000ff",
    marginBottom: 10,
  },
  cashbackTextData: {
    fontSize: 11.5,
    color: "#0cbc8b",
    marginBottom: 10,
    fontWeight: "500",
  },
  planDate: {
    color: "#666",
    fontWeight: "500",
  },
  amountText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 5,
  },
  payText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  amountInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 7,
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  payButton: {
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 30,
    paddingHorizontal: 35,
  },
  payButtonText: {
    color: "white",
    fontSize: 15,
  },
  recommendedLabel: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "600",
  },
  recommendedCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    width: 305,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
  },
  recommendedAmount: {
    fontSize: 20,
    marginTop: 5,
    color: "#000",
    fontWeight: "700",
  },
  recommendedGrowth: {
    fontSize: 14,
    color: "green",
    marginTop: 5,
  },
  negativeGrowth: {
    color: "red",
  },
  backbutton: {
    backgroundColor: "#fff",
    padding: 13,
    borderRadius: 50,
  },
  network: {
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  activepageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  activepage: {
    backgroundColor: "#0000ff",
    height: 8,
    width: 25,
    borderRadius: 10,
  },
  page: {
    backgroundColor: "#ddd",
    height: 8,
    width: 25,
    borderRadius: 10,
  },
  recommendedDescription: {
    fontSize: 15,
    color: "#666", // Use a darker color to ensure visibility
    marginTop: 5,
    lineHeight: 16,
    fontWeight: "400", // Adjust the font weight if needed
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    width: "80%",
    alignSelf: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  paginationDot: {
    width: 20,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "blue",
  },
  inactiveDot: {
    backgroundColor: "#aaa",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 20,
    paddingTop: 20,
    textAlign: "center",
    alignSelf: "center",
  },
  bottomSheetTitle2: {
    fontSize: 15,
    fontWeight: "bold",
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
  },
  contactItem: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "500",
  },
  contactNumber: {
    fontSize: 14,
    color: "#555",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: "space-between",
    width: "90%",
    borderRadius: 10,
    borderColor: "#aaa",
    marginBottom: 10,
  },
  inputSearch: {
    flex: 1,
  },
  loader: {
    // marginVertical: 20,
  },
  networkname: {
    fontWeight: "600",
    fontSize: 16,
  },
  sort: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 3,
  },
  dropdownItem: {
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  numberAndNetwork: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  natwork: {
    color: "#aaa",
    fontWeight: "600",
  },
  date: {
    color: "#aaa",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    marginBottom: 10,
  },
  trashText: {
    color: "#555",
  },
  slider: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#0000ff",
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
    justifyContent: "center",
    // marginBottom: 10,
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
    fontSize: 14,
    marginBottom: 20,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "#ccc",
  },
  insufficientFundsText: {
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  networkIconText: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0FA078",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  networkInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  successIcon: {
    width: 50,
    height: 50,
    borderRadius: 60,
    backgroundColor: COLORS.swiftPayBlue,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  successIconText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },

  networkInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    justifyContent: "center",
  },
  networkName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  networkPrice: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#333",
  },
  planDetailsContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  planDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0000ff",
    marginBottom: 5,
  },
  planDataSize: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 15,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    padding: 10,
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
  // nextButton: {
  //   backgroundColor: "#0000ff",
  //   padding: 15,
  //   borderRadius: 10,
  //   alignItems: "center",
  //   marginTop: 20,
  // },
  // nextButtonText: {
  //   color: "#fff",
  //   fontSize: 18,
  // },
});
