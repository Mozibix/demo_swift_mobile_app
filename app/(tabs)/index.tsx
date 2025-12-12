import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  _TSFixMe,
  cn,
  navigationWithReset,
  profileBadges,
  shortenText,
} from "@/utils";
import { formatCurrency } from "@/utils/formatters";
import { showLogs } from "@/utils/logger";
import {
  AntDesign,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
  SimpleLineIcons,
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import { router, useFocusEffect, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import FaceId from "../../assets/icons/face.png";
import Touch from "../../assets/logos/fingerprint.png";
// import { addScreenshotListener, removeScreenshotListener } from "react-native-detector";
import Button from "@/components/ui/Button";
import { authenticateWithBiometric } from "@/hooks/useBiometrics";
import { apiService } from "@/services/api";
import Constants from "expo-constants";
import { modelName } from "expo-device";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { IS_ANDROID_DEVICE } from "@/constants";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import { COLORS } from "@/constants/Colors";
import AppPopop from "@/components/AppPopop";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGlobals } from "@/context/GlobalContext";

const { width } = Dimensions.get("window");
const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/";

const countries = [
  {
    name: "Nigeria",
    currency: "Naira",
    code: "NGN",
    flag: require("../../assets/flag/nigeria.png"),
  },
  {
    name: "United States",
    currency: "Dollar",
    code: "USD",
    flag: require("../../assets/flag/usa.png"),
  },
  {
    name: "United Kingdom",
    currency: "Pound",
    code: "GBP",
    flag: require("../../assets/flag/uk.png"),
  },
  {
    name: "Germany",
    currency: "Euro",
    code: "EUR",
    flag: require("../../assets/flag/germany.png"),
  },
];

type UserLevel = "green" | "gold" | "black" | "blue";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
  profile_image: string;
  email_verified_at: string | null;
  account_status: "active" | "deleted" | string;
  is_bvn_verified: boolean;
  bvn: string | null;
  bvn_reference: string | null;
  kyc_status: "verified" | "unverified" | string;
  nin: string | null;
  phone: string;
  otp_reference: string | null;
  is_otp_verified: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  is_verified: 0 | 1;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  quidax_id: string | null;
  quidax_sn: string | null;
  quidax_email?: string | null;
  card_token: string | null;
  card_token_email: string | null;
  level: UserLevel;
  transaction_volume: string;
  ajo_contribution_wallet: number;
  platform: "web" | "mobile" | string;
  deleted_at: string | null;
  is_owing_ajo_contribution: 0 | 1;
  if_level_changed: boolean;
  name: string;
  profile_photo: string;
  hash_id: string;
}

interface KycTask {
  id: string;
  title: string;
  status: string;
  icon: any;
  color: string;
  route:
    | "/KycLevelOne"
    | "/login"
    | "/CreateSwiftpayTag"
    | "/ChangeSwiftpayTag";
}

interface HomeData {
  wallet_balance: number;
  if_account_level_changed: boolean;
  kyc_status: "unverified" | "pending" | "verified";
  if_swiftpay_tag: boolean;
  international_transfer_total: number;
  holdings_total: number;
  investments_total: number;
  ajo_savings_balance: number;
  ajo_contribution_wallet: number;
  send_to_africa_total: number;
}

const getKycTasks = (kycStatus: string, username: string | null): KycTask[] => {
  const tasks: KycTask[] = [];

  if (kycStatus !== "verified") {
    tasks.push({
      id: "1",
      title: "Complete KYC",
      status: kycStatus,
      icon: "user-check",
      color: kycStatus === "rejected" ? "#FF3B30" : "#FF9500",
      route: "/KycLevelOne" as const,
    });
  }

  // if (username === null) {
  //   tasks.push({
  //     id: "2",
  //     title: "Create SwiftPay Tag",
  //     status: "pending",
  //     icon: "tag",
  //     color: "#007AFF",
  //     route: "/ChangeSwiftpayTag" as const,
  //   });
  // }

  return tasks;
};

export type NotificationData = {
  message: string;
  link: string;
  topic: string;
};

export type Notification = {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

function Index() {
  const [modalVisible, setModalVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [convertedBalance, setConvertedBalance] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [modalConvertVisible, setModalConvertVisible] = useState(false);
  const [isAllowBiometric, setIsAllowBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  const [HomeData, setHomeData] = useState<HomeData | null>(null);

  const [amount, setAmount] = useState<any>("");

  //conversion
  const [fromCurrency, setFromCurrency] = useState("SGD");
  const [toCurrency, setToCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState<number | undefined>();
  const [LoadingExchageRate, setLoadingExchageRate] = useState(true);
  const [selectedExchangeRate, setSelectedExchangeRate] = useState<
    string | undefined
  >();
  const [exchangeRates, setExchangeRates] = useState<{
    [key: string]: number | any;
  }>({});
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<
    "from" | "to"
  >("from");
  const [currencySign, setCurrencySign] = useState("$");

  const [profileLoading, setProfileLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, getUserProfile, shouldRefetch, isKYCVerified } = useAuth();
  const {
    isCryptoEnabled,
    isHoldingsEnabled,
    isInvestmentsEnabled,
    setRefreshString,
  } = useGlobals();
  const { setTransferSource } = useMultipleTransfer();
  const navigation = useNavigation();

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        // const hasSeenBiometricPrompt = await AsyncStorage.getItem(
        //   "hasSeenBiometricPrompt"
        // );

        // console.log("hasSeenBiometricPrompt", hasSeenBiometricPrompt);

        // if (!hasSeenBiometricPrompt) {
        //   setIsAllowBiometric(true);
        // }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          setIsAllowBiometric(true);
        }
      } catch (error) {
        console.error("Error checking biometric prompt:", error);
      }
    };

    checkFirstLogin();
    getUserProfile();
  }, []);

  useEffect(() => {
    async function getAndSavePushToken() {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants?.expoConfig?.extra?.eas.projectId,
      });

      if (user) {
        await saveUserPushToken(token);
      }
    }

    getAndSavePushToken();
  }, []);

  async function saveUserPushToken(pushToken: Notifications.ExpoPushToken) {
    try {
      await apiService.storeUserPushToken(
        pushToken.data,
        modelName ?? `${user?.first_name} ${Platform.OS} device`,
      );
    } catch (error: _TSFixMe) {
      showLogs("saveUserPushToken error", error.response);
    }
  }

  const handleAllowBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return;

      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      } else if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
      ) {
        setBiometricType("Face");
      }

      const result = await authenticateWithBiometric();

      if (result) {
        await AsyncStorage.setItem("hasSeenBiometricPrompt", "true");
        setIsAllowBiometric(false);
        showSuccessToast({
          title: "Success!",
          desc: "Biometrics has been enabled!",
        });
      }
    } catch (error) {
      console.error("Error saving biometric preference:", error);
    }
  };

  const handleMaybeLater = async () => {
    try {
      // Save that the user has seen the biometric prompt
      await AsyncStorage.setItem("hasSeenBiometricPrompt", "true");
      setIsAllowBiometric(false);
    } catch (error) {
      console.error("Error saving biometric preference:", error);
    }
  };

  const subtitles = [
    ...(isCryptoEnabled ? ["Buy & Sell Cash and Cryptocurrency Swiftly"] : []),
    "Secure and Fast Transactions",
    "Exchange Rates You Can Trust",
    "Buy & Redeem your Giftcards with SwiftPay",
  ];

  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const intervalId = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSubtitleIndex(
          (prevIndex) => (prevIndex + 1) % subtitles.length,
        );
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(intervalId);
  }, [fadeAnim]);

  useEffect(() => {
    switch (selectedCountry.code) {
      case "NGN":
        setCurrencySign("₦");
        break;
      case "USD":
        setCurrencySign("$");
        break;
      case "EUR":
        setCurrencySign("€");
        break;
      default:
        setCurrencySign("$");
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry.code === "NGN") {
      setConvertedBalance(userProfile?.wallet_balance || 0);
      setExchangeRate(1);
    } else {
      axios
        .get(`https://api.exchangerate-api.com/v4/latest/NGN`)
        .then((response) => {
          const rate = response.data.rates[selectedCountry.code];
          setExchangeRate(rate);
          setConvertedBalance((userProfile?.wallet_balance || 0) * rate);
        })
        .catch((error) => {
          console.error(error);
          setConvertedBalance(userProfile?.wallet_balance || 0);
        });
    }
  }, [selectedCountry, userProfile?.wallet_balance]);

  const formatBalance = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  //  const fadeAnim = useRef(new Animated.Value(1)).current;

  // useEffect(() => {
  //   const listener = addScreenshotListener(() => {
  //     const message =
  //       "Swiftpay detected that your screen is being captured. Please remember to protect your personal information.";
  //     if (Platform.OS === "android") {
  //       ToastAndroid.show(message, ToastAndroid.LONG);
  //     } else {
  //       Alert.alert("Notice", message);
  //     }
  //   });

  //   return () => {
  //     removeScreenshotListener(listener);
  //   };
  // }, []);

  async function GetExchangeRates() {
    setLoadingExchageRate(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");

      let intigrate = await axios({
        url: "https://swiftpaymfb.com/api/currency-conversion",
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let data = intigrate.data.data;
      setExchangeRates(data);

      setFromCurrency(Object.keys(data)[0]);
      setToCurrency(Object.keys(data)[1]);
    } catch (err) {
      console.log(err);

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Session expired. Please login again.");
        await SecureStore.deleteItemAsync("userToken");
        navigationWithReset(navigation, "login");
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setLoadingExchageRate(false);
    }
  }

  //
  const handleConvert = () => {
    if (amount && exchangeRates[toCurrency]) {
      let rateDetail = exchangeRates[toCurrency];

      let converted =
        (amount * exchangeRates[fromCurrency].rate) / rateDetail.rate;

      setConvertedAmount(converted);
    }
  };

  // const
  //   setUserProfile(user);
  //   setConvertedBalance(user?.wallet_balance || 0);
  //   await AsyncStorage.setItem(
  //     "WalletBalance",
  //     JSON.stringify(user?.wallet_balance || 0)
  //   );
  // };

  const fetchUserProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        setError("No auth token found. Please login.");
        navigationWithReset(navigation, "login");
        return;
      }

      setProfileLoading(true);

      const response = await axios.get("https://swiftpaymfb.com/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        await AsyncStorage.setItem(
          "UserDetails",
          JSON.stringify(response.data.data),
        );
        // showLogs("user deets", response.data.data);
        setUserProfile(response.data.data);

        setConvertedBalance(response.data.data.wallet_balance);
        await AsyncStorage.setItem(
          "WalletBalance",
          JSON.stringify(response.data.data.wallet_balance),
        );
        setError(null);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Session expired. Please login again.");
        await SecureStore.deleteItemAsync("userToken");
        navigationWithReset(navigation, "login");
      } else {
        setError("Failed to load profile data");
        console.error("Failed to load profile data");
      }
    } finally {
      setIsLoading(false);
      setProfileLoading(false);
    }
  };

  const fetchHomeApi = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        setError("No auth token found. Please login.");
        navigationWithReset(navigation, "login");
        return;
      }

      const response = await axios.get("https://swiftpaymfb.com/api/home", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setHomeData(response.data.data);
        setError(null);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Session expired. Please login again.");
        await SecureStore.deleteItemAsync("userToken");
        navigationWithReset(navigation, "login");
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  async function getUserNotifications() {
    try {
      const response = await apiService.getNotifications();
      setNotifications(response.data.notifications.data);
    } catch (error) {
      console.log("error", error);
    }
  }

  useEffect(() => {
    fetchUserProfile();
    fetchHomeApi();
    GetExchangeRates();
    getUserNotifications();
  }, [shouldRefetch, user]);

  // useCallback(() => {
  //   fetchUserProfile();
  //   fetchHomeApi();
  //   GetExchangeRates();
  // }, []);

  // useEffect(() => {
  //   fetchUserProfile();
  //   fetchHomeApi();
  // }, [shouldRefetch]);

  // useEffect(() => {
  //   GetExchangeRates();
  // }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshString(Date.now().toString());
    try {
      fetchHomeApi();
      GetExchangeRates();
      getUserNotifications();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const [visible, setVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);
      fadeIn();
      return () => fadeOut();
    }, []),
  );

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    fadeOut();
    setVisible(false);
  };

  const renderCountryItem = ({ item }: { item: (typeof countries)[0] }) => (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b border-gray-200 w-full"
      onPress={() => {
        setSelectedCountry(item);
        setModalVisible(false);
      }}
    >
      <Image source={item.flag} className="w-5 h-5" />
      <Text className="ml-3 text-base">
        {item.name} ({item.currency})
      </Text>
    </TouchableOpacity>
  );

  const renderPrice = () => {
    return balanceVisible
      ? `${currencySign}${formatBalance(convertedBalance)}`
      : "****";
  };

  const renderCurrencyItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="py-3 border-b border-gray-200 px-5"
      onPress={() => {
        if (selectedCurrencyType === "from") {
          setFromCurrency(item);
        } else {
          setToCurrency(item);
        }
        setCurrencyModalVisible(false);
      }}
      style={{ flexDirection: "row", gap: 10 }}
    >
      <Image
        source={{ uri: exchangeRates[item]?.logo }}
        style={{ width: 20, height: 20, borderRadius: 50, borderWidth: 0.5 }}
        resizeMode="cover"
      />

      <Text className="text-base">{item}</Text>
    </TouchableOpacity>
  );

  const kycTasks = userProfile
    ? getKycTasks(userProfile.kyc_status, userProfile.username)
    : [];

  const unreadNotifications = Array.isArray(notifications)
    ? notifications.filter((n) => n.read_at === null)
    : [];

  function kycVerified(callback: VoidFunction) {
    const isVerified = isKYCVerified();
    if (isVerified) {
      callback();
    } else {
      showErrorToast({
        title: "KYC Not Verified",
        desc: "Please complete your KYC to use this feature",
      });
    }
  }

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logotUser(),
      },
    ]);
  }

  async function logotUser() {
    try {
      await apiService.logout();
      useAuthStore.getState().logout();
      await AsyncStorage.clear();
      navigationWithReset(navigation, "login");
    } catch (error) {
      navigationWithReset(navigation, "login");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      <View
        className={cn(
          "flex-row justify-between items-center mx-2 sm:mx-4 mb-2 sm:mb-3",
          IS_ANDROID_DEVICE && "mt-10",
        )}
      >
        <View className="flex-row mt-4 sm:mt-8 justify-center items-center p-4">
          <TouchableOpacity
            onPress={() => {
              kycVerified(() => {
                router.push({ pathname: "/MyAccount" });
              });
            }}
          >
            <View className="relative">
              {userProfile?.profile_photo ? (
                <Image
                  source={{
                    uri: userProfile?.profile_photo,
                  }}
                  style={{
                    width: 35,
                    height: 35,
                    marginRight: 8,
                    borderRadius: 50,
                    backgroundColor: "#333",
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require("../../assets/logos/lo.jpg")}
                  style={{
                    width: 30,
                    height: 30,
                    marginRight: 8,
                    borderRadius: 10,
                    backgroundColor: "#333",
                  }}
                  resizeMode="stretch"
                />
              )}
              <Image
                source={profileBadges[userProfile?.level || "green"]}
                className="w-5 h-5 absolute bottom-[-5px] right-0"
              />
            </View>
          </TouchableOpacity>
          <Text className="text-[17px] font-bold ml-1">
            Hi,{" "}
            {profileLoading
              ? "..."
              : userProfile?.first_name
                ? shortenText(userProfile.first_name, 12)
                : "User!"}
          </Text>
        </View>
        <View className="flex-row gap-3 sm:gap-4 mt-4 sm:mt-8 mr-4">
          <TouchableOpacity
            onPress={() => {
              kycVerified(() => {
                router.push({ pathname: "/QrCodeMain" });
              });
            }}
          >
            <MaterialIcons name="qr-code" size={23} color="#1400FB" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/Rates")}>
            {/* <Image
              source={require("../../assets/icons/convert-card.png")}
              className="w-6 h-6 sm:w-6 sm:h-6"
            /> */}
            <MaterialIcons name="currency-exchange" size={23} color="#0000ff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/Notification")}
            style={{ position: "relative" }}
          >
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={23}
              color="#1400FB"
            />
            {unreadNotifications.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -1,
                  right: -1,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: COLORS.red,
                }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              kycVerified(() => {
                router.push("/Profile");
              });
            }}
          >
            <Feather name="menu" size={23} color="#1400FB" />
          </TouchableOpacity>
          {!profileLoading && userProfile?.kyc_status !== "verified" && (
            <TouchableOpacity onPress={handleLogout}>
              <MaterialIcons name="logout" size={22} color="#1400FB" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* <StatusBar style="dark" /> */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="bg-white rounded-lg mx-4 my-2 p-5">
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-gray-100 px-3 py-1 rounded-full self-start mb-2"
            onPress={() => setModalVisible(true)}
          >
            <Image source={selectedCountry.flag} className="w-5 h-5" />
            <Text>
              {selectedCountry.name} ({selectedCountry.currency})
            </Text>
            <AntDesign name="down" size={16} color="#666" />
          </TouchableOpacity>
          <View className="flex-row justify-between items-center">
            <Text className="text-[20px] font-bold flex-1 mr-2">
              {balanceVisible
                ? `${selectedCountry.code} ${
                    profileLoading
                      ? "Loading..."
                      : formatBalance(convertedBalance)
                  }`
                : "**** **** **"}
            </Text>
            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
            >
              <AntDesign
                name={balanceVisible ? "eye" : "eyeo"}
                size={30}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-center gap-6 mt-5">
            <TouchableOpacity
              className="items-center"
              onPress={() => {
                kycVerified(() => {
                  router.push("/Transfer");
                });
              }}
            >
              <View className="bg-white p-3 rounded-full shadow-black shadow-2xl">
                <MaterialCommunityIcons name="bank" size={18} color="#1400FB" />
              </View>
              <Text className="text-base font-medium mt-1">Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => {
                kycVerified(() => {
                  router.push("/AddMoney");
                });
              }}
            >
              <View className="bg-white p-3 rounded-full shadow-black shadow-2xl">
                <AntDesign name="plus" size={18} color="#1400FB" />
              </View>
              <Text className="text-base font-medium mt-1">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => {
                kycVerified(() => {
                  setTransferSource("normal");
                  router.push("/(tabs)/transfer");
                });
              }}
            >
              <View className="bg-white p-3 rounded-full shadow-black shadow-2xl">
                <SimpleLineIcons
                  name="arrow-down-circle"
                  size={18}
                  color="#1400FB"
                />
              </View>
              <Text className="text-base font-medium mt-1">Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => {
                kycVerified(() => {
                  setModalConvertVisible(true);
                });
              }}
            >
              <View className="bg-white p-3 rounded-full shadow-black shadow-2xl">
                <MaterialIcons
                  name="currency-exchange"
                  size={18}
                  color="#1400FB"
                />
              </View>
              <Text className="text-base font-medium mt-1">Convert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Only show account setup section if KYC is not verified or username is null */}
        {(userProfile?.kyc_status !== "verified" ||
          userProfile?.username === null) && (
          <View className="mt-4 mb-2">
            {userProfile && (
              <View className="flex-row items-center gap-3 w-full mx-5 mb-2 mt-3">
                <AntDesign
                  name="exclamationcircle"
                  size={18}
                  color={COLORS.danger}
                />
                <Text className="text-[17px] font-bold text-gray-600">
                  Complete Account Setup
                </Text>
              </View>
            )}

            {kycTasks.map((task) => (
              <TouchableOpacity
                activeOpacity={0.7}
                key={task.id}
                // disabled={task.status !== "unverified"}
                disabled={
                  task.title === "Complete KYC" && task.status === "pending"
                }
                className="bg-white rounded-xl h-20 mx-4 p-3"
                onPress={() => router.push(task.route)}
              >
                <View className="flex-row items-center justify-between mt-1">
                  <View className="flex-row items-center gap-4">
                    <View
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${task.color}20` }}
                    >
                      <Feather name={task.icon} size={22} color={task.color} />
                    </View>

                    <Text className="text-[15px] font-semibold mr-3">
                      {task.title}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          task.status === "unverified"
                            ? "#FFE5CC"
                            : task.status === "pending"
                              ? "#fdf6b2"
                              : "#fde8e8",
                      }}
                    >
                      <Text
                        className="text-sm font-semibold capitalize"
                        style={{
                          color:
                            task.status === "unverified"
                              ? "#FF9500"
                              : task.status === "pending"
                                ? "#723b13"
                                : "#c81e1e",
                        }}
                      >
                        {task.status}
                      </Text>
                    </View>

                    {task.status !== "pending" && (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color="black"
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="mx-4 mb-4 mt-4">
          <ImageBackground
            source={require("../../assets/images/money-exchange-bg.png")}
            style={{ backgroundColor: "#333" }}
            imageStyle={{ backgroundColor: "#333" }}
            className="w-full h-55 rounded-xl overflow-hidden justify-center items-center bg-gray-600"
          >
            <View className="px-3 py-6">
              <Text className="text-white text-[19px] font-bold mb-4">
                Money Exchange
              </Text>
              <View className="min-h-5 justify-center overflow-hidden">
                <Animated.Text
                  className="text-white text-base text-[18px]"
                  style={{ opacity: fadeAnim }}
                >
                  {subtitles[currentSubtitleIndex]}
                </Animated.Text>
              </View>
              <View className="flex-row gap-14 justify-between mt-6">
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.payButton}
                  onPress={() => {
                    kycVerified(() => {
                      router.push("/BuyCryptoScreen");
                    });
                  }}
                >
                  <Feather name="arrow-down" size={18} color="#45bf55" />
                  <Text className="text-white font-bold">Buy Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.payButton}
                  onPress={() => {
                    kycVerified(() => {
                      router.push("/SellCryptoScreen");
                    });
                  }}
                >
                  <Text className="text-white font-bold">Sell Now</Text>
                  <Feather name="arrow-up" size={18} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View className="mx-4 mt-3">
          <View className="flex-row flex-wrap justify-between">
            <ImageBackground
              source={require("../../assets/bg-1.png")}
              className="w-[48%] rounded-xl overflow-hidden mb-4"
            >
              <TouchableOpacity
                onPress={() => {
                  kycVerified(() => {
                    router.push("/Africa");
                  });
                }}
                style={styles.africaButton}
                className="flex-1 justify-between p-4"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-2">
                  <MaterialIcons
                    name="currency-exchange"
                    size={14}
                    color="#0000ff"
                  />

                  <Text className="text-[12.4px] font-bold">
                    International Transfer
                  </Text>
                </View>

                <View>
                  <Text className="text-[12px] font-bold mt-2">
                    Send money to Africa
                  </Text>
                  <Text className="text-[12px] mt-1">
                    Send money to your family & friends in Africa Instantly.
                    Send to their Local Bank account or Mobile wallet in less
                    than a minute.
                  </Text>
                </View>

                <View>
                  {balanceVisible ? (
                    <Text className="text-[14px] text-center font-bold mt-2">
                      ₦
                      {HomeData
                        ? formatCurrency(HomeData.send_to_africa_total)
                        : "0.00"}
                    </Text>
                  ) : (
                    <Text className="text-[14px] text-center font-bold mt-2">
                      ₦******
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </ImageBackground>

            <ImageBackground
              source={require("../../assets/bg-2.png")}
              className="w-[48%] rounded-xl overflow-hidden p-4 mb-4"
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  kycVerified(() => {
                    router.push("/Abroad");
                  });
                }}
                className="flex-1 justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <MaterialIcons
                    name="currency-exchange"
                    size={14}
                    color="#0000ff"
                  />
                  <Text className="text-[12.4px] font-bold">
                    International Transfer
                  </Text>
                </View>

                <View>
                  <Text className="text-[12px] font-bold mt-2">
                    Send money Abroad
                  </Text>

                  <Text className="text-[12px] mt-1">
                    Send money Globally. Send to Europe, UK, US instantly with
                    low rates. Send to Local US, UK and EUR bank accounts.
                    Transfer at Low rates
                  </Text>
                </View>

                <View>
                  {balanceVisible ? (
                    <Text className="text-[14px] text-center font-bold mt-2">
                      ₦
                      {HomeData
                        ? formatCurrency(HomeData.international_transfer_total)
                        : "0.00"}
                    </Text>
                  ) : (
                    <Text className="text-[14px] text-center font-bold mt-2">
                      ₦******
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </ImageBackground>

            {isHoldingsEnabled && (
              <ImageBackground
                source={require("../../assets/bg-2.png")}
                className="w-[48%] rounded-xl overflow-hidden p-4  mb-4"
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    kycVerified(() => {
                      router.push("/HardCurrency");
                    });
                  }}
                  className="flex-1 justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <Image
                      source={require("../../assets/icons/ring.png")}
                      className="w-6 h-6"
                    />
                    <Text className="text-[12.4px] font-bold">Holdings</Text>
                  </View>
                  <View>
                    <Text className="text-[12px] font-bold mt-2">
                      Save in Hard Currency
                    </Text>
                    <Text className="text-[12px] mt-1">
                      Save money in hard currency (USD, EUR, GBP) and Gold.
                      Protect your money from inflation and make a profit when
                      the rates go high.
                    </Text>
                  </View>
                  <View>
                    {balanceVisible ? (
                      <Text className="text-[14px] text-center font-bold mt-2">
                        ₦
                        {HomeData
                          ? formatCurrency(HomeData.holdings_total)
                          : "0.00"}
                      </Text>
                    ) : (
                      <Text className="text-[14px] text-center font-bold mt-2">
                        ₦******
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </ImageBackground>
            )}

            {isInvestmentsEnabled && (
              <ImageBackground
                source={require("../../assets/bg-1.png")}
                className="w-[48%] rounded-xl overflow-hidden mb-4 relative"
              >
                <TouchableOpacity
                  onPress={() => {
                    kycVerified(() => {
                      router.push("/Stock");
                    });
                  }}
                  style={styles.africaButton}
                  className="flex-1 justify-between p-4"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-2">
                    <Image
                      source={require("../../assets/icons/ring.png")}
                      className="w-6 h-6"
                    />
                    <Text className="text-[12.4px] font-bold">Investments</Text>
                  </View>
                  <View>
                    <Text className="text-[12px] font-bold mt-2">
                      {isCryptoEnabled
                        ? "Invest in Stocks & Crypto"
                        : "Invest in Stocks"}
                    </Text>
                    <Text className="text-[12px]">
                      {isCryptoEnabled
                        ? "Invest in Stocks & Crypto. Make a huge profit on your Investment when the percentage on each Stock or Crypto Go up."
                        : "Invest in Stocks. Make a huge profit on your Investment when the percentage on each Stock Go up."}
                    </Text>
                  </View>

                  <View>
                    {balanceVisible ? (
                      <Text className="text-[14px] text-center font-bold mt-2">
                        ₦
                        {HomeData
                          ? formatCurrency(HomeData.investments_total)
                          : "0.00"}
                      </Text>
                    ) : (
                      <Text className="text-[14px] text-center font-bold mt-2">
                        ₦******
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </ImageBackground>
            )}

            <ImageBackground
              source={require("../../assets/bg-1.png")}
              className="w-[48%] rounded-xl overflow-hidden mb-4"
            >
              <TouchableOpacity
                style={styles.africaButton}
                className="flex-1 justify-between p-4"
                onPress={() => {
                  kycVerified(() => {
                    router.push("/AjoSavings");
                  });
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="download" size={19} color="#0000ff" />
                  <Text className="text-[12.4px] font-bold">Ajo Savings</Text>
                </View>
                <View>
                  <Text className="text-[12px] font-bold mt-2">
                    Ajo Savings
                  </Text>
                  <Text className="text-[12px] mt-1">
                    Create daily, weekly, monthly & yearly Ajo Savings with
                    SwiftPay. Save your money securely and make swift
                    withdrawals
                  </Text>
                </View>
                <View>
                  {balanceVisible ? (
                    <Text className="text-[14px] text-center font-bold mt-2">
                      ₦
                      {HomeData
                        ? formatCurrency(HomeData.ajo_savings_balance)
                        : "0.00"}
                    </Text>
                  ) : (
                    <Text className="text-[14px] text-center font-bold mt-2">
                      ₦******
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </ImageBackground>

            <ImageBackground
              source={require("../../assets/bg-2.png")}
              className="w-[48%] rounded-xl overflow-hidden p-4 mb-4"
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  kycVerified(() => {
                    router.push("/AjoContribution");
                  });
                }}
                className="flex-1 justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="download" size={18} color="#0000ff" />
                  <Text className="text-[12.4px] font-bold">
                    Ajo Contribution
                  </Text>
                </View>

                <View>
                  <Text className="text-[12px] font-bold mt-2">
                    Ajo Contribution
                  </Text>
                  <Text className="text-[12px] mt-1">
                    Create weekly, monthly & yearly Ajo Contribution easily.
                    Each member will get paid the total amount contributed in
                    every round
                  </Text>
                  <View></View>
                </View>

                {balanceVisible ? (
                  <Text className="text-[14px] text-center font-bold mt-2">
                    ₦
                    {HomeData
                      ? formatCurrency(HomeData.ajo_contribution_wallet)
                      : "0.00"}
                  </Text>
                ) : (
                  <Text className="text-[14px] text-center font-bold mt-2">
                    ₦******
                  </Text>
                )}
              </TouchableOpacity>
            </ImageBackground>
          </View>
        </View>

        <AppPopop />

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 justify-center items-center bg-black/50"
            onPress={() => setModalVisible(false)}
          >
            <View className="w-4/5 bg-white rounded-lg p-4">
              <Text className="text-lg font-bold mb-4">Select Currency</Text>
              <FlatList
                data={countries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          transparent={true}
          animationType="slide"
          visible={modalConvertVisible}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            {LoadingExchageRate == false ? (
              <View className="w-4/5 bg-white rounded-lg p-4">
                <Text className="font-bold mb-4 text-[19px]">
                  Currency Converter
                </Text>
                <Text className="text-[17px] mb-1 font-medium">Amount</Text>
                <TextInput
                  // className="border border-gray-300 p-2 rounded-lg mb-4"
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <View className="flex-row justify-between items-center mb-4">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCurrencyType("from");
                      setCurrencyModalVisible(true);
                    }}
                    style={{ alignItems: "center", flexDirection: "row" }}
                  >
                    <Image
                      source={{ uri: exchangeRates[fromCurrency]?.logo }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 50,
                        borderWidth: 0.5,
                      }}
                      resizeMode="cover"
                    />
                    <Text className="text-lg font-bold pl-2 pr-1 py-2">
                      {fromCurrency}
                    </Text>
                    <AntDesign name="down" size={14} color="black" />
                  </TouchableOpacity>
                  <Text className="text-2xl">⇄</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCurrencyType("to");
                      setCurrencyModalVisible(true);
                    }}
                    style={{ alignItems: "center", flexDirection: "row" }}
                  >
                    <Image
                      source={{ uri: exchangeRates[toCurrency]?.logo }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 50,
                        borderWidth: 0.5,
                      }}
                      resizeMode="cover"
                    />

                    <Text className="text-lg font-bold pl-2 pr-1 py-2">
                      {toCurrency}
                    </Text>
                    <AntDesign name="down" size={14} color="black" />
                  </TouchableOpacity>
                </View>
                <Text className="text-[16px] mb-1 font-medium">
                  Converted Amount
                </Text>
                <TextInput
                  // className="border border-gray-300 p-2 rounded-lg mb-4"
                  style={styles.input}
                  editable={false}
                  value={
                    convertedAmount
                      ? `${toCurrency} ${
                          convertedAmount
                            ? formatCurrency(convertedAmount)
                            : 0.0
                        }`
                      : ""
                  }
                  placeholderTextColor="#000"
                />

                <Button text="Convert" onPress={handleConvert} />

                <Button
                  text="Close"
                  onPress={() => setModalConvertVisible(false)}
                  outlined
                />
              </View>
            ) : (
              <ActivityIndicator size={"large"} />
            )}
          </View>
          <Modal
            transparent={true}
            animationType="slide"
            visible={currencyModalVisible}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="w-4/5 bg-white rounded-lg p-4 h-1/2">
                <Text className="text-lg font-bold mb-4">Select Currency</Text>
                <FlatList
                  data={Object.keys(exchangeRates)}
                  renderItem={renderCurrencyItem}
                  keyExtractor={(item) => item}
                />
                <TouchableOpacity
                  className="bg-red-500 p-3 rounded-lg items-center mt-4"
                  onPress={() => setCurrencyModalVisible(false)}
                >
                  <Text className="text-white font-bold">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Modal>

        <BottomSheet
          isVisible={isAllowBiometric}
          onBackdropPress={() => setIsAllowBiometric(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>
                Allow Biometric Login?
              </Text>
            </View>
            <Text style={styles.desc}>
              Login with biometric. it's smoother, faster and more secure. you
              can activate this later on your settings
            </Text>

            <View style={styles.imageContainer}>
              <Image
                source={FaceId as ImageSourcePropType}
                style={styles.biometricImage}
              />
              <Image
                source={Touch as ImageSourcePropType}
                style={styles.biometricImage}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.nextButton}
              onPress={handleAllowBiometric}
            >
              <Text style={styles.nextButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cancelButton}
              onPress={handleMaybeLater}
            >
              <Text style={styles.cancelButtonText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  africaButton: {
    backgroundColor: "rgba(59, 112, 197, 0.3)",
    // height: 185,
    flex: 1,
  },
  payButton: {
    backgroundColor: "#2E2380",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#EFF3FD",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  cancelButtonText: {
    color: "#0000ff",
    fontSize: 18,
    fontWeight: "500",
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
    fontWeight: "700",
    marginBottom: 5,
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
    color: "#0000ff",
  },
  desc: {
    textAlign: "center",
    fontWeight: "400",
    color: "#888",
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 35,
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    marginBottom: 20,
  },
  biometricImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 12,
  },
});

export default Index;
