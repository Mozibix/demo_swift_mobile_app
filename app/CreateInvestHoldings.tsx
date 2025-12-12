import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import KAScrollView from "@/components/ui/KAScrollView";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { cn, formatAmount, navigationWithReset } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { BottomSheet } from "@rneui/themed";
import { InvalidateQueryFilters, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";

const API_BASE_URL = "https://swiftpaymfb.com/api";

interface CustomCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
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

const CreateInvestHoldings = () => {
  const [amountToInvest, setAmountToInvest] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dollarRate, setDollarRate] = useState<number>(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { formdata, id, type, hash_id } = useLocalSearchParams();
  const [hasDateBeingSelected, setHasDateBeenSelected] = useState(false);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  interface AssetInfo {
    fixed_fee: number;
    percentage_fee: number;
  }
  const [assetInfo, setAssetInfo] = useState<any>();
  const { hideLoader, displayLoader, verifyPin } = useAuth();

  const investmentDetails = React.useMemo(() => {
    try {
      return formdata ? JSON.parse(formdata as string) : null;
    } catch (error) {
      console.error("Error parsing formdata:", error);
      return null;
    }
  }, [formdata]);

  // showLogs("investmentDetails:", JSON.parse(formdata as string));

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

  function handleDateConfirm(date: Date) {
    setHasDateBeenSelected(true);
    setShowDatePicker(false);
    const formattedDate = date.toISOString().split("T")[0];
    setEndDate(formattedDate);
  }

  const FetchAssetInfo = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      console.log("Token:", token);
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
          position: "top",
        });
        router.replace("/login");
        return;
      }

      const endpoint =
        type === "stock"
          ? `${API_BASE_URL}/investments/create?type=${type}&type_id=${id}`
          : `${API_BASE_URL}/investments/create?type=${type}&type_id=${hash_id}`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      // showLogs("Assets Rasp:", response?.data?.data);
      if (response?.data?.status === "success") {
        setAssetInfo(response.data?.data);
        // if (type === "stock") {
        //   const dataArray = response.data?.data;
        //   setAssetInfo(
        //     Array.isArray(dataArray) && dataArray.length > 0
        //       ? dataArray[0]
        //       : null
        //   );
        // } else {
        //   setAssetInfo(response.data?.data);
        // }
      }
    } catch (error: any) {
      console.error("Error fetching asset details:", error);
      setError(
        error?.response?.data?.message || "Failed to fetch investment details"
      );
    } finally {
      setLoading(false);
    }
  };

  function getFee() {
    if (assetInfo?.fixed_fee && assetInfo.percentage_fee) {
      return (
        assetInfo.fixed_fee + (assetInfo.percentage_fee / 100) * +amountToInvest
      );
    }
  }

  useEffect(() => {
    if (investmentDetails || id || hash_id) {
      FetchAssetInfo();
    }
  }, []);

  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await AsyncStorage.getItem("WalletBalance");
        const Rate = await AsyncStorage.getItem("naira_to_dollar_rate");
        if (balance) {
          setWalletBalance(balance);
        }
        if (Rate) {
          setDollarRate(parseFloat(Rate));
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: error?.message || "Error occurred",
          text2: "Oops something went wrong",
          position: "top",
        });
      }
    };

    fetchBalance();
  }, []);

  const handleHoldNow = () => {
    setError(null);
    setIsTransactionPinVisible(true);
  };

  const handleConfirmPayment = async (pin: string) => {
    setError("");
    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (!amountToInvest) {
        Toast.show({
          type: "error",
          text1: "Amount Required",
          text2: "Please enter an amount to invest",
          position: "top",
        });
        setIsTransactionPinVisible(false);
        return;
      }

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      setError(null);

      if (pin !== DEFAULT_PIN) {
        const isValid = await verifyPin(pin);
        if (!isValid) {
          return setError("You entered an invalid PIN, please try again");
        }
      }

      setLoading(true);
      displayLoader();
      setIsTransactionPinVisible(false);

      setIsProcessing(true);

      const fixedFee = assetInfo?.fixed_fee || 0;
      const percentageFee = assetInfo?.percentage_fee || 0;
      const amountNumber = parseFloat(amountToInvest) || 0;

      let finalFee = amountNumber + fixedFee;
      let AllChargeFee = amountNumber + fixedFee + percentageFee;

      let Symbol =
        type === "stock"
          ? investmentDetails?.symbol
          : assetInfo?.crypto?.symbol;

      let Icon =
        type === "stock"
          ? "https://swiftpaymfb.com/trend.png"
          : assetInfo?.crypto?.icon;

      let ChargePercentage =
        type === "stock"
          ? investmentDetails?.change_percent
          : assetInfo?.crypto?.change_percentage;

      let Name =
        type === "stock" ? investmentDetails?.name : assetInfo?.crypto?.name;

      let formdata = {
        asset_name: Name,
        asset_type: type,
        asset_symbol: Symbol,
        asset_icon_url: Icon,
        amount_invested: amountNumber,
        total_with_fees: parseFloat(AllChargeFee),
        change_percentage: ChargePercentage,
        end_date: endDate,
        pin: parseFloat(pin),
      };

      showLogs("Form Data:", formdata);

      const response = await axios.post(
        `${API_BASE_URL}/investments/store`,
        formdata,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      showLogs("RESPONSE", response.data);

      if (response.data.status === "success") {
        console.log("Scuess response:", response.data);
        setIsTransactionPinVisible(false);
        setIsPreviewVisible(true);
        setLoading(false);
        showSuccessToast({
          title: response.data.message,
          desc: "Investment created successfully",
        });

        queryClient.invalidateQueries({
          queries: ["investmentPortfolio"],
        } as InvalidateQueryFilters);
        navigationWithReset(navigation, "InvestDashboard");
      } else {
        setIsTransactionPinVisible(false);
        setLoading(false);
        showErrorToast({
          title: response.data.message,
          desc: "Failed to create investment",
        });
      }
    } catch (error: any) {
      console.log("error:", error.response.data);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";

        showErrorToast({
          title: serverMessage,
          desc: "Opps, failed to create investment",
        });
      }
      setLoading(false);
    } finally {
      setIsProcessing(false);
      setLoading(false);
      hideLoader();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingComp visible={loading} />
      {/* Title */}
      <View className={cn(IS_IOS_DEVICE ? "mx-5" : "mt-12")}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="left" size={20} />
          </TouchableOpacity>
          <Text style={styles.title}>Invest in {investmentDetails.name}</Text>
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
                ₦{formatAmount(+walletBalance)}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Asset Name</Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.assetText}>
              {type === "stock"
                ? investmentDetails?.name
                : investmentDetails?.name}
            </Text>
          </View>

          <Text style={styles.label}>Asset Percentage Change (%)</Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.assetText}>
              {investmentDetails?.change_percentage?.toFixed(2) ||
                investmentDetails?.change_percent?.toFixed(2)}
            </Text>
          </View>

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
            <Text style={styles.rateLabel}>Fee:</Text>
            <Text style={styles.rateValue}>
              ₦{amountToInvest ? getFee().toFixed(2) : 0}
            </Text>
          </View>

          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.input2}
          >
            <Text style={{ color: endDate ? "#000" : "#A9A9A9" }}>
              {endDate || "Select End Date"}
            </Text>
          </TouchableOpacity>

          {/* {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={"default"}
              onChange={handleDateChange}
              style={{ marginTop: 7, marginLeft: -10 }}
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

          <Button
            text="Invest Now"
            disabled={!agreeTerms || !amountToInvest || !endDate}
            onPress={handleHoldNow}
          />
        </KAScrollView>

        {/* <PinEntryBottomSheet
          isVisible={isTransactionPinVisible}
          onClose={() => setIsTransactionPinVisible(false)}
          onConfirm={handleConfirmPayment}
          isProcessing={loading}
        /> */}

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View className="bg-white mb-2">
            {error && (
              <Text className="text-danger font-medium text-[16px] text-center py-1">
                {error}
              </Text>
            )}
          </View>

          <PinComponent
            onComplete={(pin: string) => {
              handleConfirmPayment(pin);
            }}
            setModalState={setIsTransactionPinVisible}
          />
        </BottomSheet>

        <Toast />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    padding: 14,
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
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    marginBottom: 10,
  },
  rateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#D3E3FD",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignSelf: "center",
  },
  rateLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  rateValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
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
    padding: 14,
    color: "#000",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    marginTop: 20,
    color: "#000",
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
  otpContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 15,
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
});

export default CreateInvestHoldings;
