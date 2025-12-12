import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import KAScrollView from "@/components/ui/KAScrollView";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { DEFAULT_PIN } from "@/constants";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import {
  _TSFixMe,
  formatAmount,
  getErrorMessage,
  navigationWithReset,
} from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface CustomCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  metal?: {
    metal: string;
    price?: number;
  };
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  value,
  onValueChange,
}) => {
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)}>
      <View
        style={{
          width: 20,
          height: 20,
          backgroundColor: value ? "blue" : "white",
          borderRadius: 5,
          borderWidth: 2,
          borderColor: "gray",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
    </TouchableOpacity>
  );
};

const HoldingsSaveInHardCurrency = () => {
  const { assetInfo, type } = useLocalSearchParams();
  const parsedInfo = JSON.parse((assetInfo as string) || "");
  // showLogs("parsedInfo", parsedInfo);
  const [amountToInvest, setAmountToInvest] = useState("");
  const [assetName, setAssetName] = useState(
    parsedInfo.currency || parsedInfo.data.currency.metal || ""
  );
  const [assetPrice, setAssetPrice] = useState(
    parsedInfo.rate?.toString() ||
      parsedInfo?.data?.currency?.price?.toString() ||
      ""
  );
  const [selectedAsset, setSelectedAsset] = useState(
    parsedInfo.currency || parsedInfo.data.currency.metal
  );
  const [selectedAssetType, setSelectedAssetType] = useState(type);
  const [selectedAssetId, setSelectedAssetId] = useState(
    parsedInfo.id || parsedInfo.data.currency.id
  );
  interface AssetData {
    currency?: {
      currency: string;
      code: string;
      price: number;
      rate: number;
      logo_url?: string;
    };
    type?: string;
    fixed_fee?: number;
    percentage_fee?: number;
  }
  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [endDate, setEndDate] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userProfile, setUserProfile] = useState<any>();
  const [loading, setLoading] = useState(true);
  interface Holdings {
    fiats: {
      code: ReactNode;
      rate: ReactNode;
      currency_symbol: ReactNode;
      price: ReactNode;
      logo_url: string | undefined;
      id: string;
      currency: string;
    }[];
    metals: { id: string; metal: string }[];
  }
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holdings | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const navigation = useNavigation();

  const handleChooseAsset = () => {
    router.push("/Fiats");
  };
  const [hasDateBeingSelected, setHasDateBeenSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [activeTab, setActiveTab] = useState<"Fiat" | "Metals">("Fiat");
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { hideLoader, displayLoader, verifyPin, getUserProfile } = useAuth();

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  function handleDateConfirm(date: Date) {
    setHasDateBeenSelected(true);
    setShowDatePicker(false);
    const formattedDate = date.toISOString().split("T")[0];
    setEndDate(formattedDate);
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

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

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);

    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();

    setEndDate(`${day}-${month}-${year}`);
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      setLoading(true);

      const response = await axios.get(
        "https://swiftpaymfb.com/api/holdings/assets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // showLogs("response.data?.data", response.data?.data);
      if (response?.data?.status === "success") {
        setHoldings(response.data?.data);
      }
    } catch (error: any) {
      setLoading(false);
      const errMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.message || "An error occurred"
          : "Network error. Please try again.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errMessage,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssetType && selectedAssetId) {
      FetchAssetInfo();
    }
  }, [selectedAssetId, selectedAssetType]);

  function getFee() {
    if (assetData?.fixed_fee && assetData.percentage_fee) {
      return (
        assetData.fixed_fee + (assetData.percentage_fee / 100) * +amountToInvest
      );
    }
  }

  const FetchAssetInfo = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      setLoading(true);

      const response = await axios.get(
        `https://swiftpaymfb.com/api/holdings/create?type=${selectedAssetType}&type_id=${selectedAssetId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // showLogs("fetched Assets:", response.data?.data);
      // console.log("fetched Assets:", response.data?.data?.type);

      if (response?.data?.status === "success") {
        setAssetData(response.data?.data);
      }
    } catch (error: any) {
      setLoading(false);
      const errMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.message || "An error occurred"
          : "Network error. Please try again.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errMessage,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyHoldingDetails = () => {
    if (!amountToInvest) {
      return showErrorToast({
        title: "Amount Required",
        desc: "Please enter an amount to invest",
      });
    }
    if (!agreeTerms) {
      return showErrorToast({
        title: "Please accept terms and condition",
        desc: "You did not accept condition",
      });
    }

    if (!endDate) {
      return showErrorToast({
        title: "Date Required",
        desc: "Please enter a valid date",
      });
    }

    if (!selectedAsset) {
      return showErrorToast({
        title: "Asset Required",
        desc: "Please select an asset",
      });
    }

    setShowOtp(true);
  };

  const handleHolding = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      displayLoader();
      setShowOtp(false);

      const fee = getFee() || 0;
      const percentageFee = assetData?.percentage_fee || 0;
      const amountNumber = parseFloat(amountToInvest) || 0;

      let finalFee = amountNumber + fee;
      let AllChargeFee = amountNumber + fee;

      let AssetName =
        selectedAssetType === "fiat"
          ? assetData?.currency?.currency
          : (assetData as _TSFixMe)?.metal?.metal;

      let AssetSymbol =
        selectedAssetType === "fiat"
          ? assetData?.currency?.code
          : (assetData as _TSFixMe)?.metal?.metal;

      let AssetPrice =
        selectedAssetType === "fiat"
          ? assetData?.currency?.rate
          : (assetData as _TSFixMe)?.metal?.price;

      let AssetLogo =
        selectedAssetType === "fiat"
          ? assetData?.currency?.logo_url
          : "https://swiftpaymfb.com/metal.png";

      const holdingDetails = {
        asset_name: AssetName,
        asset_type: assetData?.type,
        asset_symbol: AssetSymbol,
        asset_price: AssetPrice,
        asset_amount: (amountNumber / AssetPrice).toFixed(4),
        amount_to_invest: amountNumber,
        total_with_fees: parseFloat(AllChargeFee.toString()),
        end_date: endDate,
        icon_url: AssetLogo,
        pin: parseFloat(pin),
      };

      showLogs("FormData:", holdingDetails);
      hideLoader();

      const response = await axios.post(
        `${API_BASE_URL}/holdings/store`,
        holdingDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        setAmountToInvest("");
        showSuccessToast({
          title: response.data.message || "Holding created",
          desc: "Investment created successfully",
        });
        setTimeout(() => {
          navigationWithReset(navigation, "HoldingsInvest");
        }, 500);
      }
    } catch (error: any) {
      console.log(error);
      const firstErrorMessage = getErrorMessage(error);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: firstErrorMessage || serverMessage,
          text2: "Opps, failed please try again",
          position: "top",
        });
      }
    } finally {
      hideLoader();
    }
  };

  // showLogs("parsedInfo", parsedInfo);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="left" size={20} />
          </TouchableOpacity>
          <Text style={styles.title}>Holdings Save In Hard Currency</Text>
        </View>

        <KAScrollView>
          <Text style={styles.label}>SwiftPay Balance</Text>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceLabel}>
              <Image
                style={styles.logo}
                source={require("../assets/icons/icon.png")}
              />
              <Text style={styles.swiftPayText}>SwiftPay Balance</Text>
            </View>
            <View style={styles.balanceInput}>
              <Text style={styles.balance}>
                ₦ {formatAmount(userProfile?.wallet_balance)}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Asset Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Asset Name"
            placeholderTextColor="#A9A9A9"
            value={assetName}
            onChangeText={setAssetName}
          />

          <Text style={styles.label}>Asset Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Asset Price"
            placeholderTextColor="#A9A9A9"
            value={assetPrice}
            onChangeText={setAssetPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Amount To Invest (In Naira)</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount To Invest"
            placeholderTextColor="#A9A9A9"
            keyboardType="numeric"
            value={amountToInvest}
            onChangeText={setAmountToInvest}
          />

          <View style={styles.rateContainer}>
            <View style={styles.ratesWrapper}>
              <Text style={styles.rateLabel}>Fee:</Text>
              <Text style={styles.rateValue}>
                ₦{amountToInvest ? getFee() : 0}
              </Text>
            </View>

            <View style={styles.ratesWrapper} className="mt-3">
              <Text style={styles.rateLabel}>You will get:</Text>
              <Text style={[styles.rateValue, { color: COLORS.greenText }]}>
                {(+amountToInvest / assetPrice).toFixed(4)}{" "}
                {parsedInfo.code || parsedInfo.data.currency.metal || ""}
              </Text>
            </View>
          </View>

          {/* <Text style={styles.label}>Choose Asset</Text>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => setShowAssets(true)}
          >
            <Text style={styles.assetText}>
              {selectedAsset || "Select Asset"}
            </Text>
          </TouchableOpacity> */}

          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.input2}
          >
            <Text style={{ color: hasDateBeingSelected ? "#000" : "#A9A9A9" }}>
              {endDate || "Select End Date"}
            </Text>
          </TouchableOpacity>

          {/* {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="calendar"
              onChange={handleDateChange}
            />
          )} */}

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={(date) => handleDateConfirm(date)}
            onCancel={() => setShowDatePicker(false)}
            buttonTextColorIOS={"#000"}
            textColor={"#000"}
            minimumDate={new Date()}
            customCancelButtonIOS={() => (
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="bg-[#fca5a5] p-3 rounded-lg mb-2"
              >
                <Text className="text-[#991b1b] text-[23px] text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
            pickerContainerStyleIOS={{
              backgroundColor: "#fff",
            }}
          />

          <View style={styles.termsContainer}>
            <CustomCheckbox value={agreeTerms} onValueChange={setAgreeTerms} />
            <Text style={styles.termsText}>
              I Have Read And Agree To The Terms & Conditions And Privacy Policy
            </Text>
          </View>

          <Button text="Hold Now" onPress={verifyHoldingDetails} />
        </KAScrollView>
      </View>

      <BottomSheet
        isVisible={showAssets}
        onBackdropPress={() => setShowAssets(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle2}>Select assets</Text>
          </View>
          <View>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "Fiat" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("Fiat")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "Fiat" && styles.activeTabText,
                  ]}
                >
                  Fiat
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "Metals" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("Metals")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "Metals" && styles.activeTabText,
                  ]}
                >
                  Metals
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.content}
            >
              {loading ? (
                <LoadingComp visible />
              ) : activeTab === "Fiat" ? (
                <>
                  {holdings?.fiats?.map((fiat: any) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={fiat.id}
                      style={styles.itemContainer}
                      onPress={() => {
                        setSelectedAsset(fiat.currency);
                        setSelectedAssetId(fiat.id);
                        setSelectedAssetType("fiat");
                        setShowAssets(false);
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Image
                          source={{ uri: fiat.logo_url }}
                          style={styles.icon}
                          contentFit="contain"
                          transition={200}
                        />
                        <View style={{}}>
                          <Text style={styles.titl}>{fiat.code}</Text>
                          <Text style={styles.subText}>
                            {fiat.currency_symbol}
                            {fiat.rate} <AntDesign name="arrowright" />{" "}
                            {fiat.currency_symbol}
                            {fiat.price}
                          </Text>
                        </View>
                      </View>
                      <Image
                        source={require("../assets/portfolio/chart1.png")}
                        style={styles.icon2}
                        contentFit="contain"
                        transition={200}
                      />
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.price}>
                          {fiat.currency_symbol}
                          {fiat.sell_price}
                        </Text>
                        <Text style={styles.sub}>Volume: {fiat.volume}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  {holdings?.metals?.map((metal: any) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={metal.id}
                      style={styles.itemContainer}
                      onPress={() => {
                        setSelectedAsset(metal.metal);
                        setSelectedAssetId(metal.id);
                        setSelectedAssetType("metal");
                        setShowAssets(false);
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Image
                          source={require("../assets/icons/gold.png")}
                          style={styles.icon}
                          contentFit="contain"
                          transition={200}
                        />
                        <View style={{}}>
                          <Text style={styles.title}>
                            {metal.metal.toUpperCase()}
                          </Text>
                          <Text style={styles.subText}>
                            ${Number(metal.price).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <Image
                        source={require("../assets/images/line2.png")}
                        style={styles.icon2}
                        contentFit="contain"
                        transition={200}
                      />
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.price}>
                          ${Number(metal.price).toLocaleString()}
                        </Text>
                        <Text style={styles.sub}>Current Price</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        isVisible={showOtp}
        onBackdropPress={() => setShowOtp(false)}
      >
        <View style={[styles.bottomSheetContent, { padding: 0 }]}>
          {error && (
            <Text className="text-danger font-medium text-[16px] text-center mt-4">
              {error}
            </Text>
          )}

          <PinComponent
            onComplete={(pin: string) => {
              handleHolding(pin);
            }}
            setModalState={setShowOtp}
          />
        </View>
      </BottomSheet>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: 10,
  },
  sub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  content: {
    flex: 1,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
  },
  focusedOtpInput: {
    borderColor: "blue", // Blue border for focused input
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  icon2: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  bottomSheetTitle2: {
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: 15,
    textAlign: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    marginTop: 15,
    color: "#000",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  balanceLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  swiftPayText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  balanceInput: {
    backgroundColor: "#D3E3FD",
    borderRadius: 20,
    padding: 6,
    paddingHorizontal: 15,
  },
  balance: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: "#000",
    // width: "95%",
    // alignSelf: "center",
  },
  rateContainer: {
    backgroundColor: "#D3E3FD",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignSelf: "center",
    marginTop: 15,
  },
  ratesWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  rateValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
  },
  assetText: {
    fontSize: 16,
    color: "#000",
  },
  input2: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    color: "#000",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 10,
    color: "#0000ff",
  },
  holdNowButton: {
    backgroundColor: "#0000FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  holdNowText: {
    color: "#fff",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 20,
  },
  logo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginRight: 10,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
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
  bottomSheetContent: {
    padding: 15,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  titl: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  price: {
    color: "green",
    fontSize: 14,
    fontWeight: "500",
  },
  subText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
  },
  icons: {
    width: 50,
    height: 50,
    resizeMode: "contain",
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
    marginBottom: 30,
  },
  successBottomSheetHeader: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});

export default HoldingsSaveInHardCurrency;
