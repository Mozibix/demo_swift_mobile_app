import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Checkbox } from "react-native-paper";
import CustomSwitch from "@/components/CustomSwitch";
import { BottomSheet } from "@rneui/themed";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatCurrency } from "@/utils/formatters";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import LoadingComp from "@/components/Loading";
import { SafeAreaView } from "react-native";
import KAScrollView from "@/components/ui/KAScrollView";
import Button from "@/components/ui/Button";
import { COLORS } from "@/constants/Colors";
import { cn, formatAmount } from "@/utils";
import PinComponent from "@/components/ui/PinComponent";
import { showSuccessToast } from "@/components/ui/Toast";
import { showLogs } from "@/utils/logger";
import CustomCheckbox from "@/components/ui/CustomCheckbox";
import { DEFAULT_PIN, IS_ANDROID_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import * as WebBroswer from "expo-web-browser";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";

interface pageData {
  locked_savings_interest_rate: string;
  unlocked_savings_interest_rate: string;
  create_savings_fee: string;
  if_has_locked_savings: boolean;
}

const CreateSavings: React.FC = () => {
  const router = useRouter();
  const [savingsName, setSavingsName] = useState("");
  const [amountToSave, setAmountToSave] = useState<number>(0);
  // const [option, setOption] = useState("locked");
  const [schedule, setSchedule] = useState(false); //autosave
  const [AutoSaveAmount, setAutoSaveAmount] = useState<number>(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [selectedTransferType, setSelectedTransferType] = useState<
    string | null
  >(null); // New state for radio buttons
  const [Loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [convertedBalance, setConvertedBalance] = useState(balance);
  const [selectedFrequency, setSelectedFrequency] = useState("Daily");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [FrequencyModal, setFrequencyModal] = useState(false);

  const hadleCancel = () => {
    setIsCustomDateVisible(false); // Hide the transaction pin bottom sheet
  };

  const handleCustomDate = () => {
    setIsCustomDateVisible(true); // Hide the transaction pin bottom sheet
    setIsDateVisible(false); // Show the success bottom sheet
  };

  const handleConfirmDate = () => {
    setIsDateVisible(true); // Show the success bottom sheet
  };

  // Handle option change
  const handleOptionChange = (itemValue: string) => {
    // setOption(itemValue);
    if (itemValue === "locked") {
      setModalVisible(true); // Show modal if locked option is selected
    }
  };
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isCustomDateVisible, setIsCustomDateVisible] = useState(false);
  const [isDateVisible, setIsDateVisible] = useState(false);
  const [isEndDateVisible, setIsEndDateVisible] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsType, setSavingsType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { verifyPin } = useAuth();

  const [UserDetails, setUserDetails] = useState<any>();
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

  const handlePay = () => {
    if (
      Number(UserDetails.wallet_balance) < amountToSave &&
      amountToSave >= 100
    ) {
      setPreviewVisible(false);
      Toast.show({
        type: "error",
        text1: "Validation Failed",
        text2: "Insufficient funds and minimum amount is NGN 100",
        position: "top",
      });
    } else if (savingsName.length < 5) {
      Toast.show({
        type: "error",
        text1: "Validation Failed",
        text2: "Saving name too small",
        position: "top",
      });
      setPreviewVisible(false);
    } else {
      setPreviewVisible(false);
      setIsTransactionPinVisible(true);
    }
  };

  const handleTransferTypeChange = (type: string) => {
    setSelectedTransferType(type);
    if (type === "Swiftpay") {
      router.push("../MultipleSwiftpayTransfer");
    } else if (type === "Bank") {
      router.push("/MultipleBankTransfer");
    }
  };
  // Handle frequency selection
  const handleFrequencySelection = (frequency: string) => {
    setSelectedFrequency(frequency); // Set the selected frequency
    setFrequencyModal(false); // Close the bottom sheet
  };

  // Handle date selection
  const handleDateSelection = (date: string) => {
    setSelectedDate(date); // Set the selected frequency
    setIsDateVisible(false); // Close the bottom sheet
  };

  const handleEndDateSelection = (date: string) => {
    setSelectedEndDate(date); // Set the selected frequency
    setIsEndDateVisible(false); // Close the bottom sheet
  };

  const [selectedDateCalendar, setSelectedDateCalendar] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarEndVisible, setEndCalendarVisible] = useState(false);

  // Function to handle date selection from the calendar
  const onDateSelect = (day: { dateString: React.SetStateAction<string> }) => {
    setSelectedDate(day.dateString);
    setCalendarVisible(false); // Hide calendar after selecting a date
  };

  const onEndateDateSelect = (day: {
    dateString: React.SetStateAction<string>;
  }) => {
    setSelectedEndDate(day.dateString);
    setEndCalendarVisible(false); // Hide calendar after selecting a date
  };

  //user account details
  async function GetUserDetails() {
    const userDetailsString = await AsyncStorage.getItem("UserDetails");
    const data = userDetailsString ? JSON.parse(userDetailsString) : null;

    setUserDetails(data);
  }

  const [PageData, setPageData] = useState<pageData | null>(null);

  //page details
  async function getPageDetails() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }
      GetUserDetails();
      let intigrate = await axios({
        url: "https://swiftpaymfb.com/api/interest-savings/create",
        method: "get",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      setPageData(intigrate.data.data);
    } catch (error: any) {
      console.log(error, error?.response);

      Toast.show({
        type: "error",
        text1: "Failed to fetch data",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmPayment = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }
      // console.log(selectedFrequency.toLowerCase());

      let response = await axios({
        url: "https://swiftpaymfb.com/api/interest-savings/store",
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          name: savingsName,
          type: savingsType,
          amount: amountToSave,
          total_amount: amountToSave + Number(PageData?.create_savings_fee),
          end_date:
            savingsType == "locked"
              ? `${selectedEndDate}`.replace(
                  /(\d{2})-(\d{2})-(\d{4})/,
                  "$3-$2-$1"
                )
              : null,
          if_auto_save: schedule,
          pin,
          auto_save_amount: schedule ? AutoSaveAmount : null,
          frequency: schedule ? selectedFrequency.toLowerCase() : null,
        }),
      });

      showSuccessToast({
        title: "Successfull!",
        desc: "Savings Plan has been created",
      });
      router.back();
    } catch (error: any) {
      showLogs("error saving", error?.response?.data);

      Toast.show({
        type: "error",
        text1: "Payment failed",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setLoading(false);
      setIsTransactionPinVisible(false);
    }
  };

  const openBrowser = async (link: "terms" | "privacy") => {
    const url =
      link === "terms"
        ? "https://swiftpaymfb.com/terms-and-conditions"
        : "https://swiftpaymfb.com/privacy-policy";
    await WebBroswer.openBrowserAsync(url);
  };

  useEffect(() => {
    getPageDetails();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="left" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a new Interest Savings</Text>
      </View>

      <KAScrollView styles={{ marginHorizontal: 15 }}>
        <LoadingComp visible={Loading} />

        <Text style={styles.label}>Name of Savings</Text>
        <TextInput
          style={styles.input}
          placeholder="E.g. Neighbourhood Savings, etc..."
          value={savingsName}
          onChangeText={setSavingsName}
        />

        <Text style={styles.label}>What type of Savings?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowSavingsModal(true)}
          style={styles.input}
        >
          <Text
            className={cn(
              "capitalize text-[15px]",
              savingsType ? "text-black" : "text-gray-200"
            )}
          >
            {savingsType ? savingsType : "Choose a savings type.."}
          </Text>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showSavingsModal}
          onRequestClose={() => setShowSavingsModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowSavingsModal(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  savingsType === "male" && styles.selectedOptionButton,
                ]}
                onPress={() => {
                  setSavingsType("locked");
                  setShowSavingsModal(false);
                  setModalVisible(true);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    savingsType === "locked" && styles.selectedOptionText,
                  ]}
                >
                  Locked
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  savingsType === "unlocked" && styles.selectedOptionButton,
                ]}
                onPress={() => {
                  setSavingsType("unlocked");
                  setShowSavingsModal(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    savingsType === "unlocked" && styles.selectedOptionText,
                  ]}
                >
                  Unlocked
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal */}
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image
                source={require("../assets/notice.png")}
                style={styles.mock}
              />

              <Text style={styles.modalTitle}>Notice</Text>
              <Text style={styles.modalText}>
                Please note that once Locked, user will no longer be able to
                make withdrawals till the date set elapses.
              </Text>

              <Button
                full
                text="Acknowledge"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </View>
        </Modal>

        {/* Amount to Save */}
        <Text style={styles.label}>Amount To Save</Text>
        <TextInput
          style={styles.input}
          placeholder="10,000"
          keyboardType="numeric"
          value={amountToSave.toString()}
          onChangeText={(text) => setAmountToSave(Number(text))}
        />

        {savingsType == "locked" && (
          <>
            <Text style={styles.label}>Choose End Date</Text>
            <TouchableOpacity
              style={[styles.dateInputContainer, styles.dateInputContainer2]}
              onPress={() => setEndCalendarVisible(true)}
            >
              <View style={styles.calendarIcon}>
                <AntDesign name="calendar" size={24} color="black" />
              </View>
              <TextInput
                placeholder="12/09/2024"
                style={styles.inputDate}
                value={selectedEndDate}
                editable={false} // Make input read-only
              />
            </TouchableOpacity>
          </>
        )}

        {/* Balance and Estimated Returns */}
        <Text style={styles.balanceText}>
          SwiftPay Balance:{" "}
          <Text style={{ color: "#0000ff", fontWeight: "500" }}>
            ₦{UserDetails ? formatCurrency(UserDetails?.wallet_balance) : null}
          </Text>
        </Text>
        {/* <Text style={styles.subtext}>
        Transfer From SwiftPay Balance:{" "}
        <Text style={{ color: "#0000ff", fontWeight: "500" }}>N0.00</Text>
      </Text> */}
        <Text style={styles.transferText}>
          If You Save{" "}
          <Text style={{ color: "#0000ff", fontWeight: "500" }}>
            ₦{amountToSave ? formatCurrency(Number(amountToSave)) : 0.0}
          </Text>{" "}
          Your Estimated Returns Will Be
        </Text>
        <View style={styles.returnsContainer}>
          <View style={styles.returnsItem}>
            <Text style={styles.returnsTitle}>Daily</Text>
            <Text style={styles.returnsValue}>
              ₦
              {amountToSave
                ? formatCurrency(
                    ((savingsType == "locked"
                      ? Number(PageData?.locked_savings_interest_rate)
                      : Number(PageData?.unlocked_savings_interest_rate)) *
                      Number(amountToSave)) /
                      100
                  )
                : 0.0}
            </Text>
          </View>
          <View style={styles.returnsItem}>
            <Text style={styles.returnsTitle}>Weekly</Text>
            <Text style={styles.returnsValue}>
              ₦
              {amountToSave
                ? formatCurrency(
                    (((savingsType == "locked"
                      ? Number(PageData?.locked_savings_interest_rate)
                      : Number(PageData?.unlocked_savings_interest_rate)) *
                      Number(amountToSave)) /
                      100) *
                      7
                  )
                : 0.0}
            </Text>
          </View>
          <View style={styles.returnsItem}>
            <Text style={styles.returnsTitle}>Monthly</Text>
            <Text style={styles.returnsValue}>
              ₦
              {amountToSave
                ? formatCurrency(
                    (((savingsType == "locked"
                      ? Number(PageData?.locked_savings_interest_rate)
                      : Number(PageData?.unlocked_savings_interest_rate)) *
                      Number(amountToSave)) /
                      100) *
                      30
                  )
                : 0.0}
            </Text>
          </View>
        </View>

        {/* Schedule Payment */}
        <Animated.View
          style={styles.scheduleContainer}
          entering={FadeInDown.delay(100)}
        >
          <View>
            <Text style={styles.scheduleText}>Schedule This Payment</Text>
            <Text style={styles.subscheduleText}>
              or create a standing order to automatically pay it at specified
              intervals
            </Text>
          </View>
          <CustomSwitch value={schedule} onValueChange={setSchedule} />
        </Animated.View>

        {schedule && (
          <Animated.View
            entering={FadeInDown.delay(100)}
            layout={LinearTransition.springify().damping(14)}
          >
            {/* AutoSave Amount */}
            <Text style={styles.label}>AutoSave Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="10,000"
              keyboardType="numeric"
              value={AutoSaveAmount.toString()}
              onChangeText={(text) => setAutoSaveAmount(Number(text))}
            />

            {/* Frequency Section */}
            <View style={styles.frequencyContainer}>
              <Text style={styles.frequencyTitle}>Frequency</Text>
              <TouchableOpacity onPress={() => setFrequencyModal(true)}>
                <Text style={styles.frequencyValue}>{selectedFrequency}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* <View style={styles.start}>
        <Text style={styles.startText}>Start</Text>
        <TouchableOpacity onPress={handleConfirmDate}>
          <Text style={styles.immediatelyText}>{selectedDate}</Text>
        </TouchableOpacity>
      </View> */}

        {/* Terms and Conditions */}

        <Animated.View
          style={styles.termsContainer}
          layout={LinearTransition.springify().damping(15)}
        >
          <CustomCheckbox
            value={agreeTerms}
            onValueChange={() => setAgreeTerms(!agreeTerms)}
          />

          <Text style={styles.termsText}>
            I Have Read And Agree To{" "}
            <Text style={styles.termsLink} onPress={() => openBrowser("terms")}>
              Terms & Conditions
            </Text>{" "}
            And{" "}
            <Text
              style={styles.termsLink}
              onPress={() => openBrowser("privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>

        <Animated.View layout={LinearTransition.springify().damping(15)}>
          <Button
            text="Proceed"
            disabled={!agreeTerms}
            onPress={() => setPreviewVisible(true)}
          />
        </Animated.View>

        <BottomSheet
          isVisible={FrequencyModal}
          onBackdropPress={() => setFrequencyModal(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.successBottomSheetHeader}>
              Choose a frequency
            </Text>

            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => handleFrequencySelection("Daily")}
                style={styles.option}
              >
                <Ionicons
                  name={
                    selectedFrequency === "Daily"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Daily</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => handleFrequencySelection("Weekly")}
                style={styles.option}
              >
                <Ionicons
                  name={
                    selectedFrequency === "Weekly"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Weekly</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => handleFrequencySelection("Monthly")}
                style={styles.option}
              >
                <Ionicons
                  name={
                    selectedFrequency === "Monthly"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Monthly</Text>
              </TouchableOpacity>
            </View>

            {/* Add the other frequency options */}
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={isDateVisible}
          onBackdropPress={() => setIsDateVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.successBottomSheetHeader}>
              Choose a start date
            </Text>

            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => handleDateSelection("Immediately")}
                style={styles.option}
              >
                <Ionicons
                  name={
                    selectedDate === "Immediately"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Immediately</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.option}>
              <TouchableOpacity
                style={styles.option}
                onPress={handleCustomDate}
              >
                <Ionicons
                  name={
                    selectedDate === "Custom Date"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Choose a custom date</Text>
              </TouchableOpacity>
            </View>

            {/* Add other date options if needed */}
          </View>
        </BottomSheet>
        <BottomSheet
          isVisible={isCustomDateVisible}
          onBackdropPress={() => setIsCustomDateVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.successBottomSheetHeader}>
              Choose Start Date
            </Text>

            <View style={styles.inputDateContainer}>
              <View>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() => setCalendarVisible(true)}
                >
                  <View style={styles.calendarIcon}>
                    <AntDesign name="calendar" size={24} color="black" />
                  </View>
                  <TextInput
                    placeholder="12/09/2024"
                    style={styles.inputDate}
                    value={selectedDate}
                    editable={false} // Make input read-only
                  />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() => setEndCalendarVisible(true)}
                >
                  <View style={styles.calendarIcon}>
                    <AntDesign name="calendar" size={24} color="black" />
                  </View>
                  <TextInput
                    placeholder="12/09/2024"
                    style={styles.inputDate}
                    value={selectedEndDate}
                    editable={false} // Make input read-only
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={hadleCancel}>
              <Text style={styles.nextButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
        <Modal
          transparent={true}
          visible={calendarVisible}
          animationType="slide"
          onRequestClose={() => setCalendarVisible(false)}
        >
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarContent}>
              <Calendar
                onDayPress={onDateSelect}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    marked: true,
                    selectedColor: "blue",
                  },
                }}
              />
              <TouchableOpacity
                onPress={() => setCalendarVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          transparent={true}
          visible={calendarEndVisible}
          animationType="slide"
          onRequestClose={() => setEndCalendarVisible(false)}
        >
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarContent}>
              <Calendar
                onDayPress={onEndateDateSelect}
                markedDates={{
                  [selectedEndDate]: {
                    selected: true,
                    marked: true,
                    selectedColor: "blue",
                  },
                }}
              />
              <TouchableOpacity
                onPress={() => setEndCalendarVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* pin  */}

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View
            style={[styles.bottomSheetContent, { padding: 0, paddingTop: 20 }]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Confirm Savings</Text>
            </View>
            {/* <Text style={styles.successBottomSheetHeader}>Enter Pin</Text>
            <Text style={styles.desc}>Enter pin to complete transaction</Text> */}

            {/* <View style={styles.otpContainer}>
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
            </TouchableOpacity> */}

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

        {/* payment summary */}
        <BottomSheet
          isVisible={previewVisible}
          onBackdropPress={() => setPreviewVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle2}>Savings Summary</Text>
            </View>
            <Text style={styles.amount}>{savingsName}</Text>

            <View style={styles.flex}>
              <Text style={styles.label2}>Amount</Text>
              <Text style={styles.bottomSheetText}>
                ₦{amountToSave ? formatAmount(Number(amountToSave)) : 0.0}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label2}>Type</Text>
              <Text style={styles.bottomSheetText}>{savingsType}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label2}>Frequncy</Text>
              <Text style={styles.bottomSheetText}>{selectedFrequency}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label2}>Charges</Text>
              <Text style={styles.bottomSheetText}>
                ₦{PageData?.create_savings_fee}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.label2}>Total</Text>
              <Text style={styles.bottomSheetText}>
                ₦
                {formatAmount(
                  Number(PageData?.create_savings_fee) + amountToSave
                )}
              </Text>
            </View>
            {/* <View style={styles.flex}>
            <Text style={styles.label}>Cashback</Text>
            <Text style={styles.bottomSheetText}>+15Pts</Text>
          </View> */}

            <Button text="Continue" onPress={handlePay} />
          </View>
        </BottomSheet>
      </KAScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomSheetTitle2: {
    fontSize: 20,
    fontWeight: "bold",
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
  },
  amount: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#0000ff",
    marginBottom: 20,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "700",
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
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: IS_ANDROID_DEVICE ? 5 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    marginTop: IS_ANDROID_DEVICE ? 50 : 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 25,
    fontSize: 16,
  },
  inputDate: {
    padding: 12,
    color: "#1a1a1a",
    fontSize: 16,
    flex: 1,
  },
  pickerContainer: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    marginVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  picker: {
    flex: 1,
    padding: 10,
  },
  iconContainer: {
    position: "absolute",
    left: 15,
  },
  pickerItem: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  selectedItem: {
    color: "#0052ff",
  },
  balanceText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
    marginBottom: 20,
  },
  transferText: {
    fontSize: 15,
    color: "#1a1a1a",
    marginBottom: 15,
    lineHeight: 22,
  },
  returnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
  },
  returnsItem: {
    flex: 1,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
  },
  returnsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  returnsValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.swiftPayBlue,
  },
  taxText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    fontStyle: "italic",
  },
  scheduleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
  },
  scheduleText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "600",
    marginBottom: 5,
  },
  startText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  immediatelyText: {
    fontSize: 15,
    color: "#0052ff",
    marginVertical: 10,
  },
  frequencyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
  },
  frequencyTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  frequencyValue: {
    fontSize: 15,
    color: "#0052ff",
    fontWeight: "500",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 20,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
  },
  termsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.swiftPayBlue,
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: "#0052ff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
    shadowColor: "#0052ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  label2: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 3,
  },
  subtext: {
    color: "#666",
    marginBottom: 15,
    fontSize: 14,
  },
  subscheduleText: {
    width: 260,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  start: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 25,
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#0052ff",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  mock: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1a1a1a",
  },
  bottomSheetContent: {
    padding: 25,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  successBottomSheetHeader: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#1a1a1a",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
  },
  optionText: {
    fontWeight: "500",
    fontSize: 16,
    marginLeft: 12,
    color: "#1a1a1a",
  },
  desc: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 25,
    lineHeight: 20,
  },
  inputDateContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 15,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateInputContainer2: {
    width: "100%",
    marginBottom: 25,
  },
  calendarIcon: {
    padding: 10,
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  calendarContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#0052ff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSheetHeader: {
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  optionButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  selectedOptionButton: {
    backgroundColor: "#f0f8ff",
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: COLORS.swiftPayBlue,
  },
});

export default CreateSavings;
