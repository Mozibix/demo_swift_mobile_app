import Button from "@/components/ui/Button";
import { showErrorToast } from "@/components/ui/Toast";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { showLogs } from "@/utils/logger";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraType,
  CameraView,
  useCameraPermissions,
  Camera,
} from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";
import SvgQRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import ViewShot from "react-native-view-shot";

interface UserProfile {
  first_name: string;
  username: string;
  name?: string; // Added name field
}

const QrCodeScreen = () => {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission, canAskAgain] = useCameraPermissions();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showMyQRCode, setShowMyQRCode] = useState(false);
  const [showScannedModal, setShowScannedModal] = useState(false);
  const [scannedTag, setScannedTag] = useState("");
  const [scannedRemarks, setScannedRemarks] = useState<string | undefined>();
  const { user } = useAuth();
  const [qrValue, setQrValue] = useState(user?.username ?? "loading...");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [scannedAmount, setScannedAmount] = useState<string | undefined>();

  const viewShotRef = useRef<ViewShot>(null);
  const shareQrCodeViewShotRef: any = useRef<ViewShot>(null);

  // Reset state when component comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset states when screen comes into focus
      setScanned(false);
      setShowScannedModal(false);
      setLoading(false);

      // Fetch user profile
      fetchUserProfile();

      return () => {
        // Cleanup when screen loses focus
        setScanned(false);
        setShowScannedModal(false);
      };
    }, [])
  );

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      setUserProfile(response);
      // showLogs("resp", response);
      if (response?.username) {
        setQrValue(`@${response.username}`);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Error",
        text2: "Failed to fetch your profile data.",
        visibilityTime: 3000,
      });
    }
  };

  // Handle selecting QR code from gallery
  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Permission needed",
          text2:
            "We need permission to access your photos to scan QR codes from images.",
          visibilityTime: 3000,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        Vibration.vibrate(100);
        // triggerHaptic()

        try {
          const imageUri = result.assets[0].uri;

          const read_result = await processImageForQRCode(imageUri);
          showLogs("read_result", read_result);
          const isValidSwiftPayTag = read_result?.startsWith("@");

          if (!read_result || !isValidSwiftPayTag) {
            setScanned(false);
            showErrorToast({
              title: "QR Code Error",
              desc: "No valid SwiftPay username detected in the QR code.",
            });
            return;
          }

          if (read_result) {
            const { tag, amount, remarks } = parseQRCode(read_result);
            const isValidSwiftPayTag = tag.startsWith("@");

            if (!isValidSwiftPayTag) {
              setScanned(false);
              showErrorToast({
                title: "QR Code Error",
                desc: "No valid SwiftPay username detected in the QR code.",
              });
              return;
            }

            setScannedTag(tag);
            setScannedRemarks(remarks);
            setScannedAmount(amount);
            setTimeout(() => {
              setScanned(false);
              setShowScannedModal(true);
            }, 200);
          } else {
            Toast.show({
              type: "error",
              position: "top",
              text1: "QR Code Error",
              text2: "No valid SwiftPay QR code detected in the image.",
              visibilityTime: 2500,
            });
            setScanned(false);
          }
        } catch (error) {
          console.error("Error processing image:", error);
          setLoading(false);
          setScanned(false);

          Toast.show({
            type: "error",
            position: "top",
            text1: "Processing Error",
            text2: "Failed to process the image. Please try again.",
            visibilityTime: 2500,
          });
        }
      }
    } catch (error) {
      setLoading(false);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Error",
        text2: "Failed to process the selected image.",
        visibilityTime: 2000,
      });
      console.log("Image picker error: ", error);
    }
  };

  const parseQRCode = (
    data: string
  ): { tag: string; amount?: string; remarks?: string } => {
    // Check if QR code contains amount (format: @username|amount)
    if (data.includes("|")) {
      const [tag, amount, remarks] = data.split("|");
      return { tag, amount, remarks };
    }
    return { tag: data };
  };

  // Update the handleBarcodeScanned function in QrCodeScreen component
  const handleBarcodeScanned = useCallback(
    (scanningResult: BarcodeScanningResult) => {
      if (scanned || showScannedModal) return;

      const { type, data } = scanningResult;

      setScanned(true);
      setLoading(true);
      Vibration.vibrate(100);

      try {
        console.log(
          `Bar code with type ${type} and data ${data} has been scanned!`
        );

        // Parse QR code data
        const { tag, amount, remarks } = parseQRCode(data);

        const isValidSwiftPayTag = tag.startsWith("@");

        setLoading(false);

        if (!isValidSwiftPayTag || tag.length <= 1) {
          setScanned(false);
          showErrorToast({
            title: "QR Code Error",
            desc: "No valid SwiftPay username detected in the QR code.",
          });
          return;
        }

        // Store both tag and amount
        setScannedTag(tag);
        setScannedAmount(amount);
        setScannedRemarks(remarks);

        setShowScannedModal(true);
      } catch (error) {
        setLoading(false);
        setScanned(false);
        showErrorToast({
          title: "Error",
          desc: "Invalid QR code format. Please try again.",
        });
      }
    },
    [scanned]
  );

  // Reset scanner
  const resetScanner = () => {
    setScanned(false);
    setShowScannedModal(false);
    setScannedTag("");
  };

  // Toggle flash mode
  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Toggle between showing my QR code and scanning mode
  const toggleMyQRCode = () => {
    setShowMyQRCode((prev) => !prev);
  };

  // Function to capture QR code view and share the image
  const handleShareQR = async () => {
    if (viewShotRef.current && viewShotRef.current.capture && userProfile) {
      try {
        setShowShareOptions(false);
        const uri = await viewShotRef.current.capture();

        const shareOptions = {
          title: `${userProfile.first_name}'s SwiftPay QR Code`,
          url: uri,
          message: `My SwiftPay tag is @${userProfile.username}. Scan this QR code to send me money instantly!`,
        };

        await Sharing.shareAsync(uri, {
          dialogTitle: shareOptions.title,
          UTI: "public.png",
          mimeType: "image/png",
        });

        console.log("Shared QR code successfully");
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
    }
  };

  const proceedToPayment = () => {
    setShowScannedModal(false);
    setTimeout(() => {
      router.push({
        pathname: "/TransferToSwiftpay",
        params: {
          tag: scannedTag,
          ...(scannedAmount && { amount: scannedAmount }),
          ...(scannedRemarks && { remarks: scannedRemarks }),
        },
      });
    }, 300);
  };

  async function processImageForQRCode(uri: string) {
    try {
      const result = await Camera.scanFromURLAsync(uri, ["qr"]);
      setLoading(false);
      return result[0].data || undefined;
    } catch (error) {
      showLogs("error reading QR image", error);
      return undefined;
    }
  }

  // Handle different permission states
  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.swiftPayBlue} />
        <Text style={{ color: "#fff", marginTop: 20 }}>
          Initializing camera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Image
          source={require("../assets/camera.svg")}
          style={{ height: 200, width: 200 }}
        />
        <Text
          style={styles.errorText}
          className="mt-5 max-w-[90%] text-[16px] leading-7"
        >
          <Text className="text-[19px]">
            Allow camera access in this next screen for:
          </Text>
          <Text className="text-[#fefefe93]">
            {"\n"} • Scanning QR codes instantly
            {"\n"} • Making transfers quick, easy, and secure
            {"\n"} • Enjoying a smoother experience overall
            {"\n\n"}
          </Text>
          You can change this option anytime later in the Settings app{" "}
          {!permission.canAskAgain &&
            "To enable this feature, please allow camera access in your device settings under SwiftPay."}
        </Text>

        <Button
          text="Continue"
          outlined
          softBg
          onPress={() => {
            if (permission.canAskAgain) {
              requestPermission();
            } else {
              Linking.openSettings();
            }
          }}
          classNames="w-[80%]"
        />
      </View>
    );
  }

  const handleShareQRCodeOnly = async () => {
    if (!shareQrCodeViewShotRef.current) return;

    try {
      const uri = await shareQrCodeViewShotRef.current.capture();

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
  // Get display name - use name if available, otherwise use first_name
  const displayName = userProfile?.name || userProfile?.first_name || "User";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan to Pay</Text>
        <View style={styles.placeholder}></View>
      </View>

      {/* QR Code display modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMyQRCode}
        onRequestClose={() => setShowMyQRCode(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My QR Code</Text>
              <TouchableOpacity onPress={() => setShowMyQRCode(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ViewShot
              ref={viewShotRef}
              options={{ format: "png", quality: 0.9 }}
              style={styles.shareableCard}
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
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userTag}>@{userProfile?.username}</Text>
                </View>

                <ViewShot
                  ref={shareQrCodeViewShotRef}
                  options={{ format: "png", quality: 0.9 }}
                >
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
                </ViewShot>

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

            {userProfile && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => setShowShareOptions(true)}
              >
                <FontAwesome name="share-alt" size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share QR Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showScannedModal}
        onRequestClose={() => setShowScannedModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code Detected</Text>
              <TouchableOpacity onPress={() => setShowScannedModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.scannedResultContainer}>
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={50}
                color={COLORS.swiftPayBlue}
                style={styles.scannedIcon}
              />
              <Text style={styles.scannedTitle}>Recipient Found</Text>
              <Text style={styles.scannedTagText}>{scannedTag}</Text>

              {scannedAmount && (
                <View style={styles.scannedAmountContainer}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={20}
                    color={COLORS.swiftPayBlue}
                  />
                  <Text style={styles.scannedAmountText}>₦{scannedAmount}</Text>
                </View>
              )}

              <Text style={styles.scannedDescription}>
                {scannedAmount
                  ? `You're about to pay ${scannedTag} the amount of ₦${scannedAmount}`
                  : `You're about to make a payment to this SwiftPay tag`}
              </Text>
            </View>

            <View style={styles.scannedActionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowScannedModal(false);
                  setScanned(false);
                  setScannedAmount(undefined);
                  setScannedRemarks(undefined);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={proceedToPayment}
              >
                <Text
                  style={styles.continueButtonText}
                  className="whitespace-nowrap"
                >
                  Continue to Payment
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!showScannedModal && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            enableTorch={flashEnabled}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.middleContainer}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.focusedContainer}>
                  <View style={[styles.scannerMarker, styles.topLeftMarker]} />
                  <View style={[styles.scannerMarker, styles.topRightMarker]} />
                  <View
                    style={[styles.scannerMarker, styles.bottomLeftMarker]}
                  />
                  <View
                    style={[styles.scannerMarker, styles.bottomRightMarker]}
                  />

                  <View style={styles.scanFocusArea}>
                    <Image
                      source={require("../assets/icons/icon.png")}
                      style={styles.logoWatermark}
                      resizeMode="contain"
                    />
                  </View>

                  {loading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator
                        size="large"
                        color={COLORS.swiftPayBlue}
                      />
                      <Text style={styles.loadingText}>
                        Processing payment...
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.unfocusedContainer}></View>
              </View>
              <View style={styles.unfocusedContainer}></View>
            </View>
          </CameraView>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Align QR code within the frame to scan
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
            <MaterialIcons
              name={flashEnabled ? "flash-on" : "flash-off"}
              size={28}
              color={COLORS.swiftPayBlue}
            />
            <Text style={styles.controlText}>Flash</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} style={styles.controlButton}>
            <MaterialIcons
              name="photo-library"
              size={28}
              color={COLORS.swiftPayBlue}
            />
            <Text style={styles.controlText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={styles.controlButton}
          >
            <MaterialIcons
              name="flip-camera-android"
              size={28}
              color={COLORS.swiftPayBlue}
            />
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMyQRCode}
            style={styles.controlButton}
          >
            <MaterialCommunityIcons
              name="qrcode"
              size={28}
              color={COLORS.swiftPayBlue}
            />
            <Text style={styles.controlText}>My QR</Text>
          </TouchableOpacity>

          {scanned && !loading && !showScannedModal && (
            <TouchableOpacity
              onPress={() => setScanned(false)}
              style={[styles.scanAgainButton, styles.controlButton]}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={28}
                color={COLORS.swiftPayBlue}
              />
              <Text style={styles.controlText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        transparent
        animationType="slide"
        visible={showShareOptions}
        onRequestClose={() => setShowShareOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowShareOptions(false)}>
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
                  <Text style={styles.sheetOptionText}>Share QR Code Only</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={handleShareQR}
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
    </SafeAreaView>
  );
};

export default QrCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#000",
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  middleContainer: {
    flexDirection: "row",
    height: 300,
  },
  focusedContainer: {
    flex: 6,
    position: "relative",
  },
  scanFocusArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWatermark: {
    width: 80,
    height: 80,
    opacity: 0.15,
  },
  scannerMarker: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: COLORS.swiftPayBlue,
    borderWidth: 3,
  },
  scannedAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 71, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  scannedAmountText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.swiftPayBlue,
    marginLeft: 8,
  },
  topLeftMarker: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightMarker: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftMarker: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightMarker: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: "#000",
  },
  instructionContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  controlButton: {
    alignItems: "center",
    padding: 8,
  },
  controlText: {
    color: "#fff",
    marginTop: 5,
  },
  scanAgainButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 40,
    padding: 15,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.swiftPayBlue,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.swiftPayBlue,
  },
  // New styles for the premium shareable card
  shareableCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
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
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  userTag: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 15,
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
  shareButton: {
    flexDirection: "row",
    backgroundColor: COLORS.swiftPayBlue,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  // Scanned QR code modal styles
  scannedResultContainer: {
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  scannedIcon: {
    marginBottom: 15,
  },
  scannedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  scannedTagText: {
    fontSize: 24,
    color: COLORS.swiftPayBlue,
    fontWeight: "bold",
    marginBottom: 12,
  },
  scannedDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  scannedActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: COLORS.swiftPayBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1.5,
    alignItems: "center",
  },
  continueButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
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
