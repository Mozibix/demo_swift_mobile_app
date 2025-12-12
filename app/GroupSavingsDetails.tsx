import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import { apiService } from "@/services/api";
import {
  formatcalculateTimeRemaining,
  formatCurrency,
  formatPastDate,
} from "@/utils/formatters";
import { AntDesign, Feather, Ionicons, Octicons } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { cn, formatDateAgo, getErrorMessage } from "@/utils";
import PinComponent from "@/components/ui/PinComponent";
import { showLogs } from "@/utils/logger";
import { useAuth } from "@/context/AuthContext";
import { KeyboardAvoidingView } from "react-native";
import { Platform } from "react-native";
import KAScrollView from "@/components/ui/KAScrollView";
import { DEFAULT_PIN, IS_ANDROID_DEVICE } from "@/constants";

interface GroupSavingsResponse {
  is_admin: boolean;
  withdrawal_fee: number;
  group_savings: GroupSavingsDetailInterface;
  members: Member[];
  activities: Activity[];
}

interface GroupSavingsDetailInterface {
  id: number;
  name: string;
  type: "flexible" | "locked" | string;
  description: string;
  balance: number;
  status: "active" | "inactive" | "completed" | string;
  target_amount: number;
  end_date: string; // ISO 8601 format
  member_target_amount: number | null;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
  readable_end_date: string;
  hash_id: string;
  pivot: {
    user_id: number;
    group_savings_id: number;
    role: "member" | "admin" | string;
    status: "active" | "pending" | string;
  };
}

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
  profile_image: string | null;
  username: string;
  name: string;
  profile_photo: string;
  pivot: {
    group_savings_id: number;
    user_id: number;
    role: "member" | "admin" | string;
    status: "active" | "pending" | string;
  };
}

interface Activity {
  id: number;
  user_id: number | null;
  message: string;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
  modelable_type: string; // e.g., "App\\Models\\GroupSavings"
  modelable_id: number;
}

const GroupSavingsDetails: React.FC = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [SavingDetailsData, setSavingDetailsData] =
    useState<GroupSavingsResponse | null>(null);
  let UserPivot = SavingDetailsData?.group_savings?.pivot;
  let SavingDetails = SavingDetailsData?.group_savings;
  let members = SavingDetailsData?.members;
  let activities = SavingDetailsData?.activities;
  const currentMember = members?.find((member) => member.id === user?.id);
  const isAdmin = currentMember?.pivot?.role === "admin";

  // showLogs("SavingDetails", SavingDetails);
  // showLogs("SavingDetailsData", SavingDetailsData);

  // showLogs("currentMember", currentMember);
  // showLogs("isAdmin", isAdmin);

  const [Loading, setLoading] = useState(false);

  const [savingsName, setSavingsName] = useState("");
  const [amountToSave, setAmountToSave] = useState("");
  const [Reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const [option, setOption] = useState("locked");
  const [modalVisible, setModalVisible] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [selectedFrequency, setSelectedFrequency] = useState("Never");
  const [selectedDate, setSelectedDate] = useState("Immediately");
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [isInviteVisible, setIsInviteVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [addSavingsModal, setAddSavingsModal] = useState(false);
  const [updateSavingsModal, setUpdateSavingsModal] = useState(false);
  const [EndSavingsModal, setEndSavingsModal] = useState(false);
  const [showPinContainer, setShowPinContainer] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };
  const { displayLoader, hideLoader, verifyPin, getUserProfile } = useAuth();

  const handlePay = () => {
    setAddSavingsModal(true); // Show the transaction pin bottom sheet
  };

  const handleWithdraw = () => {
    setIsWithdrawVisible(true); // Show the transaction pin bottom sheet
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
  const [inviteBtnText, setInviteBtnText] = useState("Copy Code");
  const [error, setError] = useState("");

  // Handle frequency selection
  const handleFrequencySelection = (frequency: string) => {
    setSelectedFrequency(frequency);
    setIsSuccessVisible(false);
  };

  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setIsDateVisible(false);
  };

  const [selectedDateCalendar, setSelectedDateCalendar] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);

  const onDateSelect = (day: { dateString: React.SetStateAction<string> }) => {
    setSelectedDate(day.dateString);
    setCalendarVisible(false);
  };

  const [transferPin, setTransferPin] = useState("");

  const handleEndSavingsClick = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const shareGroupInvite = async (
    groupInviteLink: string,
    inviteCode: string
  ) => {
    try {
      const result = await Share.share({
        message: `Join our group on SwiftPay! Use the link below or the invite code to join:\n\nInvite Link: ${groupInviteLink}\nInvite Code: ${inviteCode}`,
        title: "Group Invite",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Activity type on iOS
          console.log("Shared via:", result.activityType);
        } else {
          // Shared successfully
          console.log("Group invite shared successfully!");
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log("Group invite sharing dismissed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sharing group invite:", error.message);
      } else {
        console.error("An unknown error occurred while sharing.");
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRefetch(true);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchGroupSavings();
    }, [])
  );

  const fetchGroupSavings = async () => {
    try {
      setLoading(true);
      console.log("id", id);

      const response = await apiService.groupSavingsdDetailsApi(id);
      showLogs("res", response.data);
      setSavingDetailsData(response.data);
      setSavingsName(response.data.group_savings.name);
    } catch (error: any) {
      console.log(error);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to fetch group savings",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  async function AddSavingsApi(user_pin: string) {
    setError("");
    if (user_pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(user_pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    if (!amountToSave) {
      return setError("Please enter the amount to save");
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/group-savings/add-money`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          group_savings_id: id,
          amount: Number(amountToSave),
          pin: user_pin,
        }),
      });

      Toast.show({
        type: "success",
        text1: "Successfully funded",
        text2: "savings has been funded successfully",
        position: "top",
      });

      await fetchGroupSavings();
    } catch (error: any) {
      const message = getErrorMessage(error);
      Toast.show({
        type: "error",
        text1: "Failed to Add Money",
        text2: message || "An error occurred",
        position: "top",
      });
    } finally {
      setAddSavingsModal(false);
      setPin("");
      setAmountToSave("");
      setLoading(false);
    }
  }

  async function WithdrawSavingsApi(pin: string) {
    setError("");
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }
    setLoading(true);
    setShowPinContainer(false);
    displayLoader();

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios({
        url: `https://swiftpaymfb.com/api/group-savings/withdraw`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          group_savings_id: id,
          amount: Number(amountToSave),
          reason: Reason,
          pin,
        }),
      });

      showSuccessToast({
        title: "Successful!",
        desc: "Savings Withdrawal Completed",
      });
      getUserProfile();

      await fetchGroupSavings();
    } catch (error: any) {
      const firstErrorMessage = getErrorMessage(error);

      showErrorToast({
        title: "Failed to Withdraw Money",
        desc:
          firstErrorMessage ||
          error.response?.data?.message ||
          "An error occurred",
      });
    } finally {
      setIsWithdrawVisible(false);
      setPin("");
      setReason("");
      setAmountToSave("");
      setLoading(false);
      hideLoader();
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

      console.log(savingsName);

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/group-savings/update`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({ name: savingsName, group_savings_id: id }),
      });

      fetchGroupSavings();
      setSavingsName(intigrate.data.data.name);
    } catch (error: any) {
      console.log(error, error?.response);

      Toast.show({
        type: "error",
        text1: "Failed to fetch data",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setUpdateSavingsModal(false);
      setLoading(false);
    }
  }

  async function EndSavingsApi() {
    setError("");
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    setEndSavingsModal(false);
    displayLoader();

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/group-savings/end`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          group_savings_id: id,
          pin,
        }),
      });

      router.back();
      Toast.show({
        type: "success",
        text1: "Successfully Closed",
        text2: "savings has been closed successfully",
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
      setEndSavingsModal(false);
      setPin("");
      setLoading(false);
      hideLoader();
    }
  }

  function handleCopyInviteCode() {
    if (SavingDetailsData?.group_savings.hash_id) {
      Clipboard.setStringAsync(
        SavingDetailsData?.group_savings.hash_id.toString()
      );
      setInviteBtnText("Copied!");

      setTimeout(() => setInviteBtnText("Copy Code"), 3000);
    } else {
      showErrorToast({
        title: "Error",
        desc: "No invite code detected",
      });
    }
  }

  useEffect(() => {
    fetchGroupSavings();
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LoadingComp visible={Loading} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={Loading} onRefresh={fetchGroupSavings} />
        }
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={22} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.savingsCard}>
          <Image
            source={require("../assets/icons/logo.png")}
            style={styles.savingsImage}
          />
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>
              {SavingDetailsData?.group_savings?.name} (
              {SavingDetailsData?.group_savings.type})
            </Text>
            <Text style={{ color: "#666", fontWeight: "400" }}>
              {SavingDetailsData?.group_savings?.readable_end_date}
            </Text>
            {/* <Text style={styles.savingsSubText}>
              {SavingDetailsData
                ? formatcalculateTimeRemaining(
                    SavingDetailsData?.group_savings?.created_at,
                    SavingDetailsData?.group_savings?.end_date
                  ).percentageComplete
                : 0}
              % <Text style={{ color: "#0000ff", fontSize: 15 }}>•</Text>
              <Text style={{ color: "#666", fontWeight: "400" }}>
                {SavingDetailsData?.group_savings?.readable_end_date}
              </Text>
            </Text> */}

            <View className="flex-row mt-4 gap-2">
              <View>
                {SavingDetails?.status == "active" && isAdmin && (
                  <TouchableOpacity
                    style={styles.editBtn}
                    activeOpacity={0.8}
                    onPress={() => setUpdateSavingsModal(true)}
                  >
                    <Text className="font-semibold text-[12px] whitespace-nowrap">
                      Edit Savings
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {SavingDetails?.status == "active" && isAdmin && (
                <TouchableOpacity
                  style={styles.endSavingsButton}
                  onPress={() => setEndSavingsModal(true)}
                >
                  <Text className="font-semibold text-[12px] whitespace-nowrap text-white">
                    End Savings
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.shareBtn}
              onPress={() => setIsInviteVisible(true)}
            >
              <Octicons name="person-add" size={24} color="#0000ff" />
              <Text style={styles.shareText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        {SavingDetails?.type == "flexible" && (
          <>
            <Text style={styles.activeSavings}>Target Amount</Text>

            <View style={styles.activeSavingsContainer}>
              <Text style={styles.activeSavingsAmount}>
                ₦
                {SavingDetails
                  ? formatCurrency(SavingDetails?.target_amount)
                  : "0.00"}
              </Text>
            </View>
          </>
        )}

        <Text style={styles.activeSavings}>Group Active Savings</Text>
        {/* Active Savings */}
        <View style={styles.activeSavingsContainer2}>
          <Text style={styles.activeSavingsAmount}>
            ₦{SavingDetails ? formatCurrency(SavingDetails?.balance) : "0.00"}
          </Text>
        </View>

        {SavingDetails?.status == "active" && (
          <View style={styles.actionButtons}>
            <Button
              text="Add Money"
              onPress={handlePay}
              classNames={cn(
                "p-3",
                UserPivot?.role == "member" ? "w-[100%]" : "w-[48%]"
              )}
            />

            {isAdmin && (
              <Button
                outlined
                softBg
                text="Admin Withdraw"
                onPress={handleWithdraw}
                classNames="w-[48%] p-3"
              />
            )}
          </View>
        )}

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  `/Members?data=${JSON.stringify(members)}&myRole=${
                    UserPivot?.role
                  }&myid=${UserPivot?.user_id}&group_id=${id}&type=${
                    SavingDetailsData?.group_savings.type
                  }&targetAmount=${
                    SavingDetailsData?.group_savings.member_target_amount ??
                    null
                  }`
                )
              }
            >
              <Text style={styles.activityTitle}>Members</Text>
            </TouchableOpacity>
            <Text style={styles.activityTitle2}>Activity</Text>
          </View>

          {/* Activity Items */}
          {(activities ? activities?.length : 0) > 0 ? (
            activities?.map((item, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Text style={styles.activityMessage}>{item.message}</Text>
                </View>
                <Text style={styles.activityDate}>
                  {formatDateAgo(item.created_at)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No activity Found
            </Text>
          )}
        </View>

        <BottomSheet
          isVisible={isInviteVisible}
          onBackdropPress={() => setIsInviteVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.successBottomSheetHeader}>Invite User</Text>

            <Text style={styles.successBottomSheetDesc}>
              Invite your friends to join your savings account using the code
              below
            </Text>

            <TextInput
              style={styles.input}
              value={SavingDetailsData?.group_savings.hash_id}
              editable={false}
            />

            <Button
              asChild
              onPress={handleCopyInviteCode}
              classNames="mb-5 flex-row items-center justify-center gap-3"
            >
              <Feather name="copy" size={26} color="#fff" />
              <Text className="text-white text-[17px] font-bold">
                {inviteBtnText}
              </Text>
            </Button>
          </View>
        </BottomSheet>

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
          isVisible={isWithdrawVisible}
          onBackdropPress={() => setIsWithdrawVisible(false)}
        >
          <View style={[styles.bottomSheetContent, { minHeight: 600 }]}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Admin Withdrawal</Text>
            </View>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              placeholder="Enter amount to withdraw"
              keyboardType="numeric"
              onChangeText={setAmountToSave}
              value={amountToSave}
              style={styles.input}
            />

            <Text style={styles.label}>Reason</Text>
            <TextInput
              placeholder="Enter your reason."
              onChangeText={setReason}
              value={Reason}
              style={styles.input}
            />

            <Text style={styles.label}>Charges</Text>
            <TextInput
              placeholder="Charges"
              editable={false}
              value={`${SavingDetailsData?.withdrawal_fee}`}
              style={styles.input}
            />

            {/* <View style={styles.scheduleContainer}>
              <Text style={styles.subscheduleText}>
                <AntDesign name='exclamationcircleo' color={'#0000ff'}/> Note: money will be deposited automatically to your swiftpay account.</Text>
            </View> */}

            {/* <View style={styles.balanceSection}>
              <View style={styles.row}>
                <Text style={styles.balanceLabel}>SwiftPay Balance</Text>
                <Text style={styles.balanceAmount}>
                  {isBalanceHidden ? '$ ******' : '$ 2,345.98'}
                </Text>
              </View>
              <TouchableOpacity onPress={toggleBalanceVisibility}>
                <AntDesign name={isBalanceHidden ? 'eyeo' : 'eye'} size={25} color="#666" />
              </TouchableOpacity>
            </View> */}

            <Button
              text="Withdraw"
              onPress={() => {
                setIsWithdrawVisible(false);
                setShowPinContainer(true);
              }}
              disabled={!amountToSave || !Reason}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={showPinContainer}
          onBackdropPress={() => setShowPinContainer(false)}
        >
          <View style={[styles.bottomSheetContent, { padding: 0 }]}>
            {error && (
              <Text className="text-danger font-medium text-[16px] text-center mt-2">
                {error}
              </Text>
            )}
            <PinComponent
              onComplete={(pin: string) => {
                WithdrawSavingsApi(pin);
              }}
              setModalState={setShowPinContainer}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          isVisible={addSavingsModal}
          onBackdropPress={() => setAddSavingsModal(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Add Savings Amount</Text>
            </View>

            {error && (
              <Text className="text-danger font-medium text-[16px] text-center mt-2 mb-4">
                {error}
              </Text>
            )}

            <Text style={styles.label}>Amount</Text>
            <TextInput
              placeholder="Enter amount to save"
              value={amountToSave}
              onChangeText={setAmountToSave}
              keyboardType="numeric"
              style={styles.input}
            />

            <PinComponent
              onComplete={(pin: string) => {
                AddSavingsApi(pin);
              }}
              setModalState={setAddSavingsModal}
            />

            {/* <Button onPress={AddSavingsApi} text="Confirm" /> */}
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

        <Modal
          transparent={true}
          visible={EndSavingsModal}
          animationType="slide"
          onRequestClose={() => {
            setEndSavingsModal(false);
            setError("");
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Close Savings Account</Text>

                <TouchableOpacity
                  onPress={() => {
                    setEndSavingsModal(false);
                    setError("");
                  }}
                >
                  <Feather name="x" size={24} color="#0000FF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Closing this account will transfer the balance to your wallet
                and the account will become inactive.
              </Text>
              <Text style={styles.modalMessage}>
                Please note that this action cannot be undone.
              </Text>
              <Text style={styles.modalPin}>Enter your PIN to confirm</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your PIN to confirm"
                secureTextEntry={true}
                value={pin}
                onChangeText={setPin}
                maxLength={4}
                keyboardType="numeric"
              />

              {error && (
                <Text className="text-danger font-medium text-[16px] text-center mt-3">
                  {error}
                </Text>
              )}

              <Button
                onPress={EndSavingsApi}
                text="End Savings"
                disabled={pin.length < 4}
              />
            </View>
          </View>
        </Modal>

        <Modal
          transparent={true}
          visible={updateSavingsModal}
          animationType="slide"
          onRequestClose={() => setUpdateSavingsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Update Savings Account</Text>
                <TouchableOpacity onPress={() => setUpdateSavingsModal(false)}>
                  <Feather name="x" size={24} color="#0000FF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalPin}>Enter Savings Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Name"
                value={savingsName}
                onChangeText={setSavingsName}
              />

              <Button
                text="Update Savings"
                onPress={updateSavingsApi}
                disabled={!savingsName}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const activityData = [
  { amount: "$61.50", date: "Yesterday", type: "add" },
  { amount: "$199.75", date: "Dec 10, 2020", type: "add" },
  { amount: "$38.00", date: "Nov 26, 2020", type: "withdraw" },
];

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: IS_ANDROID_DEVICE ? 50 : 10,
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
    top: -40,
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
    marginLeft: 60,
    fontWeight: "700",
  },
  endSavingsButton: {
    backgroundColor: "#CC1212",
    padding: 8,
    borderRadius: 10,
    width: 90,
    alignItems: "center",
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
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  activeSavingsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  activeSavingsContainer2: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 5,
    borderWidth: 2,
    borderColor: "green",
  },
  activeSavingsAmount: {
    fontSize: 28,
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
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 15,
    marginRight: 10,
    paddingHorizontal: 60,
  },
  withdrawButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 15,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  activitySection: {
    marginVertical: 20,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: "100%",
  },
  activityIconContainer: {},
  activityMessage: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
    maxWidth: "90%",
  },
  activityDate: {
    fontSize: 15,
    color: "#666",
    marginTop: 3,
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
    color: "#0000ff",
    fontWeight: "500",
    alignItems: "center",
  },
  activeSavings: {
    color: "#000",
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
  successBottomSheetDesc: {
    fontSize: 15,
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
    width: 340,
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
    fontSize: 20,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    backgroundColor: "#f7f7f7",
    marginBottom: 20,
    fontWeight: "500",
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
  editBtn: {
    backgroundColor: "#ccc",
    width: 100,
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: {
    color: "#0000ff",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  user: {
    width: 30,
    height: 30,
  },
  membersContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  usericon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  memberName: {
    alignItems: "flex-start",
  },
  date: {
    alignItems: "flex-end",
  },
  namehead: {
    color: "#666",
  },
  value: {
    fontSize: 15,
  },
  cashoutdate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
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
  modalDescription: {
    fontSize: 14,
    marginBottom: 15,
    color: "#666",
  },
  closeAccountButton: {
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  closeAccountButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: "#0000ff",
    marginBottom: 10,
  },
  modalPin: {
    fontSize: 16,
    fontWeight: "600",
  },
  flex: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
});

export default GroupSavingsDetails;
