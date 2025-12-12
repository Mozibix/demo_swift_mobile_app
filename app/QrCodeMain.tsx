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

interface UserProfile {
  first_name: string;
  username: string;
}

const QrCodeMain = () => {
  // fetch from UserProfile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      setUserProfile(response);
      console.log(response);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch profile"
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  console.log("User Profile:", userProfile?.username);
  const { user } = useAuth();
  const userName = userProfile?.first_name || "";
  const fullName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.username}`
    : "";
  const swiftPayTag = userProfile?.username ? `@${userProfile.username}` : "";

  const [qrValue, setQrValue] = useState(`@${user?.username}`);
  const viewShotRef = useRef<ViewShot>(null);
  const shareViewShotRef = useRef<ViewShot>(null);

  // useEffect(() => {
  //   if (swiftPayTag) {
  //     setQrValue(swiftPayTag);
  //   }
  // }, [swiftPayTag]);

  const generateNewQRCode = () => {
    setQrValue(swiftPayTag || "");
  };

  const askForPermissionToGenerate = () => {
    Alert.alert(
      "Generate New QR Code",
      "Are you sure you want to generate a new QR code? This will replace the current one.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => generateNewQRCode(),
        },
      ],
      { cancelable: true }
    );
  };

  // Function to capture QR code view and share the image
  const handleShareQR = async () => {
    if (viewShotRef.current && viewShotRef.current.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        const shareOptions = {
          title: `${userName}'s SwiftPay QR Code`,
          url: uri,
          message: `${userName}'s SwiftPay tag is ${swiftPayTag}. Scan this QR code to send money!`,
        };

        await Sharing.shareAsync(uri, {
          dialogTitle: shareOptions.title,
          UTI: "public.png",
        });

        console.log("Shared successfully");
      } catch (err) {
        console.error("Error capturing or sharing:", err);
      }
    }
  };

  const goToScanQR = () => {
    router.push("/QrCodeScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <View style={styles.shareQrContainer}>
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
          </View>

          <Text style={styles.shareTagline}>Scan to send money instantly</Text>

          <View style={styles.shareFooter}>
            <View style={styles.shareFooterDot} />
            <Text style={styles.shareFooterText}>Secure • Fast • Reliable</Text>
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
          <Text style={styles.headerText}>QR Code</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.qrSection}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: "png", quality: 0.9 }}
            >
              <View style={styles.qrContainer}>
                <SvgQRCode
                  value={qrValue}
                  size={220}
                  backgroundColor="white"
                  logo={require("../assets/icons/icon.png")}
                  logoSize={40}
                  logoBackgroundColor="white"
                  logoMargin={2}
                />
              </View>
            </ViewShot>

            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.swiftPayTag}>{swiftPayTag}</Text>
            </View>

            {/* <TouchableOpacity
              style={styles.generateQRButton}
              onPress={askForPermissionToGenerate}
            >
              <Ionicons name="reload" size={24} color={COLORS.swiftPayBlue} />
              <Text style={styles.generateQRText}>Generate New QR Code</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.actionsContainer}>
            {/* Share QR Button */}
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

            <TouchableOpacity style={styles.actionButton} onPress={goToScanQR}>
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

          <Button text="Scan to Pay" onPress={goToScanQR} classNames="w-full" />
        </View>
      </ScrollView>
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
  },
  generateQRButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
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
  mainButtonsContainer: {
    width: "100%",
    marginTop: 20,
  },
  scanButton: {
    backgroundColor: "#0047FF",
    padding: 16,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Styles for the share view
  hiddenShareView: {
    position: "absolute",
    width: 375,
    height: 667,
    opacity: 0, // Make it invisible in the UI
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
    marginBottom: 30,
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
