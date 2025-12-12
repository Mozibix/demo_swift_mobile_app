import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import {
  AntDesign,
  Feather,
  Fontisto,
  Ionicons,
  Octicons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BottomSheet } from "@rneui/themed";
import CustomSwitch from "@/components/CustomSwitch";
import { Calendar } from "react-native-calendars";
import RNPickerSelect from "react-native-picker-select"; // You can use any dropdown library of your choice.
import LoadingComp from "@/components/Loading";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {
  formatcalculateTimeRemaining,
  formatCurrency,
  formatPastDate,
} from "@/utils/formatters";
import { getErrorMessage } from "@/utils";
import Button from "@/components/ui/Button";
import { DEFAULT_PIN } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import ErrorInfo from "@/components/ErrorInfo";
import { showLogs } from "@/utils/logger";
import Card from "@/components/ui/Card";

interface SavingsDetailInterface {
  id: number;
  user_id: number;
  name: string;
  balance: string; // or number if you'll convert it
  type: "locked" | "unlocked" | string; // adjust based on possible values
  end_date: string; // or Date if you'll parse it
  status: string; // adjust based on possible values
  if_auto_save: 0 | 1 | number; // or boolean if 1/0 represents true/false
  auto_save_amount: null | number;
  auto_save_last_deduction: string; // or Date
  frequency: "weekly" | "monthly" | "daily" | string; // adjust based on possible values
  interest_accumulated: string; // or number
  created_at: string; // or Date
  updated_at: string; // or Date
}

interface SavingsActivity {
  id: number;
  user_id: number;
  message: string;
  created_at: string; // or Date if you'll parse it
  updated_at: string; // or Date
  modelable_type: string; // or more specific type
  modelable_id: number;
}

interface RatesFeeConfiguration {
  locked_savings_interest_rate: number; // 1% (0.01) interest rate for locked savings
  unlocked_savings_interest_rate: number; // 5% (0.05) interest rate for unlocked savings
  breaking_locked_savings_fee: number; // 80% (0.8) fee for early withdrawal
  close_unlocked_savings_fee: number; // Flat ₦100 fee (assuming currency is Naira)
}

const SavingsDetails: React.FC = () => {
  const { id } = useLocalSearchParams();

  const router = useRouter();
  const [Loading, setLoading] = useState(false);
  const [savingsName, setSavingsName] = useState("");
  const [amountToSave, setAmountToSave] = useState("");
  const [option, setOption] = useState("locked");
  const [schedule, setSchedule] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [selectedTransferType, setSelectedTransferType] = useState<
    string | null
  >(null); // New state for radio buttons
  const [balance, setBalance] = useState(1000);
  const [convertedBalance, setConvertedBalance] = useState(balance);
  const [selectedFrequency, setSelectedFrequency] = useState("Never");
  const [selectedDate, setSelectedDate] = useState("Immediately");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [addSavingsModal, setAddSavingsModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { verifyPin, displayLoader, hideLoader } = useAuth();

  const handlePay = () => {
    setAddSavingsModal(true);
  };

  const handleConfirmPayment = () => {
    setIsCustomDateVisible(false); // Hide the transaction pin bottom sheet
    setIsSuccessVisible(true); // Show the success bottom sheet
  };

  const handleSave = () => {
    setIsTransactionPinVisible(false); // Show the success bottom sheet
  };

  const handleCustomDate = () => {
    setIsDateVisible(false); // Show the success bottom sheet
  };

  const handleConfirmDate = () => {
    setIsDateVisible(true); // Show the success bottom sheet
  };

  // Handle option change
  const handleOptionChange = (itemValue: string) => {
    setOption(itemValue);
    if (itemValue === "locked") {
      setModalVisible(true); // Show modal if locked option is selected
    }
  };
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isCustomDateVisible, setIsCustomDateVisible] = useState(false);
  const [isDateVisible, setIsDateVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [breakingLockedSavingsFee, setBreakingLockedSavingsFee] =
    useState(false);

  const [editSavingsModal, setEditSavingsModal] = useState<boolean>(false);

  const [closeSavingsModal, setCloseSavingsModal] = useState(false);

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
    setIsSuccessVisible(false); // Close the bottom sheet
  };

  // Handle date selection
  const handleDateSelection = (date: string) => {
    setSelectedDate(date); // Set the selected frequency
    setIsDateVisible(false); // Close the bottom sheet
  };

  const [selectedDateCalendar, setSelectedDateCalendar] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Function to handle date selection from the calendar
  const onDateSelect = (day: { dateString: React.SetStateAction<string> }) => {
    setSelectedDate(day.dateString);
    setCalendarVisible(false); // Hide calendar after selecting a date
  };

  const [wallets, setWallets] = useState([
    "Wallet Balance",
    "Interest Balance",
  ]); // Example wallets

  // Open wallet picker
  const openWalletPicker = () => {
    setWalletModalVisible(true);
  };

  // Handle wallet selection
  const handleWalletSelect = (wallet: string) => {
    setSelectedWallet(wallet);
    setWalletModalVisible(false); // Close picker after selection
  };

  //page data
  const [SavingsDetails, setSavingsDetails] =
    useState<SavingsDetailInterface | null>(null);
  const [savingActivity, setSavingActivity] = useState<SavingsActivity[]>([]);
  const [interestRates, setInterestRates] = useState<{
    locked: number;
    unlocked: number;
  }>({
    locked: 0,
    unlocked: 0,
  });
  const [ratesData, setRatesData] = useState<RatesFeeConfiguration | null>(
    null
  ); // charges and fees

  //page details
  async function getPageDetails() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await axios({
        url: `https://swiftpaymfb.com/api/interest-savings/show/${id}`,
        method: "get",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      showLogs("response", response.data.data);
      setInterestRates({
        locked: response.data.data.locked_savings_interest_rate,
        unlocked: response.data.data.unlocked_savings_interest_rate,
      });
      setBreakingLockedSavingsFee(
        response.data.data.breaking_locked_savings_fee
      );
      setSavingsDetails(response.data.data.savings);
      setWallets(response.data.data.withdrawal_sources);
      setSavingActivity(response.data.data.savings_activities);
      setSavingsName(response.data.data.savings.name);

      setRatesData({
        locked_savings_interest_rate:
          response.data.data.locked_savings_interest_rate,
        unlocked_savings_interest_rate:
          response.data.data.unlocked_savings_interest_rate,
        breaking_locked_savings_fee:
          response.data.data.breaking_locked_savings_fee,
        close_unlocked_savings_fee:
          response.data.data.close_unlocked_savings_fee,
      });
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

  async function updateSavingsApi() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await axios({
        url: `https://swiftpaymfb.com/api/interest-savings/update/${id}`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({ name: savingsName }),
      });

      showSuccessToast({
        title: "Savings plan updated",
      });
      setSavingsDetails(response.data.data);
      setSavingsName(response.data.data.name);
    } catch (error: any) {
      console.log(error, error?.response);

      Toast.show({
        type: "error",
        text1: "Failed to fetch data",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setEditSavingsModal(false);
      setLoading(false);
    }
  }

  async function AddSavingsApi() {
    setError("");
    const isValid = await verifyPin(pin);
    if (!isValid) {
      return setError("You entered an invalid PIN, please try again");
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await axios({
        url: `https://swiftpaymfb.com/api/interest-savings/add-money`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          savings_id: id,
          amount: Number(amountToSave),
          pin,
        }),
      });

      setSavingsDetails(response.data.data);
      getPageDetails();
      Toast.show({
        type: "success",
        text1: "Successfully funded",
        text2: "savings has been funded successfully",
        position: "top",
      });
    } catch (error: any) {
      console.log(error, error?.response?.data);

      Toast.show({
        type: "error",
        text1: "Failed to Add Money",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setAddSavingsModal(false);
      setPin("");
      setAmountToSave("");
      setLoading(false);
    }
  }

  async function WithdrawSavingsApi() {
    setError("");
    const isValid = await verifyPin(pin);
    if (!isValid) {
      return setError("You entered an invalid PIN, please try again");
    }

    displayLoader();
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await axios({
        url: `https://swiftpaymfb.com/api/interest-savings/withdraw`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          savings_id: id,
          amount: Number(amount),
          source: selectedWallet,
          pin,
        }),
      });

      setSavingsDetails(response.data.data);
      getPageDetails();
      Toast.show({
        type: "success",
        text1: "Successful withdrawal",
        text2: "Savings has been withdrawn successfully",
        position: "top",
      });
    } catch (error: any) {
      console.log(error, error?.response?.data);
      const firstMessage = getErrorMessage(error);
      Toast.show({
        type: "error",
        text1: "Failed to withdraw Money",
        text2:
          firstMessage || error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setModalVisible(false);
      setPin("");
      setLoading(false);
      hideLoader();
    }
  }

  //end savings
  async function EndSavingsApi() {
    const isValid = await verifyPin(pin);
    if (!isValid) {
      setCloseSavingsModal(false);
      setPin("");
      showErrorToast({
        title: "Invalid PIN",
        desc: "You entered an invalid pin, please try again",
      });
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await axios({
        url: `https://swiftpaymfb.com/api/interest-savings/end`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          savings_id: id,
          pin,
        }),
      });

      setSavingsDetails(response.data.data);
      getPageDetails();
      Toast.show({
        type: "success",
        text1: "Successfully Closed",
        text2: "Savings has been closed successfully",
        position: "top",
      });
    } catch (error: any) {
      console.log(error, error?.response?.data);

      Toast.show({
        type: "error",
        text1: "Failed to Close savings",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setCloseSavingsModal(false);
      setPin("");
      setLoading(false);
    }
  }

  useEffect(() => {
    getPageDetails();
  }, []);

  if (Loading) {
    return <LoadingComp visible={Loading} />;
  }

  return (
    <View className="bg-white flex-1">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <Image
            source={require("../assets/icons/logo.png")}
            style={styles.savingsImage}
          />
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>{SavingsDetails?.name}</Text>

            {SavingsDetails?.type == "locked" ? (
              <Text style={styles.savingsSubText}>
                {interestRates.locked}%{" "}
                <Text style={{ color: "#0000ff", fontSize: 15 }}>•</Text>{" "}
                <Text style={{ color: "#666", fontWeight: "400" }}>
                  {SavingsDetails
                    ? formatcalculateTimeRemaining(
                        SavingsDetails.created_at,
                        SavingsDetails?.end_date
                      ).timeRemaining
                    : "0 days left"}
                </Text>
              </Text>
            ) : (
              <Text style={styles.savingsSubText}>
                {interestRates.unlocked}%
              </Text>
            )}

            {SavingsDetails?.type == "unlocked" &&
              SavingsDetails?.status != "closed" && (
                <TouchableOpacity
                  onPress={() => setCloseSavingsModal(true)}
                  style={styles.endSavingsButton}
                >
                  <Text style={styles.endSavingsButtonText}>End Savings</Text>
                </TouchableOpacity>
              )}
            <Text style={styles.locked}>
              {SavingsDetails?.type === "locked" ? (
                <Fontisto name="locked" size={15} color="black" />
              ) : (
                <Fontisto name="unlocked" size={15} color="black" />
              )}{" "}
              {SavingsDetails?.type}{" "}
              {SavingsDetails?.if_auto_save == 1 && (
                <Text style={{ color: "#0000ff", fontSize: 15 }}>•</Text>
              )}{" "}
              {SavingsDetails?.frequency}
            </Text>
          </View>
        </View>

        {/* Active Savings */}
        <Card>
          <View style={styles.activeSavingsContainer}>
            {SavingsDetails?.status == "active" ? (
              <>
                <Text style={styles.activeSavingsAmount}>
                  ₦
                  {SavingsDetails
                    ? formatCurrency(Number(SavingsDetails.balance))
                    : 0.0}
                </Text>
                <Text className="mt-3 text-[17px]">
                  Interest Gained:{" "}
                  <Text style={{ color: "#0000ff" }}>
                    ₦
                    {SavingsDetails
                      ? formatCurrency(
                          Number(SavingsDetails.interest_accumulated)
                        )
                      : 0.0}
                  </Text>
                </Text>
              </>
            ) : (
              <Text style={{ textAlign: "center", fontWeight: "700" }}>
                Saving Closed
              </Text>
            )}
          </View>
        </Card>

        {SavingsDetails?.status == "active" && (
          <View style={styles.actionButtons}>
            <Button text="Add" onPress={handlePay} classNames="py-3" />

            <Button
              text="Withdraw"
              onPress={() => setModalVisible(true)}
              softBg
              classNames="py-3"
            />
          </View>
        )}

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            {SavingsDetails?.status == "active" && (
              <TouchableOpacity
                onPress={() => {
                  setSavingsName(SavingsDetails.name);
                  setEditSavingsModal(true);
                }}
              >
                <Text style={styles.editPlanText}>Edit Savings Plan</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.activityTitle2}>Activity</Text>
          </View>
          {/* Activity Items */}
          {savingActivity.length > 0 ? (
            savingActivity.map((item, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Octicons
                    style={styles.icon}
                    name={"arrow-switch"}
                    size={20}
                    color={"green"}
                  />
                  <Text style={styles.activityAmount}>{item.message}</Text>
                </View>
                <Text style={styles.activityDate}>
                  {formatPastDate(item.created_at)}
                </Text>
              </View>
            ))
          ) : (
            <Text
              style={{
                textAlign: "center",
                marginTop: 20,
                fontWeight: "600",
                fontSize: 17,
              }}
            >
              No activity found
            </Text>
          )}
        </View>

        {/* Create New Savings Plan Button */}

        <Button
          text="Create New Savings Plan"
          onPress={() => router.push("/CreateSavings")}
        />

        <BottomSheet
          isVisible={isSuccessVisible}
          onBackdropPress={() => setIsSuccessVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.successBottomSheetHeader}>
              Choose a frequency
            </Text>

            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => handleFrequencySelection("Never")}
                style={styles.option}
              >
                <Ionicons
                  name={
                    selectedFrequency === "Never"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Never</Text>
              </TouchableOpacity>
            </View>

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

            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => handleFrequencySelection("Yearly")}
                style={styles.option}
              >
                <Ionicons
                  name={
                    selectedFrequency === "Yearly"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color="blue"
                />
                <Text style={styles.optionText}>Yearly</Text>
              </TouchableOpacity>
            </View>

            {/* Add the other frequency options */}
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
                <View style={styles.dateInputContainer}>
                  <TouchableOpacity
                    onPress={() => setCalendarVisible(true)}
                    style={styles.calendarIcon}
                  >
                    <AntDesign name="calendar" size={24} color="black" />
                  </TouchableOpacity>
                  <TextInput
                    placeholder="12/09/2024"
                    style={styles.inputDate}
                    value={selectedDate}
                    editable={false} // Make input read-only
                  />
                </View>
              </View>

              <View>
                <Text style={styles.label}>End Date</Text>
                <View style={styles.dateInputContainer}>
                  <TouchableOpacity
                    onPress={() => setCalendarVisible(true)}
                    style={styles.calendarIcon}
                  >
                    <AntDesign name="calendar" size={24} color="black" />
                  </TouchableOpacity>
                  <TextInput
                    placeholder="12/09/2024"
                    style={styles.inputDate}
                    value={selectedDate}
                    editable={false} // Make input read-only
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handlePay}>
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

        {/* updat savings  */}
        <Modal
          visible={editSavingsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditSavingsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Update Savings</Text>
                <TouchableOpacity onPress={() => setEditSavingsModal(false)}>
                  <Feather name="x" size={20} color={"#0000ff"} />
                </TouchableOpacity>
              </View>

              {/* Amount Input */}
              <Text style={styles.labelText}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Name"
                value={savingsName}
                onChangeText={setSavingsName}
              />

              <Button
                text="Update"
                onPress={updateSavingsApi}
                disabled={!savingsName}
              />
            </View>
          </View>
        </Modal>

        {/* add savings */}

        <Modal
          visible={addSavingsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddSavingsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.bottomSheetTitle}>Add Savings Amount</Text>
                <TouchableOpacity onPress={() => setAddSavingsModal(false)}>
                  <Feather name="x" size={20} color={"#0000ff"} />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                placeholder="Enter amount to save"
                keyboardType="numeric"
                value={amountToSave}
                onChangeText={(text) => setAmountToSave(text)}
                style={styles.input}
              />

              <Text style={styles.label}>Pin</Text>
              <TextInput
                placeholder="Enter your Pin"
                keyboardType="number-pad"
                onChangeText={setPin}
                value={pin}
                style={styles.input}
              />

              {error && (
                <Text className="text-danger font-medium text-[16px] text-center mt-2">
                  {error}
                </Text>
              )}

              <Button
                text="Confirm"
                onPress={AddSavingsApi}
                disabled={!amountToSave || !pin}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Withdraw money to wallet</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={20} color={"#0000ff"} />
                </TouchableOpacity>
              </View>

              {SavingsDetails?.type === "locked" && (
                <ErrorInfo
                  message={`Since this is a locked savings account, withdrawal will attract a ${breakingLockedSavingsFee}% penalty on the your savings balance.`}
                  classNames="mb-6 -mt-6"
                />
              )}

              {/* Wallet Picker */}
              <Text style={styles.labelText}>Select Source</Text>
              <TouchableOpacity
                style={styles.walletPicker}
                onPress={openWalletPicker}
              >
                <Text style={styles.walletPickerText}>
                  {selectedWallet ? selectedWallet : "Select Wallet"}
                </Text>
                <AntDesign name="down" size={16} color="black" />
              </TouchableOpacity>

              {/* Wallet Picker Modal */}
              <Modal
                visible={walletModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                  setError("");
                  setWalletModalVisible(false);
                }}
              >
                <TouchableOpacity
                  style={styles.walletModalOverlay}
                  onPress={() => {
                    setError("");
                    setWalletModalVisible(false);
                  }}
                >
                  <View style={styles.walletModalContent}>
                    <FlatList
                      data={wallets}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.walletOption}
                          onPress={() => handleWalletSelect(item)}
                        >
                          <Text style={styles.walletOptionText}>
                            {item} Wallet
                          </Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item) => item}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Amount Input */}
              <Text style={styles.labelText}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.labelText}>PIN</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={pin}
                onChangeText={setPin}
              />

              {/* Amount Input */}
              {SavingsDetails?.type == "locked" && (
                <>
                  <Text style={styles.labelText}>Charges</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Amount"
                    keyboardType="numeric"
                    value={
                      ratesData
                        ? `${
                            (Number(amount) *
                              ratesData?.breaking_locked_savings_fee) /
                            100
                          }`
                        : "0"
                    }
                    editable={false}
                  />
                </>
              )}

              {error && (
                <Text className="text-danger font-medium text-[16px] text-center mt-2">
                  {error}
                </Text>
              )}

              <Button
                text="Withdraw Money"
                onPress={WithdrawSavingsApi}
                disabled={!selectedWallet || !amount || pin.length < 4}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={closeSavingsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCloseSavingsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Close Savings</Text>
                <TouchableOpacity onPress={() => setCloseSavingsModal(false)}>
                  <Feather name="x" size={20} color={"#0000ff"} />
                </TouchableOpacity>
              </View>

              <Text style={styles.labelText}>PIN</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={pin}
                onChangeText={setPin}
              />

              {/* Amount Input */}
              <>
                <Text style={styles.labelText}>Charges</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={`₦ ${ratesData?.close_unlocked_savings_fee}`}
                  editable={false}
                />
              </>

              <Button
                text="Close Savings"
                onPress={EndSavingsApi}
                disabled={pin.length < 4}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Toast />
    </View>
  );
};
export default SavingsDetails;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 50,
  },
  savingsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginVertical: 20,
  },
  savingsImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  savingsInfo: {
    flex: 1,
    marginLeft: 10,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  savingsProgress: {
    fontSize: 14,
    color: "#6cc24a",
  },
  locked: {
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
    marginTop: 5,
  },
  endSavingsButton: {
    backgroundColor: "#CC1212",
    padding: 8,
    borderRadius: 20,
    width: 90,
    alignItems: "center",
    alignSelf: "flex-end",
  },
  endSavingsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  editPlan: {
    textAlign: "left",
    marginVertical: 10,
    marginBottom: 20,
  },
  editPlanText: {
    color: "#0000ff",
    fontSize: 16,
    fontWeight: "500",
  },
  activeSavingsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  activeSavingsAmount: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    backgroundColor: "#1219BF",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    paddingHorizontal: 60,
  },
  withdrawButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  activitySection: {
    marginVertical: 20,
    marginTop: 30,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  activityTitle2: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
    borderBottomWidth: 3,
    borderBottomColor: "#0000ff",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityAmount: {
    marginLeft: 10,
    fontSize: 16,
    // color: '#0000ff',
    fontWeight: "700",
    width: "60%",
  },
  activityDate: {
    fontSize: 12,
    color: "#999",
  },
  createPlanButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  createPlanButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  savingsSubText: {
    fontSize: 15,
    color: "#32CD32",
    fontWeight: "500",
    alignItems: "center",
  },
  activeSavings: {
    color: "#555",
    fontSize: 15,
    fontWeight: "500",
  },
  icon: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  optionText: {
    fontWeight: "500",
    fontSize: 16,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  inputDateContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    width: 150,
  },
  calendarIcon: {
    padding: 10,
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
  },
  bottomSheetHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    alignSelf: "center",
  },
  frequencyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  frequencyTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  frequencyValue: {
    fontSize: 16,
    color: "#0000ff",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  termsText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 5,
  },
  termsLink: {
    color: "#0000ff",
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtext: {
    color: "#666",
    marginBottom: 10,
  },
  subscheduleText: {
    width: 260,
    fontSize: 13,
    color: "#666",
  },
  start: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 330,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  modalButton: {
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mock: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  inputDate: {
    padding: 10,
    color: "#666",
    fontSize: 16,
    paddingHorizontal: 2,
  },
  pickerContainer: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pickerIcon: {
    position: "absolute",
    right: 10,
  },
  picker: {
    borderWidth: 1,
  },
  iconContainer: {
    position: "absolute",
    left: 10,
  },
  pickerItem: {
    fontSize: 16,
    color: "#333",
  },
  selectedItem: {
    color: "#3b82f6", // Change to blue when selected
  },
  balanceText: {
    fontSize: 12,
    color: "#999",
    marginVertical: -10,
    marginBottom: 20,
  },
  transferText: {
    fontSize: 14,
    color: "#000",
    marginBottom: 10,
  },
  returnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  returnsItem: {
    flex: 1,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#555",
  },
  returnsTitle: {
    fontSize: 14,
    color: "#000",
    marginBottom: 10,
  },
  returnsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0000ff",
  },
  taxText: {
    fontSize: 13,
    color: "#000",
    marginBottom: 10,
  },
  scheduleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  scheduleText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  startText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  immediatelyText: {
    fontSize: 14,
    color: "#0000ff",
    marginVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  confirmButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  withdrawTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  flex: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500",
  },

  walletPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    width: "100%",
    marginBottom: 20,
    borderColor: "#0000ff",
  },
  walletPickerText: {
    fontSize: 14,
  },

  walletModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  walletModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: 250,
  },
  walletOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  walletOptionText: {
    fontSize: 16,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 15,
  },
  inputAndroid: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 15,
  },
});
