import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import CustomCheckbox from "@/components/ui/CustomCheckbox";
import KAScrollView from "@/components/ui/KAScrollView";
import { IS_ANDROID_DEVICE, IS_IOS_DEVICE } from "@/constants";
import { apiService } from "@/services/api";
import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import { useRouter } from "expo-router";
import * as WebBroswer from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Toast from "react-native-toast-message";

const CreateGroupSavings: React.FC = () => {
  const router = useRouter();
  const [savingsName, setSavingsName] = useState("");
  const [target_amount, setTarget_amount] = useState("");
  const [member_target_amount, setMember_target_amount] = useState("");
  const [description, setDescription] = useState<string>("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransferType, setSelectedTransferType] = useState<
    string | null
  >(null); // New state for radio buttons
  const [balance, setBalance] = useState(1000);
  const [convertedBalance, setConvertedBalance] = useState(balance);
  const [selectedFrequency, setSelectedFrequency] = useState("Never");
  const [selectedDate, setSelectedDate] = useState("Immediately");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [Loading, setLoading] = useState(false);

  const hadleCancel = () => {
    setIsCustomDateVisible(false); // Hide the transaction pin bottom sheet
  };

  const handleConfirmPayment = () => {
    setIsCustomDateVisible(false); // Hide the transaction pin bottom sheet
    setIsSuccessVisible(true); // Show the success bottom sheet
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
    setOption(itemValue);
    if (itemValue === "Random Payments") {
      setModalVisible(true); // Show modal if locked option is selected
    }
  };
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isCustomDateVisible, setIsCustomDateVisible] = useState(false);
  const [isDateVisible, setIsDateVisible] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [calendarEndVisible, setEndCalendarVisible] = useState(false);

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

  const handlePay = () => {
    setIsTransactionPinVisible(true); // Show the transaction pin bottom sheet
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

  const [savingsType, setSavingsType] = useState<string[]>([
    "Random Payments",
    "Equal Split With Members",
  ]);

  const [option, setOption] = useState<string | null>(savingsType[0]); // Selected value

  const handleOptionSelect = (selectedOption: string) => {
    console.log("selectedOption", selectedOption);
    setOption(selectedOption); // Update the selected option
    setModalVisible(false); // Close the modal
  };

  const onEndateDateSelect = (day: {
    dateString: React.SetStateAction<string>;
  }) => {
    setSelectedEndDate(day.dateString);
    setEndCalendarVisible(false);
  };

  const handleCreateSavings = async () => {
    try {
      setLoading(true);
      if (!option)
        return Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "type is required",
          position: "top",
        });

      const response = await apiService.CreateGroupSavingStore({
        name: savingsName,
        type: option,
        end_date: `${selectedEndDate}`.replace(
          /(\d{2})-(\d{2})-(\d{4})/,
          "$3-$2-$1"
        ),
        target_amount: option == "flexible" ? +target_amount : null,
        member_target_amount: option == "strict" ? +member_target_amount : null,
        description,
      });

      router.replace({
        pathname: "/GroupSavingsCreated",
        params: {
          data: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      console.log(error);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.error || "Failed to fetch group savings",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupSavings = async () => {
    try {
      setLoading(true);
      const response = await apiService.CreateGroupSavingData();
      setSavingsType(response.data.group_savings_types);
      setOption(response.data.group_savings_types[0]);
    } catch (error: any) {
      console.log(error);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.error || "Failed to fetch group savings",
        position: "bottom",
      });
    } finally {
      setLoading(false);
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
    fetchGroupSavings();
  }, []);

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingHorizontal: IS_IOS_DEVICE ? 15 : 0,
        }}
      >
        <LoadingComp visible={Loading} />
        <View className="mx-5">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <AntDesign name="left" size={20} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Group Savings</Text>
          </View>

          <KAScrollView>
            <Text style={styles.label}>Name of Savings</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g. Neighbourhood Savings, etc..."
              value={savingsName}
              onChangeText={setSavingsName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description"
              onChangeText={setDescription}
              value={description}
              multiline={true}
            />

            {/* Modal */}
            <Text style={styles.label}>Type of Savings</Text>
            <TouchableOpacity
              style={styles.dropdownContainer}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.selectedOption}>
                {option || "Select savings type"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <View className="flex-row items-start gap-2 mb-6 -mt-3">
              <FontAwesome5 name="info-circle" size={15} color="#444" />
              <Text className="text-gray-200 max-w-[85%]">
                {option == "strict"
                  ? "For strict savings, each member is required to save a fixed amount."
                  : "For flexible savings, each member is required to save any amount of their choice to meet the target amount."}
              </Text>
            </View>

            {option == "strict" && (
              <>
                <Text style={styles.label}>
                  Amount each member is required to save
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="10,000"
                  keyboardType="numeric"
                  value={member_target_amount}
                  onChangeText={(text) => setMember_target_amount(text)}
                />
              </>
            )}

            {option == "flexible" && (
              <>
                <Text style={styles.label}>Target amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10,000"
                  keyboardType="numeric"
                  value={target_amount}
                  onChangeText={(text) => setTarget_amount(text)}
                />
              </>
            )}

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

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              {/* <Checkbox
                status={agreeTerms ? "checked" : "unchecked"}
                onPress={() => setAgreeTerms(!agreeTerms)}
                color="#3b82f6"
              /> */}

              <CustomCheckbox
                value={agreeTerms}
                onValueChange={() => setAgreeTerms(!agreeTerms)}
              />

              <Text style={styles.termsText}>
                I Have Read And Agree To{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => openBrowser("terms")}
                >
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
            </View>

            <Button
              text="Create Group Savings"
              onPress={handleCreateSavings}
              disabled={
                !agreeTerms ||
                !savingsName ||
                !description ||
                !option ||
                (option === "flexible" && !target_amount) ||
                (option === "strict" && !member_target_amount) ||
                !selectedEndDate
              }
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

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={hadleCancel}
                >
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
              isVisible={isTransactionPinVisible}
              onBackdropPress={() => setIsTransactionPinVisible(false)}
            >
              <View style={styles.bottomSheetContent}>
                <Text style={styles.successBottomSheetHeader}>Enter Pin</Text>
                <Text style={styles.desc}>Enter pin to complete action</Text>

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
                  onPress={() => router.push("/GroupSavingsCreated")}
                >
                  <Text style={styles.nextButtonText}>Confirm Payment</Text>
                </TouchableOpacity>
              </View>
            </BottomSheet>

            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                onPress={() => setModalVisible(false)}
              >
                <View style={styles.modalContent}>
                  <FlatList
                    data={savingsType}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          option === item && styles.selectedOptionButton,
                        ]}
                        onPress={() => handleOptionSelect(item)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            option === item && styles.selectedOptionText,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
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
          </KAScrollView>
        </View>
      </SafeAreaView>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    marginTop: IS_ANDROID_DEVICE ? 50 : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 40,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
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
    marginBottom: 20,
  },
  pickerIcon: {
    position: "absolute",
    right: 10,
  },
  picker: {
    flex: 1,
    padding: 10,
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
    maxWidth: "95%",
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
    marginBottom: 10,
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
    borderRadius: 20,
    alignItems: "center",
    width: 300,
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
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
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
    fontSize: 20,
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
  descriptionInput: {
    height: 150, // Set the desired height for the input
    borderColor: "#ccc", // Optional: set a border color for better visibility
    borderWidth: 1, // Optional: set the border width
    borderRadius: 5, // Optional: round the corners if needed
    padding: 10, // Add padding to avoid text touching the edges
    textAlignVertical: "top", // Ensure text starts from the top
    backgroundColor: "#fff", // Optional: set background color
    fontSize: 16, // Optional: adjust the font size
    marginBottom: 20,
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
  icon: {
    width: 25,
    height: 25,
  },
  dropdownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  selectedOption: {
    fontSize: 16,
    color: "#333",
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
    color: "#007BFF",
  },
  dateInputContainer2: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 20,
  },
});

export default CreateGroupSavings;
