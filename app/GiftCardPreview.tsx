import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { BottomSheet } from "@rneui/themed";
import { formatCurrency } from "../utils/formatters";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import PinComponent from "@/components/ui/PinComponent";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/Colors";
import { _TSFixMe, getErrorMessage } from "@/utils";
import { showErrorToast } from "@/components/ui/Toast";
import { showLogs } from "@/utils/logger";

const GiftCardPreview = () => {
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { displayLoader, hideLoader } = useAuth();

  // Get parameters passed from the previous screen
  const params = useLocalSearchParams<{
    productId: string;
    productName: string;
    amount: string;
    quantity: string;
    recipientName: string;
    recipientEmail: string;
    totalAmount: string;
    feeAmount: string;
    price: string;
    currencyCode: string;
    logoUrl: string;
  }>();

  const handlePay = () => {
    setIsTransactionPinVisible(true);
  };

  const [paymentState, setPaymentState] = useState<
    "idle" | "verifying" | "processing" | "success"
  >("idle");

  const handleConfirmPayment = async (pin: string) => {
    setPaymentState("verifying");
    setError("");
    setIsLoading(true);
    displayLoader();
    setError(null);

    try {
      // Get auth token
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // First step - verify PIN
      setPaymentState("processing");

      // Make the API call to buy the gift card
      const response = await axios.post(
        "https://swiftpaymfb.com/api/gift-cards/products/buy-gift-card",
        {
          product_id: parseInt(params.productId),
          amount: parseFloat(params.amount),
          quantity: parseInt(params.quantity),
          price: parseFloat(params.amount) * parseInt(params.quantity),
          fee_amount: parseFloat(params.feeAmount || "0"),
          total_amount: parseFloat(params.totalAmount || "0"),
          name: params.recipientName,
          email: params.recipientEmail,
          pin: parseInt(pin),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "success") {
        setPaymentState("success");
        setIsLoading(false);
        setIsTransactionPinVisible(false);
        setIsSuccessVisible(true);

        // Store transaction details for receipt if needed
        try {
          await SecureStore.setItemAsync(
            "lastGiftCardTransaction",
            JSON.stringify({
              ...response.data.data,
              productName: params.productName,
              recipientName: params.recipientName,
              recipientEmail: params.recipientEmail,
              amount: params.amount,
              quantity: params.quantity,
              totalAmount: params.totalAmount,
              date: new Date().toISOString(),
            })
          );
        } catch (storageErr) {
          console.error("Failed to store transaction details:", storageErr);
        }
      } else {
        showErrorToast({
          title: response.data.message || "Transaction failed",
        });
      }
    } catch (error: _TSFixMe) {
      setIsLoading(false);
      // setIsTransactionPinVisible(false);
      setPaymentState("idle");

      showLogs("message", error.response.data?.message);
      let errorMessage =
        error.response.data?.message ||
        "Transaction could not be processed. Please try again later.";

      setError(errorMessage);

      showErrorToast({
        title: errorMessage,
      });
    } finally {
      hideLoader();
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
    if (text && index < 3) {
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

  const renderItem = () => {
    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Order</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.cardPreview}>
          <Image
            source={{
              uri:
                params.logoUrl ||
                `https://cdn.reloadly.com/giftcards-v2/${params.productName
                  ?.toLowerCase()
                  .replace(/\s+/g, "-")}.png`,
            }}
            style={styles.cardImage}
            defaultSource={require("../assets/icons/gift.png")}
          />
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>{params.productName}</Text>
            <View style={styles.cardValueContainer}>
              <Text style={styles.cardValue}>
                {params.currencyCode}{" "}
                {formatCurrency(parseFloat(params.amount))}
              </Text>
              <View style={styles.cardQuantityBadge}>
                <Text style={styles.cardQuantityText}>x{params.quantity}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Amount in USD</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(
                  parseFloat(params.amount) * parseFloat(params.quantity)
                )}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="cash-plus" size={20} color="#666" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Price in NGN</Text>
              <Text style={styles.detailValue}>
                ₦{formatCurrency(+params.price)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="cash-plus" size={20} color="#666" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Fees</Text>
              <Text style={styles.detailValue}>
                ₦{formatCurrency(parseFloat(params.feeAmount || "0"))}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calculator-outline" size={20} color="#666" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{params.quantity}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.totalRow]}>
            <View style={styles.detailIconContainer}>
              <AntDesign
                name="creditcard"
                size={20}
                color={COLORS.swiftPayBlue}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₦ {formatCurrency(parseFloat(params.totalAmount || "0"))}
              </Text>
            </View>
          </View>
        </View>

        {/* Recipient Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person-outline" size={20} color="#666" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{params.recipientName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="#666"
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{params.recipientEmail}</Text>
            </View>
          </View>
        </View>

        {/* How to Redeem Section (condensed) */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Redemption Info</Text>
          <TouchableOpacity
            style={styles.collapsibleSection}
            onPress={() => {}}
          >
            <Text style={styles.collapsibleText}>
              After purchase, a redemption code will be sent to the recipient's
              email with instructions for use.
            </Text>
            <AntDesign name="right" size={16} color="#0066FF" />
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handlePay}>
          <Text style={styles.continueButtonText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Using FlatList instead of ScrollView to avoid nesting issues */}
      <FlatList
        data={[{ key: "content" }]}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />

      {/* Transaction PIN Bottom Sheet */}
      <BottomSheet
        isVisible={isTransactionPinVisible}
        onBackdropPress={() => !isLoading && setIsTransactionPinVisible(false)}
      >
        <View style={[styles.bottomSheetContent, { padding: 0 }]}>
          <View style={{ padding: 16 }}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>
                {paymentState === "idle"
                  ? "Complete Payment"
                  : paymentState === "verifying"
                  ? "Verifying PIN"
                  : paymentState === "processing"
                  ? "Processing Payment"
                  : "Payment Successful"}
              </Text>
              {!isLoading && (
                <TouchableOpacity
                  onPress={() => setIsTransactionPinVisible(false)}
                >
                  <AntDesign name="closecircleo" size={20} color={"#FF3B30"} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {paymentState === "idle" ? (
            <>
              <View style={styles.paymentSummary}>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Amount</Text>
                  <Text style={styles.paymentSummaryValue}>
                    ₦ {formatCurrency(parseFloat(params.totalAmount || "0"))}
                  </Text>
                </View>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>To</Text>
                  <Text style={styles.paymentSummaryValue}>
                    {params.recipientName}
                  </Text>
                </View>
              </View>

              <PinComponent
                onComplete={(pin: string) => {
                  handleConfirmPayment(pin);
                }}
                setModalState={setIsTransactionPinVisible}
              />

              {/* <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : {}
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    autoFocus={index === 0}
                    secureTextEntry
                  />
                ))}
              </View>
               */}
              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* <TouchableOpacity 
                style={[
                  styles.confirmButton, 
                  otp.join('').length !== 4 && styles.confirmButtonDisabled
                ]} 
                onPress={handleConfirmPayment}
                disabled={isLoading || otp.join('').length !== 4}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                )}
              </TouchableOpacity> */}
            </>
          ) : (
            <View style={styles.processingContainer}>
              {paymentState !== "success" && (
                <ActivityIndicator
                  size="large"
                  color="#0066FF"
                  style={styles.processingIndicator}
                />
              )}
              <Text style={styles.processingText}>
                {paymentState === "verifying"
                  ? "Verifying your PIN..."
                  : paymentState === "processing"
                  ? "Processing your payment..."
                  : "Payment successful!"}
              </Text>
            </View>
          )}
        </View>
      </BottomSheet>

      {/* Success Bottom Sheet */}
      <BottomSheet
        isVisible={isSuccessVisible}
        onBackdropPress={() => setIsSuccessVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.successIconContainer}>
            <Image
              source={require("../assets/icons/success.png")}
              style={styles.successImage}
            />
          </View>

          <Text style={styles.successTitle}>Purchase Successful!</Text>
          <Text style={styles.successDescription}>
            Your purchase of {params.productName} for ₦{" "}
            {formatCurrency(parseFloat(params.totalAmount || "0"))} was
            successful
          </Text>

          <View style={styles.orderInfoContainer}>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Order ID</Text>
              <Text style={styles.orderInfoValue}>
                SW-{Math.floor(Math.random() * 10000000)}
              </Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Gift Card</Text>
              <Text style={styles.orderInfoValue}>{params.productName}</Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Recipient</Text>
              <Text style={styles.orderInfoValue}>{params.recipientEmail}</Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Date</Text>
              <Text style={styles.orderInfoValue}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.orderInfoRow, styles.orderInfoTotal]}>
              <Text style={styles.orderInfoTotalLabel}>Total Amount</Text>
              <Text style={styles.orderInfoTotalValue}>
                ₦ {formatCurrency(parseFloat(params.totalAmount || "0"))}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewReceiptButton}
            onPress={() => {
              setIsSuccessVisible(false);
              router.push("/GiftcardSuccess");
            }}
          >
            <Text style={styles.viewReceiptButtonText}>View Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goHomeButton}
            onPress={() => {
              setIsSuccessVisible(false);
              router.replace("/(tabs)");
            }}
          >
            <Text style={styles.goHomeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
      <Toast />
    </View>
  );
};

export default GiftCardPreview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  backButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  placeholder: {
    width: 40,
  },
  cardPreview: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  cardDetails: {
    marginLeft: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#666666",
  },
  cardValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cardQuantityBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  cardQuantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  detailsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginTop: 4,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.swiftPayBlue,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.swiftPayBlue,
  },
  collapsibleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collapsibleText: {
    flex: 1,
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginRight: 8,
  },
  continueButton: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.swiftPayBlue,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.swiftPayBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSheetContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  pinDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#666666",
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginHorizontal: 6,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    color: "#1A1A1A",
  },
  confirmButton: {
    backgroundColor: COLORS.swiftPayBlue,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  successImage: {
    width: 96,
    height: 96,
    alignSelf: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  orderInfoContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 4,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: "#666666",
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  viewReceiptButton: {
    backgroundColor: COLORS.swiftPayBlue,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  viewReceiptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  goHomeButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  goHomeButtonText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentSummary: {
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  paymentSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: "#666666",
  },
  paymentSummaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  confirmButtonDisabled: {
    backgroundColor: "#A0AEC0",
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  processingIndicator: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: COLORS.swiftPayBlue,
    backgroundColor: "#EEF2FF",
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  orderInfoTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginTop: 8,
  },
  orderInfoTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  orderInfoTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.swiftPayBlue,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
});
