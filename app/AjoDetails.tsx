import CustomSwitch from "@/components/CustomSwitch";
import ErrorInfo from "@/components/ErrorInfo";
import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast } from "@/components/ui/Toast";
import { DEFAULT_PIN, IS_ANDROID_DEVICE } from "@/constants";

import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import {
  formatAmount,
  formatDateShort,
  getErrorMessage,
  hasDateNotArrived,
  navigationWithReset,
} from "@/utils";
import { showLogs } from "@/utils/logger";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  AntDesign,
  FontAwesome6,
} from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

interface ContributionRound {
  id: number;
  name: string;
  balance: string;
  status: string;
  daysLeft?: number;
  order?: string;
  color?: string;
  round_number?: number;
  user_id?: number; // Added user_id property
}

interface Member {
  profile_photo: string | undefined;
  id: number;
  name: string;
  role?: string;
  order_number?: number;
  amount: string;
  round_statuses: {
    round_number: number;
    status: string;
    can_report: boolean;
  }[];
  email: string;
  phone: string;
}

const VenzaAjoScreen: React.FC = () => {
  const params = useLocalSearchParams();

  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [isReportSheetVisible, setIsReportSheetVisible] =
    useState<boolean>(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] =
    useState<boolean>(false);
  const [isTransactionPin, setIsTransactionPin] = useState<boolean>(false);
  const [isCustomDateVisible, setIsCustomDateVisible] =
    useState<boolean>(false);
  const [isDateVisible, setIsDateVisible] = useState<boolean>(false);
  const [isDelete, setIsDelete] = useState(false);
  const [transactionPin, setTransactionPin] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [schedule, setSchedule] = useState<boolean>(false);
  const [selectedFrequency, setSelectedFrequency] = useState<string>("Never");
  const [selectedDate, setSelectedDate] = useState<string>("Immediately");
  const [option, setOption] = useState<string>("locked");
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [isCurrentRoundPending, setIsCurrentRoundPending] = useState(false);
  const [activeContribution, setActiveContribution] = useState([]);
  const [isAdminUser, setIsAminUser] = useState(false);
  const [hasNotArrived, setHasNotArrived] = useState(false);
  const [isEndTrigerred, setIsEndTrigerred] = useState(false);

  const { user } = useAuth();
  const API_BASE_URL = "https://swiftpaymfb.com/api";

  // showLogs("details params", params);

  // Data state variables
  const [balance, setBalance] = useState<number | string>(0);
  interface ContributionData {
    name: string;
    status: string;
    hash_id: string;
    [key: string]: any;
  }

  const [contributionData, setContributionData] =
    useState<ContributionData | null>(null);
  const [contributionRounds, setContributionRounds] = useState<
    ContributionRound[]
  >([]);
  const [contributionMembers, setContributionMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<
    number | undefined
  >();
  const [selectedMemberRoundId, setSelectedMemberRoundId] = useState<
    number | undefined
  >();
  const [selectedRoundDetails, setSelectedRoundDetails] =
    useState<ContributionRound | null>(null);
  const { displayLoader, hideLoader, verifyPin } = useAuth();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const animatedMinHeight = useSharedValue(300);
  const navigation = useNavigation();

  // showLogs("params", params);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      onKeyboardShow
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      onKeyboardHide
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Animate minHeight when isKeyboardVisible changes
    if (isKeyboardVisible) {
      animatedMinHeight.value = withTiming(650, {
        duration: 300, // Animation duration
        easing: Easing.ease, // Easing function
      });
    } else {
      animatedMinHeight.value = withTiming(300, {
        duration: 300,
        easing: Easing.ease,
      });
    }
  }, [isKeyboardVisible]); // Trigger animation when keyboard visibility changes

  const onKeyboardShow = () => {
    setKeyboardVisible(true);
  };

  const onKeyboardHide = () => {
    setKeyboardVisible(false);
  };

  const animatedBottomSheetStyle = useAnimatedStyle(() => {
    return {
      minHeight: animatedMinHeight.value,
    };
  });

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 3) {
      Keyboard.dismiss();
      // setKeyboardVisible(false);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Toggle balance visibility
  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceHidden((prev) => !prev);
  }, []);

  // Function to handle previewing a round
  const handlePreview = useCallback((round: ContributionRound) => {
    setSelectedRoundDetails(round);
    setIsPreviewVisible(true);
  }, []);

  // Function to handle contribution actions
  const handleContribution = useCallback(
    (memberId: number, roundNumber: number) => {
      setSelectedMemberId(memberId);
      setSelectedMemberRoundId(roundNumber);
      setIsPreviewVisible(false);
      setIsReportSheetVisible(true);
    },
    []
  );

  // Function to handle payment
  const handlePay = useCallback(() => {
    console.log(
      "hasNotArrived",
      hasDateNotArrived(contributionData?.start_date)
    );

    setIsTransactionPinVisible(true);
  }, []);

  // Function to handle date confirmation
  const handleConfirmDate = useCallback(() => {
    setIsDateVisible(true);
  }, []);

  // Function to handle payment confirmation
  const handleConfirmPayment = useCallback(() => {
    setIsCustomDateVisible(false);
    setIsReportSheetVisible(true);
  }, []);

  // Function to handle option change
  const handleOptionChange = useCallback((itemValue: string) => {
    setOption(itemValue);
    if (itemValue === "locked") {
      setModalVisible(true);
    }
  }, []);

  // const fetchAjoContribution = async () => {
  //   try {
  //     setIsLoading(true);
  //     const token = await SecureStore.getItemAsync("userToken");
  //     const response = await axios.get(
  //       `${API_BASE_URL}/ajo-contributions/show?ajo_contribution_id=${params.id}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           Accept: "application/json",
  //         },
  //       }
  //     );

  //     showLogs("response?.data?.status ", response?.data);

  //     if (response?.data?.status === "sucess") {
  //       setActiveContribution(response?.data?.data);

  //       // Set auto-save state based on response if available
  //       if (response?.data?.data?.if_auto_save !== undefined) {
  //         setIsAutoSaveEnabled(!response?.data?.data?.if_auto_save);
  //       }
  //     }
  //   } catch (error: any) {
  //     if (axios.isAxiosError(error) && error.response) {
  //       const serverMessage =
  //         error.response.data?.message || "An error occurred";
  //       Toast.show({
  //         type: "error",
  //         text1: serverMessage,
  //         text2: "",
  //         position: "top",
  //       });
  //     }
  //     setIsLoading(false);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchContributionDetails = useCallback(async () => {
    try {
      setIsLoad(true);
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

      const response = await axios.get(
        `${API_BASE_URL}/ajo-contributions/show?ajo_contribution_id=${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // showLogs("response here:", response?.data?.data);

      if (response?.data?.status === "success") {
        setIsAminUser(response?.data?.data.admin_user.id === user?.id);
        setBalance(response?.data?.data?.contribution_total_amount);
        setContributionData(response?.data?.data?.ajo_contribution);
        setContributionRounds(response?.data?.data?.rounds || []);
        setContributionMembers(response?.data?.data?.members || []);
        setIsAutoSaveEnabled(response?.data?.data?.if_auto_save);
        setIsCurrentRoundPending(
          response?.data?.data?.is_current_round_pending
        );
        if (
          hasDateNotArrived(response?.data?.data?.ajo_contribution?.start_date)
        ) {
          setHasNotArrived(true);
        } else {
          setHasNotArrived(false);
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error fetching contribution details",
          text2: response?.data?.message || "Unknown error",
          position: "top",
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "Failed to fetch contribution details",
          position: "top",
        });
      }
      setIsLoad(false);
    } finally {
      setIsLoad(false);
    }
  }, [params.id]);

  const reportMember = async () => {
    try {
      setIsLoading(true);

      if (!selectedMemberId || !selectedMemberRoundId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Member ID or Round ID missing",
          position: "top",
        });
        setIsLoading(false);
        return;
      }

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

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/report-member`,
        {
          ajo_contribution_id: params.id,
          member_id: selectedMemberId,
          round_number: selectedMemberRoundId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Member reported successfully",
          position: "top",
        });

        fetchContributionDetails();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "Failed to report member",
          position: "top",
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "Opps sorry",
          position: "top",
        });
      }
    } finally {
      setIsReportSheetVisible(false);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const OTP = otp.join("");
    if (OTP.length < 4) {
      setIsTransactionPinVisible(false);
      Toast.show({
        type: "error",
        text1: "Invalid PIN",
        text2: "Please enter a valid transaction PIN",
        position: "top",
      });
      return;
    }

    const isValid = await verifyPin(OTP);
    if (!isValid) {
      setIsTransactionPinVisible(false);
      showErrorToast({
        title: "Invalid PIN",
        desc: "You entered an invalid pin, please try again",
      });
      return;
    }

    setIsLoading(true);
    setIsTransactionPinVisible(false);
    displayLoader();

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

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/deposit-money`,
        {
          ajo_contribution_id: params.id,
          pin: otp.join(""),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        Toast.show({
          type: "success",
          text1: response.data.message,
          text2: "Deposit successful",
          position: "top",
        });

        setIsTransactionPinVisible(false);
        setIsLoading(false);
        setTransactionPin("");
        setAmount("");
        setSchedule(false);
        fetchContributionDetails();
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response?.data?.errors?.pin || error.response?.data?.message;
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "Opps try check and try again",
          position: "top",
        });

        console.log("Deposit Error:", serverMessage);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to process deposit",
          position: "top",
        });
      }
      setIsLoading(false);
      setIsTransactionPinVisible(false);
    } finally {
      setIsLoading(false);
      hideLoader();
      setOtp(["", "", "", ""]);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchContributionDetails();
    }
    fetchContributionDetails();
  }, [fetchContributionDetails, params.id]);

  const EndContribution = useCallback(() => {
    setIsTransactionPin(true);
    setModalVisible(false);
  }, []);

  const handleEndContribution = async (pin: string) => {
    // const pin = otp.join("");
    // if (!pin || pin.length < 4) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Invalid PIN",
    //     text2: "Please enter a valid transaction PIN",
    //     position: "top",
    //   });
    //   return;
    // }

    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        setIsEndTrigerred(false);
        showErrorToast({
          title: "Invalid PIN",
          desc: "You entered an invalid pin, please try again",
        });
        return;
      }
    }

    try {
      setIsDelete(true);
      displayLoader();
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

      // console.log("Transaction PIN:", pin);

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/end`,
        {
          ajo_contribution_id: params.id,
          pin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.status === "success") {
        setTransactionPin("");
        navigationWithReset(navigation, "AjoContributionDashboard");
        Toast.show({
          type: "success",
          text1: "Successful!",
          text2: response.data.message,
          position: "top",
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response?.data?.errors?.pin || error.response?.data?.message;
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "Opps try check and try again",
          position: "top",
        });

        console.log("Deposit Error:", serverMessage);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to process deposit",
          position: "top",
        });
      }
      setIsDelete(false);
      setIsTransactionPin(false);
    } finally {
      setIsDelete(false);
      hideLoader();
    }
  };

  const toggleAutoSave = async () => {
    setIsLoading(true);
    displayLoader();
    try {
      const token = await SecureStore.getItemAsync("userToken");

      const ajoContributionId =
        activeContribution.length > 0
          ? (activeContribution[0] as any).id
          : null;

      showLogs("activeContribution", activeContribution);
      console.log("ajoContributionId", contributionData?.id);

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/toggle-auto-save`,
        { ajo_contribution_id: contributionData?.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.status === 200) {
        setIsAutoSaveEnabled(!isAutoSaveEnabled);
        Toast.show({
          type: "success",
          text1: isAutoSaveEnabled
            ? "Auto-save disabled."
            : "Auto-save enabled.",
          text2: "",
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to update auto-save setting.",
          text2: "",
          position: "top",
        });
      }
    } catch (error: any) {
      const firstError = getErrorMessage(error);
      showLogs("firstError", firstError);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          firstError || error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "",
          position: "top",
        });
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const handleEditcontribution = () => {
    router.push({
      pathname: "/EditAjoContribution",
      params: {
        id: params.id,
        formdata: contributionData ? JSON.stringify(contributionData) : null,
      },
    });
  };

  // showLogs("contributionRounds", contributionRounds);
  // showLogs("contributionMembers", contributionMembers);
  // showLogs("contributionData", contributionData);

  return (
    <SafeAreaView style={styles.container}>
      {isLoad ? (
        <LoadingComp visible />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className={IS_ANDROID_DEVICE ? "mt-6" : "mx-5"}
        >
          <View>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="black" />
              </TouchableOpacity>
              <Text style={styles.headerText}>Ajo Contribution Details</Text>
            </View>

            <View style={styles.heading}>
              <View>
                <Image
                  source={{ uri: contributionData?.cover_photo_url }}
                  style={{
                    height: 70,
                    width: 70,
                    borderRadius: 50,
                    marginBottom: 5,
                  }}
                />
                <Text style={styles.title}>{contributionData?.name}</Text>
                <Text style={styles.subTitle}>
                  {contributionData?.type} Ajo Savings
                </Text>
                <View style={styles.flex}>
                  <Text style={styles.amount}>
                    ₦
                    {isBalanceHidden
                      ? "****"
                      : formatAmount(
                          +contributionData?.amount *
                            contributionData?.no_of_members
                        )}
                  </Text>
                  <TouchableOpacity onPress={toggleBalanceVisibility}>
                    <Ionicons
                      name={isBalanceHidden ? "eye-off" : "eye"}
                      size={24}
                      color="#333"
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.activeStatus,
                      {
                        backgroundColor:
                          contributionData?.status === "closed"
                            ? COLORS.danger
                            : COLORS.greenText,
                      },
                    ]}
                  >
                    {contributionData?.status}
                  </Text>
                </View>
                <View>
                  <Text style={styles.date}>
                    Weekly contributions starting from:{" "}
                    {formatDateShort(
                      contributionData?.start_date || params.start_date
                    )}
                  </Text>
                  <View style={styles.codeContainer}>
                    <Text style={styles.code}>{contributionData?.hash_id}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (contributionData?.hash_id) {
                          Clipboard.setStringAsync(contributionData.hash_id);
                          Toast.show({
                            type: "success",
                            text1: "Copied to clipboard",
                            position: "top",
                          });
                        }
                      }}
                    >
                      <Ionicons
                        style={{ marginLeft: 10 }}
                        name="copy"
                        size={16}
                        color="#0000ff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {contributionData?.status !== "closed" && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.button}
                  onPress={handlePay}
                >
                  <MaterialCommunityIcons
                    name="arrow-down-bold-circle"
                    size={24}
                    color={COLORS.swiftPayBlue}
                  />
                  <Text style={styles.buttonText}>Deposit</Text>
                </TouchableOpacity>

                {isAdminUser && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.button}
                    onPress={handleEditcontribution}
                  >
                    <FontAwesome name="edit" size={24} color="#0000ff" />
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                )}

                {isAdminUser && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.button}
                    onPress={() => setIsEndTrigerred(true)}
                  >
                    <MaterialIcons name="delete" size={24} color="#0000ff" />
                    <Text style={styles.buttonText}>End</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.sectionTitle}>Contribution Rounds</Text>
            {isCurrentRoundPending && (
              <ErrorInfo
                message="A member(s) has not paid for the current round, so the Ajo
                  Contribution is on hold until payment is complete."
              />
            )}
            {contributionRounds.length > 0 ? (
              <View style={styles.section}>
                {Array.isArray(contributionRounds) &&
                  contributionRounds.map((round, index) => {
                    const calculateDaysLeft = (endDate: string) => {
                      const today = new Date();
                      const targetDate = new Date(endDate);
                      const timeDiff = targetDate.getTime() - today.getTime();
                      const daysLeft = Math.ceil(
                        timeDiff / (1000 * 90 * 60 * 23)
                      );
                      return daysLeft > 0 ? daysLeft : 0;
                    };

                    // Calculate days left for the round
                    const daysLeft = contributionData?.next_round_date
                      ? calculateDaysLeft(contributionData?.next_round_date)
                      : null;

                    const matchingMember = contributionMembers.find(
                      (member) => member.id === round.user_id
                    );

                    return (
                      <TouchableOpacity
                        key={index || round.id}
                        style={styles.roundCard}
                        onPress={() => handlePreview(round)}
                      >
                        <View>
                          <Text style={styles.label}>
                            {matchingMember ? matchingMember.name : round.name}
                          </Text>
                          {contributionData?.current_round === index + 1 && (
                            <Text
                              style={[
                                styles.label,
                                { color: COLORS.greenText, fontWeight: "700" },
                              ]}
                            >
                              .current round
                            </Text>
                          )}
                          <Text style={styles.price}>
                            ₦{formatAmount(+round.balance)}
                          </Text>
                        </View>
                        <View style={styles.align}>
                          <Text style={styles.round}>Round {round.order}</Text>
                          <Text
                            style={[
                              styles.statusText,
                              round.status === "completed"
                                ? styles.greenText
                                : round.status === "on-going"
                                ? styles.blueText
                                : round.status === "awaiting"
                                ? styles.yellowText
                                : round.status === "pending"
                                ? styles.danger
                                : styles.label,
                            ]}
                          >
                            {round.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ) : (
              <Text className="text-center text-gray-200 text-[16px] mb-[20px]">
                No rounds yet
              </Text>
            )}

            {contributionData?.status !== "closed" && (
              <View className="mt-4 mb-6 bg-[#e1effe] p-4 rounded-lg">
                <Text style={styles.headText}>Auto Save</Text>
                <View style={styles.autoSaveContainer}>
                  <Text style={styles.autoSaveText}>
                    Save Automatically Daily, Weekly Or Monthly With Autosave
                  </Text>
                  <Switch
                    value={isAutoSaveEnabled}
                    onValueChange={toggleAutoSave}
                    thumbColor={isAutoSaveEnabled ? "#0000ff" : "#f4f3f4"}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                  />
                </View>
              </View>
            )}

            {contributionMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Members</Text>
                {Array.isArray(contributionMembers) &&
                  contributionMembers.map((member, index) => (
                    <TouchableOpacity
                      activeOpacity={1}
                      key={index || member.id}
                      style={styles.memberCard}
                      // onPress={() =>
                      //   handleContribution(
                      //     member.id,
                      //     member.round_statuses?.[0]?.round_number || 1
                      //   )
                      // }
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={{ uri: member.profile_photo }}
                          style={styles.user}
                        />
                        <View>
                          <View style={styles.membersRound}>
                            <Text style={styles.name}>
                              {member.name}{" "}
                              <Text className="text-gray-200">
                                {member.role && `.${member.role}`}
                              </Text>{" "}
                              <Text style={{ color: COLORS.swiftPayBlue }}>
                                {member.id === user?.id && ".You"}
                              </Text>
                            </Text>

                            {contributionData?.type === "business" &&
                            member.role === "admin" ? null : (
                              <Text style={styles.round}>
                                Round {member.order_number}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.label}>{member.email}</Text>
                          <Text
                            style={[
                              styles.label,
                              { fontWeight: "600", fontSize: 16 },
                            ]}
                          >
                            {member.phone}
                          </Text>

                          {contributionData?.type === "business" &&
                          member.role === "admin" ? null : (
                            <View style={styles.roundIndicators}>
                              {member.round_statuses &&
                                Array.isArray(member.round_statuses) &&
                                member.round_statuses.map((item, idx) => (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={
                                      item.status.includes("unpaid") &&
                                      contributionData?.status !== "closed"
                                        ? () =>
                                            handleContribution(
                                              member.id,
                                              member.round_statuses?.[0]
                                                ?.round_number || 1
                                            )
                                        : () => {}
                                    }
                                    key={idx}
                                    style={[
                                      styles.contRound,
                                      {
                                        backgroundColor:
                                          item.status === "paid"
                                            ? "#0e9f6e"
                                            : item.status === "future"
                                            ? "#f59e0b"
                                            : "#f05252",
                                      },
                                    ]}
                                  >
                                    <Text className="font-medium text-[17px]">
                                      {item.round_number}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            <BottomSheet
              isVisible={isPreviewVisible}
              onBackdropPress={() => setIsPreviewVisible(false)}
            >
              <View style={styles.bottomSheetContent}>
                <Image
                  source={require("../assets/icons/date.png")}
                  style={styles.logo}
                />
                <Text style={styles.successBottomSheetHeader}>
                  {selectedRoundDetails?.name || "Round Details"}
                </Text>
                <Text style={styles.desc}>
                  {selectedRoundDetails?.status === "Pending"
                    ? `This round is scheduled to begin soon. Current balance: ${
                        selectedRoundDetails?.balance || "N/A"
                      }`
                    : selectedRoundDetails?.status === "Active"
                    ? `Active round with current balance: ${
                        selectedRoundDetails?.balance || "N/A"
                      }`
                    : `Completed round with final balance: ${
                        selectedRoundDetails?.balance || "N/A"
                      }`}
                </Text>

                <TouchableOpacity
                  style={styles.SellButton}
                  onPress={() => setIsPreviewVisible(false)}
                >
                  <Text style={styles.SellButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </BottomSheet>

            <BottomSheet
              isVisible={isReportSheetVisible}
              onBackdropPress={() => setIsReportSheetVisible(false)}
            >
              <View style={styles.bottomSheetContent}>
                <Image
                  source={require("../assets/icons/report.png")}
                  style={styles.logo}
                />
                <Text style={styles.successBottomSheetHeader}>
                  Report{" "}
                  {contributionMembers.find((m) => m.id === selectedMemberId)
                    ?.name || "Member"}
                </Text>
                <Text style={styles.desc}>
                  Are you sure you want to report this member to the Admin for
                  defaulting payment?
                </Text>

                <View style={styles.flexButtons}>
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={reportMember}
                    disabled={isLoading}
                  >
                    <Text style={styles.SellButtonText}>
                      {isLoading ? "Reporting..." : "Report"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsReportSheetVisible(false)}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BottomSheet>

            <Animated.View layout={LinearTransition.springify().damping(14)}>
              <BottomSheet
                isVisible={isTransactionPinVisible}
                onBackdropPress={() => setIsTransactionPinVisible(false)}
              >
                <View
                  style={[
                    styles.bottomSheetContent,
                    { minHeight: isKeyboardVisible ? 650 : 300 },
                  ]}
                >
                  <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>
                      Add money to Ajo Contribution
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsTransactionPinVisible(false)}
                    >
                      <AntDesign
                        name="closecircleo"
                        size={20}
                        color={"red"}
                        style={styles.icon}
                      />
                    </TouchableOpacity>
                  </View>

                  {hasNotArrived ? (
                    <View className="flex-row gap-3 items-center justify-center">
                      <FontAwesome6 name="info" size={20} color="#666" />
                      <Text className="text-[16px] text-[#666]">
                        Ajo Contribution has not started yet
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View className="items-center justify-center">
                        <Text className="text-[#444] text-[16px] mb-2">
                          Amount
                        </Text>
                        <Text className="text-[30px] text-swiftPayBlue font-bold">
                          ₦{formatAmount(contributionData?.amount || 0)}
                        </Text>
                      </View>

                      <Text style={styles.label} className="mb-3 mt-6">
                        Transaction PIN
                      </Text>
                      <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={styles.otpInput}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) =>
                              handleOtpChange(text, index)
                            }
                            onKeyPress={(e) => handleKeyPress(e, index)}
                          />
                        ))}
                      </View>

                      {/* <View style={styles.scheduleContainer}>
                        <View>
                          <Text style={styles.scheduleText}>
                            Schedule This Payment
                          </Text>
                          <Text style={styles.subscheduleText}>
                            or create a standing order to automatically pay it
                            at specified intervals
                          </Text>
                        </View>
                        <CustomSwitch
                          value={schedule}
                          onValueChange={setSchedule}
                        />
                      </View> */}

                      {/* {schedule && (
                        <>
                          <View style={styles.start}>
                            <Text style={styles.startText}>Start</Text>
                            <TouchableOpacity onPress={handleConfirmDate}>
                              <Text style={styles.immediatelyText}>
                                {selectedDate}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.frequencyContainer}>
                            <Text style={styles.frequencyTitle}>Frequency</Text>
                            <TouchableOpacity onPress={handleConfirmPayment}>
                              <Text style={styles.frequencyValue}>
                                {selectedFrequency}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )} */}

                      <Button
                        text="Add Money"
                        onPress={handleSave}
                        disabled={isLoading}
                      />
                    </View>
                  )}
                </View>
              </BottomSheet>
            </Animated.View>

            <BottomSheet
              isVisible={isEndTrigerred}
              onBackdropPress={() => setIsEndTrigerred(false)}
            >
              <Animated.View
                style={[styles.bottomSheetContent, animatedBottomSheetStyle]}
              >
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>
                    End Ajo Contribution
                  </Text>
                  <TouchableOpacity onPress={() => setIsEndTrigerred(false)}>
                    <AntDesign
                      name="closecircleo"
                      size={20}
                      color={"red"}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 items-center justify-center">
                  <Text className="text-[16px] text-[#666] text-center">
                    Are you sure you want to end this Ajo Contribution?
                  </Text>
                </View>

                <View className="items-center justify-center">
                  {/* <Text
                    style={styles.label}
                    className="mb-3 mt-6 font-bold text-[18px]"
                  >
                    Enter PIN
                  </Text> */}
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
                      />
                    ))}
                  </View> */}

                  <PinComponent
                    contStyles={{ height: 480 }}
                    onComplete={(pin: string) => {
                      handleEndContribution(pin);
                    }}
                    setModalState={setIsEndTrigerred}
                  />
                  {/* <Button
                    danger
                    full
                    text="End Ajo Contrbution"
                    onPress={handleEndContribution}
                    disabled={isLoading}
                  /> */}
                </View>
              </Animated.View>
            </BottomSheet>

            {/* <BottomSheet
              isVisible={isTransactionPin}
              onBackdropPress={() => setIsTransactionPin(false)}
            >
              <View style={[styles.bottomSheetContent]}>
                <View style={styles.bottomSheetHeader}></View>
                <Text style={styles.successBottomSheetHeader}>Enter Pin</Text>
                <Text style={styles.desc}>Enter pin to complete operation</Text>

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
                      autoFocus={index === 0}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleEndContribution}
                  disabled={isDelete}
                >
                  <Text style={styles.nextButtonText}>
                    {isDelete ? "Processing..." : "End Contribution"}
                  </Text>
                </TouchableOpacity>
              </View>
            </BottomSheet> */}

            <Modal
              transparent={true}
              visible={modalVisible}
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalText}>
                    Are you sure you want to end your Ajo Contribution?
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonNo}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>No</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButtonYes}
                      onPress={EndContribution}
                    >
                      <Text style={styles.modalButtonText}>Yes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      )}
      <Toast />
    </SafeAreaView>
  );
};

export default VenzaAjoScreen;

const styles = StyleSheet.create({
  roundIndicators: {
    flexDirection: "row",
    marginTop: 5,
    gap: 5,
  },
  roundIndicator: {
    padding: 3,
    borderRadius: 50,
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 7,
    textAlign: "center",
  },
  greenBackground: {
    backgroundColor: "green",
    color: "white", // Text color
  },
  redBackground: {
    backgroundColor: "red",
    color: "white", // Text color
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  container2: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  heading: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  subTitle: {
    fontSize: 15,
    color: "#333",
    textTransform: "capitalize",
  },
  amount: {
    fontSize: 26,
    fontWeight: "600",
    color: "#000",
    marginVertical: 10,
  },
  activeStatus: {
    fontWeight: "bold",
    padding: 8,
    borderRadius: 20,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 25,
    textTransform: "capitalize",
  },
  date: {
    color: "#666",
    fontSize: 13,
    maxWidth: "60%",
  },
  code: {
    color: "#0000ff",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 20,
  },
  button: {
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.swiftPayBlue,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#0000ff",
    fontWeight: "600",
    fontSize: 15,
  },
  section: {
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 10,
  },
  roundCard: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  memberCard: {
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  icon: {
    width: 25,
    height: 25,
  },
  flex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  align: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 3,
  },
  round: {
    backgroundColor: "#e1effe",
    padding: 5,
    borderRadius: 20,
    color: "#0000ff",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 15,
    alignSelf: "flex-end",
  },
  label: {
    fontSize: 16,
    color: "#111",
  },
  greenText: {
    color: COLORS.greenText,
    fontWeight: "600",
  },
  blueText: {
    color: "#1a56db",
    fontWeight: "600",
  },
  yellowText: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  danger: {
    color: COLORS.danger,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 14,
  },
  membersRound: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    gap: 10,
    minWidth: "85%",
  },
  memberamount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  green: {
    backgroundColor: "green",
    padding: 3,
    borderRadius: 50,
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 7,
  },
  red: {
    backgroundColor: "red",
    padding: 3,
    borderRadius: 50,
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 7,
  },
  name: {
    fontSize: 14,
    color: "#000",
    fontWeight: "700",
    maxWidth: "65%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  bottomSheetText: {
    fontSize: 16,
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
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  successBottomSheetContainer: {
    borderWidth: 1,
    padding: 10,
    borderColor: "#ddd",
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
  },
  subText: {
    fontWeight: "700",
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  SellButton: {
    backgroundColor: "#1400FB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  reportButton: {
    backgroundColor: "#CC1212",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 50,
    fontWeight: "600",
    fontSize: 15,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 50,
    borderWidth: 1,
  },
  cancelText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 18,
  },
  SellButtonText: {
    fontWeight: "600",
    color: "white",
    fontSize: 18,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  flexButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  user: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#000",
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
    padding: 6,
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
  frequencyTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  frequencyValue: {
    fontSize: 16,
    color: "#0000ff",
  },
  frequencyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
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
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButtonNo: {
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  modalButtonYes: {
    padding: 10,
    backgroundColor: "#ff0000",
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  otpContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 15,
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
  headText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  autoSaveContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  autoSaveText: {
    color: "#333",
    fontSize: 13,
    width: "80%",
  },
  contRound: {
    height: 25,
    width: 25,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
