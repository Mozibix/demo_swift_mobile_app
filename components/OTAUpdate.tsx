import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Button from "./ui/Button";
import * as Updates from "expo-updates";
import { navigationWithReset, triggerHaptic } from "@/utils";
import { showErrorToast } from "./ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigation } from "expo-router";
import { COLORS } from "@/constants/Colors";
import { useGlobals } from "@/context/GlobalContext";

export default function OTAUpdate({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const [isLoading, setIsLoading] = useState(false);
  const { setOTAUpdateAvailable } = useGlobals();
  const navigation = useNavigation();

  async function handleOTAUpdate() {
    try {
      triggerHaptic();
      setIsLoading(true);
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      navigationWithReset(navigation, "(tabs)");
    } catch (error) {
      console.log("Error fetching latest Expo update:", error);
      showErrorToast({
        title: "Error getting latest updates",
        desc: "Please try again later",
      });
    } finally {
      setOTAUpdateAvailable(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#1400FB", "#1D4ED8", "#4537e6"]}
              style={styles.iconGradient}
            >
              <Text style={styles.iconText}>↗</Text>
            </LinearGradient>
          </View>
          <Text style={styles.title}>Update Available</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.description}>
            A minor update for SwiftPay is ready to install. This update may
            include:
          </Text>

          <View style={styles.featuresList}>
            {/* <View style={styles.featureItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.featureText}>Enhanced security features</Text>
            </View> */}
            {/* <View style={styles.featureItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.featureText}>Improved performance</Text>
            </View> */}
            <View style={styles.featureItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.featureText}>
                Bug fixes and stability improvements
              </Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.featureText}>
                New user interface enhancements
              </Text>
            </View>
          </View>
        </View>

        <Button
          text="Update Now"
          onPress={handleOTAUpdate}
          isLoading={isLoading}
          loadingText="Getting updates..."
          classNames="mx-5 mb-6"
        />
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 10,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 20,
    maxWidth: width - 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },
  version: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.swiftPayBlue,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    lineHeight: 20,
  },
  sizeInfo: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  sizeText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});
