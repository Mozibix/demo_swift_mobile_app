import { AntDesign } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { BottomSheet } from "@rneui/themed";
import {
  apiService,
  RecentTransfer,
  SwiftPayUser,
  UserProfile,
} from "../services/api";
import { Image } from "expo-image";
import Toast from "../components/Toast";
import { showLogs } from "@/utils/logger";
import { useAuth, User } from "@/context/AuthContext";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import Button from "@/components/ui/Button";
import { _TSFixMe, getErrorMessage } from "@/utils";
import { showErrorToast } from "@/components/ui/Toast";
import PinComponent from "@/components/ui/PinComponent";
import KAScrollView from "@/components/ui/KAScrollView";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";

type SwiftPayFavorite = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  name: string;
  profile_photo: string;
  hash_id: string;
};

export type Beneficiary = {
  id: number;
  user_id: number;
  beneficiary_id: number;
  reference: string;
  description: string;
  amount: string;
  status: "successful" | "pending" | "failed";
  created_at: string;
  updated_at: string;
  source_link: string | null;
  if_favorite: boolean;
  receiver: User;
};

const TransferToSwiftpay: React.FC = () => {
  const params = useLocalSearchParams<{ tag?: string }>();

  const [swiftPayTag, setSwiftPayTag] = useState(params.tag || "");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<RecentTransfer[]>([]);
  const [recipient, setRecipient] = useState<SwiftPayUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isChecked, setIsChecked] = useState(true);

  // State to manage tab selection
  const [selectedTab, setSelectedTab] = useState("Recent"); // Default to 'Recent'

  // State variables for bottom sheet visibility
  const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState({});
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  // Add loading states for different operations
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Add this with other state declarations
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSameTagError, setShowSameTagError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [favorites, setFavorites] = useState<SwiftPayFavorite[]>([]);
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );
  const { transferSource } = useMultipleTransfer();
  const { user, displayLoader, hideLoader, verifyPin, getUserProfile } =
    useAuth();

  useEffect(() => {
    fetchRecentTransfers();
    fetchFavorites();
    fetchUserProfile();

    if (params.tag) {
      handleSwiftPayTagChange(params.tag);
    }
  }, [params.tag]);

  const fetchRecentTransfers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRecentTransfers();
      setRecentTransfers(response.recent_transfers);
      // console.log(response);
    } catch (error: any) {
      setToastMessage(
        error.response?.data?.error || "Failed to fetch recent transfers"
      );
      setToastType("error");
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  async function fetchFavorites() {
    try {
      setFavoritesLoading(true);
      const response = await apiService.swiftPayTransferBeneficiaries();
      setFavorites(response.data.favorites);
    } catch (error) {
    } finally {
      setFavoritesLoading(false);
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      setUserProfile(response);
    } catch (error: any) {
      setToastMessage(error.response?.data?.error || "Failed to fetch profile");
      setToastType("error");
      setToastVisible(true);
    }
  };

  const handleSwiftPayTagChange = async (tag: string) => {
    if (!swiftPayTag) return;

    displayLoader();
    const username = tag.startsWith("@") ? tag.substring(1) : tag;
    setShowSameTagError(false);
    if (tag.length > 0) {
      try {
        const response = await apiService.verifySwiftpayUser(username);
        // showLogs("response.data.user", response.data);
        if (response.status === "success") {
          setRecipient(response.data.user);
          setRecipientName(
            response.data.user.first_name + " " + response.data.user.last_name
          );
        }
      } catch (error: any) {
        const firstError = getErrorMessage(error);
        showErrorToast({
          title: "An error occured",
          desc: firstError || "Could not find swiftway user",
        });
        setRecipient(null);
        setRecipientName("");
      } finally {
        hideLoader();
      }
    }

    if (username === user?.username) {
      setShowSameTagError(true);
    } else {
      setShowSameTagError(false);
    }
  };

  const handleNext = async () => {
    try {
      setIsConfirming(true);
      if (!recipient) {
        setToastMessage("Please enter a valid SwiftPay tag");
        setToastType("error");
        setToastVisible(true);
        return;
      }

      if (!amount || parseFloat(amount) < 100) {
        setToastMessage("Please enter a valid amount (minimum 100)");
        setToastType("error");
        setToastVisible(true);
        return;
      }

      if (!userProfile || parseFloat(amount) > userProfile.wallet_balance) {
        setToastMessage("Insufficient balance");
        setToastType("error");
        setToastVisible(true);
        return;
      }

      // const response = await apiService.confirmTransfer({
      //   username: recipient.username,
      //   amount: parseFloat(amount),
      //   description: remark || "Transfer",
      // });

      setIsPaymentSummaryVisible(true);
    } catch (error: any) {
      setToastMessage(
        error.response?.data?.error || "Failed to confirm transfer"
      );
      setToastType("error");
      setToastVisible(true);
    } finally {
      setIsConfirming(false);
    }
  };

  const handlePay = () => {
    setIsPaymentSummaryVisible(false); // Hide the payment summary bottom sheet
    setIsTransactionPinVisible(true); // Show the transaction pin bottom sheet
  };

  const handleConfirmPayment = async (pin: string) => {
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    try {
      setIsTransferring(true);
      if (!recipient) return;

      const response = await apiService.transferToSwiftpay({
        username: recipient.username,
        amount: amount.toString(),
        description: remark || "Transfer",
        pin,
        source_link:
          transferSource === "send_to_africa" ? transferSource : null,
      });

      if (response.status === "success") {
        getUserProfile();
        setIsTransactionPinVisible(false);
        setIsSuccessVisible(true);

        // Store transaction details for receipt
        const details = {
          amount: parseFloat(amount),
          recipientName: recipientName,
          recipientTag: recipient.username,
          senderName: userProfile?.first_name + " " + userProfile?.last_name,
          description: remark || "SwiftPay Transfer",
          reference: response.data.reference,
          date: response.data.created_at,
          status: response.data.status,
          transactionType: "Swiftpay Transfer",
        };

        setTransactionDetails(details);

        // Store in AsyncStorage for receipt access
        await AsyncStorage.setItem("lastTransaction", JSON.stringify(details));

        // Set these for the success message
        setTransferAmount(amount);
        setTransferRecipient(recipientName);

        // Reset form fields
        setSwiftPayTag("");
        setRecipientName("");
        setAmount("");
        setRemark("");
        setOtp(["", "", "", ""]);
      } else {
        setToastMessage("Transfer failed");
        setToastType("error");
        setToastVisible(true);
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Transfer failed");
      setToastType("error");
      setToastVisible(true);
    } finally {
      setIsTransferring(false);
    }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <KAScrollView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <AntDesign name="arrowleft" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Transfer to Swiftpay Account</Text>
            <TouchableOpacity onPress={() => router.push("/Transactions")}>
              <Text style={styles.headerText2}>History</Text>
            </TouchableOpacity>
          </View>
          <View>
            <View style={styles.notice}>
              <Image
                source={require("../assets/icons/strike.png")}
                style={styles.icon}
              />
              <Text style={styles.note}>
                Transfers made to swiftpay accounts are FREE
              </Text>
            </View>
            <Text style={styles.Subtitle}>Transaction Details</Text>

            <View style={styles.inputContainer}>
              <View style={styles.tagInputContainer}>
                <Text style={styles.tagPrefix}>@</Text>
                <TextInput
                  style={styles.tagInput}
                  placeholder="johndoe"
                  value={
                    swiftPayTag.startsWith("@")
                      ? swiftPayTag.substring(1)
                      : swiftPayTag
                  }
                  onChangeText={(text) => {
                    setSwiftPayTag(text.startsWith("@") ? text : `@${text}`);
                    setShowSameTagError(false);
                  }}
                />
              </View>

              {!recipientName && !showSameTagError && (
                <Button
                  text="Confirm User"
                  outlined
                  softBg
                  onPress={() =>
                    handleSwiftPayTagChange(
                      swiftPayTag.startsWith("@")
                        ? swiftPayTag
                        : `@${swiftPayTag}`
                    )
                  }
                  classNames="p-4 mb-8 -mt-1"
                />
              )}

              {showSameTagError && (
                <Animated.Text
                  entering={ZoomIn}
                  exiting={ZoomOut}
                  className="text-red text-base mb-6"
                >
                  You cannot transfer to yourself
                </Animated.Text>
              )}

              {recipientName && !showSameTagError && (
                <View style={styles.recipientContainer}>
                  <View style={styles.recipientBox}>
                    <Text style={styles.label}>Account Name</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <AntDesign name="checkcircle" size={16} color="#0000ff" />
                      <Text style={styles.recipientName}>{recipientName}</Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="10,000"
                value={amount}
                keyboardType="numeric"
                onChangeText={setAmount}
              />
              <Text style={styles.label}>Remark</Text>
              <TextInput
                style={styles.input}
                placeholder="Part payment"
                value={remark}
                onChangeText={setRemark}
              />
            </View>

            {/* Tab Switcher */}
            <View style={styles.recentContainer}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    selectedTab === "Recent" && styles.activeTab,
                  ]}
                  onPress={() => setSelectedTab("Recent")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === "Recent" && styles.activeTabText,
                    ]}
                  >
                    Recent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    selectedTab === "Favourites" && styles.activeTab,
                  ]}
                  onPress={() => setSelectedTab("Favourites")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === "Favourites" && styles.activeTabText,
                    ]}
                  >
                    Favourites
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Conditional Rendering Based on Selected Tab */}
              {selectedTab === "Recent" ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.tabContent}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                  ) : recentTransfers?.length > 0 ? (
                    recentTransfers.map((transfer: RecentTransfer) => (
                      <TouchableOpacity
                        key={transfer.id}
                        style={styles.userItem}
                        onPress={() => {
                          setSwiftPayTag(transfer.username);
                          handleSwiftPayTagChange(transfer.username);
                        }}
                      >
                        <View style={styles.userInfo}>
                          <Image
                            source={{
                              uri: transfer.profile_photo,
                            }}
                            style={{ height: 30, width: 30, borderRadius: 100 }}
                            contentFit="cover"
                          />

                          <View>
                            <Text style={styles.userName}>{transfer.name}</Text>
                            <Text style={styles.userTag}>
                              @{transfer.username}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noTransfersContainer}>
                      <Text style={styles.noTransfersText}>
                        No recent transfers
                      </Text>
                    </View>
                  )}
                  {recentTransfers?.length > 0 && (
                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={() => router.push("/SwiftPayBeneficiaries")}
                    >
                      <Text style={styles.viewAllText}>View all</Text>
                      <AntDesign name="right" size={16} color="#0000ff" />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.tabContent}
                >
                  {favoritesLoading ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                  ) : favorites?.length > 0 ? (
                    favorites.map((transfer: SwiftPayFavorite) => (
                      <TouchableOpacity
                        key={transfer.id}
                        style={styles.userItem}
                        onPress={() => {
                          setSwiftPayTag(transfer.username);
                          handleSwiftPayTagChange(transfer.username);
                        }}
                      >
                        <View style={styles.userInfo}>
                          <Image
                            source={{
                              uri: transfer.profile_photo,
                            }}
                            style={{ height: 30, width: 30, borderRadius: 100 }}
                            contentFit="cover"
                          />

                          <View>
                            <Text style={styles.userName}>{transfer.name}</Text>
                            <Text style={styles.userTag}>
                              @{transfer.username}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noTransfersContainer}>
                      <Text style={styles.noTransfersText}>
                        No favorites yet
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>

            <Button
              text="Next"
              onPress={handleNext}
              disabled={
                !swiftPayTag || !amount || isConfirming || showSameTagError
              }
              isLoading={isConfirming}
              loadingText="Processing..."
            />
          </View>

          {/* Payment Summary Bottom Sheet */}
          <BottomSheet
            isVisible={isPaymentSummaryVisible}
            onBackdropPress={() => setIsPaymentSummaryVisible(false)}
            modalProps={{
              statusBarTranslucent: true,
              hardwareAccelerated: true,
            }}
            containerStyle={styles.bottomSheetContainer}
          >
            <View style={[styles.bottomSheetContent, { padding: 24 }]}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
                <TouchableOpacity
                  onPress={() => setIsPaymentSummaryVisible(false)}
                >
                  <AntDesign
                    name="closecircle"
                    size={22}
                    color={"#D32F2F"}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>
                  ₦{parseFloat(amount).toLocaleString()}
                </Text>
              </View>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Transaction Details</Text>

                <View style={styles.summaryItemContainer}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Swiftpay Tag</Text>
                    <Text style={styles.summaryValue}>{swiftPayTag}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Recipient Name</Text>
                    <Text style={styles.summaryValue}>
                      {recipientName.length > 23
                        ? `${recipientName.slice(0, 23)}...`
                        : recipientName}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Amount</Text>
                    <Text style={styles.summaryValue}>
                      ₦{parseFloat(amount).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Remark</Text>
                    <Text style={styles.summaryValue}>
                      {remark || "Transfer"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.paymentMethodSection}>
                <Text style={styles.paymentMethodTitle}>Payment Method</Text>
                <View style={styles.paymentMethodContainer}>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodLabel}>
                      SwiftPay Balance
                    </Text>
                    <Text style={styles.paymentMethodBalance}>
                      ₦{(userProfile?.wallet_balance || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.paymentMethodCheckmark}>
                    <AntDesign name="check" size={16} color="white" />
                  </View>
                </View>
              </View>

              <Button text="Pay Now" onPress={handlePay} />
            </View>
          </BottomSheet>

          {/* Transaction PIN Bottom Sheet */}
          <BottomSheet
            isVisible={isTransactionPinVisible}
            onBackdropPress={() => setIsTransactionPinVisible(false)}
            modalProps={{
              statusBarTranslucent: true,
              hardwareAccelerated: true,
            }}
            containerStyle={styles.bottomSheetContainer}
          >
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
                <TouchableOpacity
                  onPress={() => setIsTransactionPinVisible(false)}
                >
                  <AntDesign
                    name="closecircle"
                    size={22}
                    color={"#D32F2F"}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>
              </View>

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

          {/* Success Bottom Sheet */}
          <BottomSheet
            isVisible={isSuccessVisible}
            onBackdropPress={() => setIsSuccessVisible(false)}
            modalProps={{
              statusBarTranslucent: true,
              hardwareAccelerated: true,
            }}
            containerStyle={styles.bottomSheetContainer}
          >
            <View style={[styles.bottomSheetContent, { padding: 24 }]}>
              <View style={styles.successIconContainer}>
                <Image
                  source={require("../assets/icons/success.png")}
                  style={styles.successIcon}
                />
              </View>

              <Text style={styles.successTitle}>Transfer Successful</Text>

              <View style={styles.successDetailsContainer}>
                <Text style={styles.successDescription}>
                  Your transfer of{" "}
                  <Text style={styles.successHighlight}>
                    ₦{parseFloat(transferAmount).toLocaleString()}
                  </Text>{" "}
                  to{" "}
                  <Text style={styles.successHighlight}>
                    {transferRecipient}
                  </Text>{" "}
                  has been completed successfully.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.actionButton}
                onPress={() => {
                  setIsSuccessVisible(false);
                  router.push({
                    pathname: "/TransactionReceipt",
                    params: {
                      currentTransaction: JSON.stringify(transactionDetails),
                      type: "transfer",
                    },
                  });
                }}
              >
                <Text style={styles.actionButtonText}>View Receipt</Text>
              </TouchableOpacity>
            </View>
          </BottomSheet>
        </KAScrollView>
      </View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    paddingTop: IS_IOS_DEVICE ? 0 : 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  note: {
    color: "#0000ff",
    fontSize: 13,
  },
  inputContainer: {
    marginTop: 20,
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  tagPrefix: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  tagInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
  recipientContainer: {
    marginBottom: 20,
  },
  recipientBox: {
    backgroundColor: "#EFF4FF",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  recipientName: {
    color: "#0000ff",
    fontSize: 15,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    fontSize: 16,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  headerText2: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: "#009329",
  },
  icon: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFF4FF",
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 15,
  },
  label: {
    fontWeight: "500",
    marginBottom: 5,
  },
  Subtitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 30,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#0000ff",
  },
  tabText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#0000ff",
    fontWeight: "600",
  },
  tabContent: {
    paddingHorizontal: 5,
  },
  userItem: {
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    // borderRadius: 20,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  userTag: {
    fontSize: 13,
    color: "#666",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  viewAllText: {
    color: "#0000ff",
    fontSize: 14,
    fontWeight: "500",
  },
  noTransfersContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noTransfersText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  disabledButtonText: {
    color: "#666",
  },

  // Improved bottom sheet styles
  bottomSheetContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingTop: Platform.OS === "ios" ? 20 : 0,
    maxHeight: "100%",
    borderBottomWidth: 0, // Remove any potential border
  },
  bottomSheetContent: {
    paddingVertical: 24,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === "ios" ? 40 : 30, // Increase bottom padding
    maxHeight: "100%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderBottomWidth: 0, // Ensure no border at the bottom
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 15,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  closeIcon: {
    padding: 5,
    paddingRight: 10,
  },

  // Payment summary bottom sheet
  amountContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0000ff",
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  summaryItemContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    width: "100%",
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  paymentMethodInfo: {
    flexDirection: "column",
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  paymentMethodBalance: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  paymentMethodCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },

  // Transaction PIN bottom sheet
  pinContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  pinTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  pinDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  otpContainer: {
    flexDirection: "row",
    gap: 15,
    justifyContent: "center",
    marginBottom: 30,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    color: "#333",
    fontWeight: "700",
    backgroundColor: "#f9f9f9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Success bottom sheet
  successIconContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#00952A",
    textAlign: "center",
    marginBottom: 16,
  },
  successDetailsContainer: {
    marginBottom: 30,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  successDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
  },
  successHighlight: {
    color: "#0000ff",
    fontWeight: "600",
  },

  // Action button
  actionButton: {
    backgroundColor: "#0000ff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    elevation: 3,
    shadowColor: "#0000ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10, // Add space at the bottom to prevent overlap
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default TransferToSwiftpay;
