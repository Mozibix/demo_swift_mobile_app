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
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
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
import SkeletonLoader from "@/components/SkeletonLoader";
import { KeyboardAvoidingView } from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native-paper";

interface UserProfile {
  first_name: string;
  username: string;
}

const QrCodeMain = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const { user } = useAuth();

  const [qrValue, setQrValue] = useState(`@${user?.username || "loading"}`);

  const userName = userProfile?.first_name || "...";
  const fullName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.username}`
    : "";
  const swiftPayTag = userProfile?.username ? `@${userProfile.username}` : "";

  const viewShotRef: any = useRef<ViewShot>(null);
  const shareViewShotRef: any = useRef<ViewShot>(null);

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
    if (!shareViewShotRef.current) return;

    try {
      const uri = await shareViewShotRef.current.capture();

      await Sharing.shareAsync(uri, {
        dialogTitle: `${userProfile?.first_name}'s SwiftPay QR Code`,
        UTI: "public.png",
        mimeType: "image/png",
      });

      setShowSharePreview(false);
      // Toast.show({
      //   type: "success",
      //   position: "top",
      //   text1: "Success",
      //   text2: "QR code shared successfully!",
      //   visibilityTime: 3000,
      // });
    } catch (err) {
      console.error("Error capturing or sharing:", err);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Error",
        text2: "Failed to share your QR code. Please try again.",
        visibilityTime: 3000,
      });
    }
  };

  const handleShareQRCodeOnly = async () => {
    if (!viewShotRef.current) return;

    try {
      const uri = await viewShotRef.current.capture();

      await Sharing.shareAsync(uri, {
        dialogTitle: `${userProfile?.first_name}'s SwiftPay QR Code`,
        UTI: "public.png",
        mimeType: "image/png",
      });
    } catch (err) {
      console.error("Error capturing or sharing:", err);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Error",
        text2: "Failed to share your QR code. Please try again.",
        visibilityTime: 3000,
      });
    }
  };

  const goToScanQR = () => {
    router.push("/QrCodeScreen");
  };

  const displayAmount = amount && parseFloat(amount) > 0 ? `₦${amount}` : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <>
        {/* Amount Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAmountModal}
          onRequestClose={() => setShowAmountModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* Share Preview Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={showSharePreview}
          onRequestClose={() => setShowSharePreview(false)}
        >
          <SafeAreaView style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <TouchableOpacity onPress={() => setShowSharePreview(false)}>
                <Ionicons name="arrow-back" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView
              style={styles.previewContent}
              contentContainerStyle={styles.previewContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* This is the card that will be shared */}
              <ViewShot
                ref={shareViewShotRef}
                options={{ format: "png", quality: 0.9 }}
                style={styles.shareCardContainer}
              >
                <LinearGradient
                  colors={["#0047cc", "#0066ff", "#0080ff"]}
                  style={styles.cardBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardHeader}>
                    <Image
                      source={require("../assets/icons/icon.png")}
                      style={styles.cardHeaderLogo}
                    />
                    <Text style={styles.cardTitle}>SwiftPay</Text>
                  </View>

                  <View style={styles.userInfoSection}>
                    <Text style={styles.shareUserName}>{fullName}</Text>
                    <Text style={styles.shareTag}>{swiftPayTag}</Text>
                    {displayAmount && (
                      <View style={styles.shareAmountBadge}>
                        <Text style={styles.shareAmountText}>
                          {displayAmount}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.qrCodeContainer}>
                    {userProfile ? (
                      <View style={styles.qrWrapper}>
                        <SvgQRCode
                          value={qrValue}
                          size={220}
                          backgroundColor="white"
                          color="#0033cc"
                          logo={require("../assets/icons/icon.png")}
                          logoSize={40}
                          logoBackgroundColor="white"
                          logoMargin={5}
                          logoBorderRadius={10}
                        />
                      </View>
                    ) : (
                      <ActivityIndicator size="large" color="white" />
                    )}
                  </View>

                  <Text style={styles.scanInstructions}>
                    Scan to send money instantly
                  </Text>

                  <View style={styles.cardFooter}>
                    <Image
                      source={require("../assets/icons/icon.png")}
                      style={styles.cardFooterLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardFooterText}>
                      Secure • Fast • Reliable
                    </Text>
                  </View>
                </LinearGradient>
              </ViewShot>

              <Text style={styles.previewInfo}>
                This is how your QR code will appear when shared
              </Text>
            </ScrollView>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewButton, styles.cancelPreviewButton]}
                onPress={() => setShowSharePreview(false)}
              >
                <Text style={styles.cancelPreviewButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, styles.sharePreviewButton]}
                onPress={handleShareQR}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.sharePreviewButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

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
            <Text style={styles.headerText}>Pay Via QR Code</Text>
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
                onPress={() => setShowShareOptions(true)}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons
                    name="share-social-outline"
                    size={24}
                    color={COLORS.swiftPayBlue}
                  />
                </View>
                <Text style={styles.actionText}>Share</Text>
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

          <Modal
            transparent
            animationType="slide"
            visible={showShareOptions}
            onRequestClose={() => setShowShareOptions(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowShareOptions(false)}
            >
              <View style={styles.sheetOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.sheetContainer}>
                    <View style={styles.sheetHandle} />

                    <Text style={styles.sheetTitle}>Share QR</Text>

                    <TouchableOpacity
                      style={styles.sheetOption}
                      onPress={() => {
                        setShowShareOptions(false);
                        handleShareQRCodeOnly();
                      }}
                    >
                      <Ionicons name="qr-code-outline" size={22} color="#000" />
                      <Text style={styles.sheetOptionText}>
                        Share QR Code Only
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sheetOption}
                      onPress={() => {
                        setShowShareOptions(false);
                        setShowSharePreview(true);
                      }}
                    >
                      <Ionicons name="image-outline" size={22} color="#000" />
                      <Text style={styles.sheetOptionText}>
                        Share QR with Background
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
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
    color: "#000",
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

  // Share Preview Modal styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  previewContent: {
    flex: 1,
  },
  previewContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  shareCardContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  previewInfo: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  previewButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelPreviewButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelPreviewButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  sharePreviewButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  sharePreviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Card styles
  cardBackground: {
    width: "100%",
    padding: 20,
    alignItems: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    width: "100%",
  },
  cardHeaderLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  userInfoSection: {
    alignItems: "center",
    marginVertical: 12,
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
  qrCodeContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanInstructions: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
  },
  cardFooterLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "rgba(255, 255, 255, 0.9)",
  },
  cardFooterText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  sheetOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
