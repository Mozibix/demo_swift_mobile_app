import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
} from "react-native";
import SvgQRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { apiService } from "@/services/api";
import Button from "@/components/ui/Button";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator } from "react-native-paper";
import SkeletonLoader from "@/components/SkeletonLoader";

interface UserProfile {
  first_name: string;
  username: string;
}
const QrCodeMain = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  const { user } = useAuth();

  const [qrValue, setQrValue] = useState(`@${user?.username || "loading"}`);

  const userName = userProfile?.first_name || "...";
  const fullName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.username}`
    : "";
  const swiftPayTag = userProfile?.username ? `@${userProfile.username}` : "";

  const viewShotRef = useRef<ViewShot>(null);
  const shareViewShotRef = useRef<ViewShot>(null);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.getUserProfile();
      setUserProfile(response);
      setQrValue(`@${response.username}`);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const generateQRValue = (amountValue: string = "", remarks: string = "") => {
    if (!swiftPayTag) return qrValue || `@${user?.username || ""}`;

    let qrValueString = swiftPayTag;

    if (amountValue && parseFloat(amountValue) > 0) {
      qrValueString += `|${amountValue}`;
    }

    if (remarks) {
      qrValueString += `|${remarks}`;
    }

    return qrValueString;
  };

  const handleGenerateQR = () => {
    const newQrValue = generateQRValue(amount, remarks);
    setQrValue(newQrValue);
    setShowAmountModal(false);
  };

  const handleAmountChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");
    const [integerPart, decimalPart] = cleaned.split(".");
    const formattedInteger = parseInt(integerPart || "0").toLocaleString();
    const formatted =
      decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

    setAmount(formatted);
  };

  const clearAmount = () => {
    setAmount("");
    setRemarks("");
    setQrValue(generateQRValue("", ""));
  };

  const handleShareQR = async () => {
    if (shareViewShotRef.current && shareViewShotRef.current.capture) {
      try {
        const uri = await shareViewShotRef.current.capture();
        const amountText =
          amount && parseFloat(amount) > 0 ? ` for ₦${amount}` : "";
        const shareOptions = {
          title: `${userName}'s SwiftPay QR Code`,
          url: uri,
          message: `${userName}'s SwiftPay tag is ${swiftPayTag}. Scan this QR code to send money${amountText}!`,
        };

        await Sharing.shareAsync(uri, {
          dialogTitle: shareOptions.title,
          UTI: "public.png",
        });
      } catch (err) {
        console.error("Error capturing or sharing:", err);
      }
    }
  };

  const goToScanQR = () => {
    router.push("/QrCodeScreen");
  };

  const displayAmount = amount && parseFloat(amount) > 0 ? `₦${amount}` : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.swiftPayBlue} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : ( */}
      <>
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAmountModal}
          onRequestClose={() => setShowAmountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Amount</Text>
                <TouchableOpacity onPress={() => setShowAmountModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalDescription}>
                Enter the amount you want to receive (optional)
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={amount.toLocaleString()}
                  onChangeText={handleAmountChange}
                  maxLength={10}
                />
              </View>
              <View style={styles.remarksInputContainer}>
                <Text style={styles.remarksLabel}>Remarks (optional)</Text>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Enter remarks (optional)"
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={4}
                  value={remarks}
                  onChangeText={setRemarks}
                  maxLength={200}
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.skipButton]}
                  onPress={() => {
                    setAmount("");
                    handleGenerateQR();
                  }}
                >
                  <Text style={styles.skipButtonText}>Skip Amount</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.generateButton]}
                  onPress={handleGenerateQR}
                >
                  <Text style={styles.generateButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Hidden component for sharing */}
        <ViewShot
          ref={shareViewShotRef}
          options={{ format: "png", quality: 0.9 }}
          style={styles.hiddenShareView}
        >
          <View style={styles.shareContainer}>
            <View style={styles.shareHeader}>
              <Image
                source={require("../assets/icons/icon.png")}
                style={styles.shareHeaderLogo}
                resizeMode="contain"
              />
              <Text style={styles.shareAppName}>SwiftPay</Text>
            </View>
            <Text style={styles.shareUserName}>{fullName}</Text>
            <Text style={styles.shareTag}>{swiftPayTag}</Text>
            {displayAmount && (
              <View style={styles.shareAmountBadge}>
                <Text style={styles.shareAmountText}>{displayAmount}</Text>
              </View>
            )}
            <View style={styles.shareQrContainer}>
              {qrValue && (
                <SvgQRCode
                  value={qrValue}
                  size={220}
                  backgroundColor="white"
                  color="#0047FF"
                  logo={require("../assets/icons/icon.png")}
                  logoSize={60}
                  logoBackgroundColor="white"
                  logoMargin={2}
                />
              )}
            </View>
            <Text style={styles.shareTagline}>
              Scan to send money instantly
            </Text>
            <View style={styles.shareFooter}>
              <View style={styles.shareFooterDot} />
              <Text style={styles.shareFooterText}>
                Secure • Fast • Reliable
              </Text>
            </View>
          </View>
        </ViewShot>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>
              Pay Via QR Code
              <SkeletonLoader width="90%" height={20} />
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.mainContent}>
            <View style={styles.qrSection}>
              <ViewShot
                ref={viewShotRef}
                options={{ format: "png", quality: 0.9 }}
              >
                <View style={styles.qrContainer}>
                  {qrValue && (
                    <SvgQRCode
                      value={qrValue}
                      size={220}
                      backgroundColor="white"
                      logo={require("../assets/icons/icon.png")}
                      logoSize={40}
                      logoBackgroundColor="white"
                      logoMargin={2}
                    />
                  )}
                </View>
              </ViewShot>

              <View style={styles.userInfoContainer}>
                {loading ? (
                  <View style={{ alignItems: "center" }}>
                    <SkeletonLoader
                      width={60}
                      height={20}
                      style={styles.skeletonText}
                    />
                    <SkeletonLoader
                      width={80}
                      height={18}
                      style={styles.skeletonText}
                    />
                  </View>
                ) : (
                  <>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.swiftPayTag}>{swiftPayTag}</Text>
                  </>
                )}
                {displayAmount && (
                  <View style={styles.amountBadge}>
                    <MaterialCommunityIcons
                      name="cash"
                      size={16}
                      color={COLORS.swiftPayBlue}
                    />
                    <Text style={styles.amountText}>{displayAmount}</Text>
                  </View>
                )}
              </View>

              {amount && parseFloat(amount) > 0 ? (
                <TouchableOpacity
                  style={styles.generateQRButton}
                  onPress={clearAmount}
                >
                  <MaterialCommunityIcons
                    name="cash-fast"
                    size={24}
                    color={COLORS.swiftPayBlue}
                  />
                  <Text style={styles.generateQRText}>Clear Amount</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.generateQRButton}
                  onPress={() => setShowAmountModal(true)}
                >
                  <MaterialCommunityIcons
                    name="cash-fast"
                    size={24}
                    color={COLORS.swiftPayBlue}
                  />
                  <Text style={styles.generateQRText}>Set Amount</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShareQR}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons
                    name="share-social-outline"
                    size={24}
                    color={COLORS.swiftPayBlue}
                  />
                </View>
                <Text style={styles.actionText}>Share QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={goToScanQR}
              >
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={24}
                    color={COLORS.swiftPayBlue}
                  />
                </View>
                <Text style={styles.actionText}>Scan to Pay</Text>
              </TouchableOpacity>
            </View>
            <Button
              text="Scan to Pay"
              onPress={goToScanQR}
              classNames="w-full"
            />
          </View>
        </ScrollView>
      </>
    </SafeAreaView>
  );
};

export default QrCodeMain;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  skeletonText: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  qrSection: {
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
  },
  qrContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },
  swiftPayTag: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  amountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 71, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.swiftPayBlue,
    marginLeft: 6,
  },
  generateQRButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 17,
    backgroundColor: "rgba(0, 71, 255, 0.1)",
    borderRadius: 25,
  },
  generateQRText: {
    color: COLORS.swiftPayBlue,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  clearAmountButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearAmountText: {
    color: "#FF3B30",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
    marginBottom: 40,
  },
  actionButton: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 71, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    color: "#333",
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.swiftPayBlue,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.swiftPayBlue,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    paddingVertical: 16,
  },
  remarksInputContainer: {
    marginBottom: 24,
  },
  remarksLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  remarksInput: {
    height: 100,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#f0f0f0",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Share view styles
  hiddenShareView: {
    position: "absolute",
    width: 375,
    height: 667,
    opacity: 0,
  },
  shareContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0047FF",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shareHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  shareHeaderLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  shareAppName: {
    color: "white",
    fontSize: 32,
    fontWeight: "600",
  },
  shareUserName: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  shareTag: {
    color: "white",
    fontSize: 24,
    marginBottom: 15,
  },
  shareAmountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 15,
  },
  shareAmountText: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  shareQrContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  shareTagline: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 40,
  },
  shareFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  shareFooterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
    marginRight: 10,
  },
  shareFooterText: {
    color: "white",
    fontSize: 16,
  },
});
