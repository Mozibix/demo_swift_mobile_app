import { storeUrls, WEB_URL } from "@/constants";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";
import {
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "./ui/Button";
import { useGlobals } from "@/context/GlobalContext";

export default function UpdateAppScreen({ visible }: { visible: boolean }) {
  const { isForceUpdateEnabled, setAppUpdateAvailable } = useGlobals();

  if (!visible) return null;

  function proceedToStore() {
    const storeUrl = Platform.select({
      ios: storeUrls.ios,
      default: WEB_URL,
    });

    Linking.openURL(storeUrl);
  }

  function handleLater() {
    setAppUpdateAvailable(false);
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image
              source={require("../assets/logos/swiftpaylogo.png")}
              style={{ height: 50, width: 200, position: "relative" }}
            />

            <View className="absolute right-0 top-2">
              <View className="h-[23px] w-[23px] rounded-full bg-danger items-center justify-center">
                <Text className="text-white font-bold text-[15px]">1</Text>
              </View>
            </View>
          </View>
          <Text style={styles.title}>Update Available</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            A new version of the SwiftPay app is available. Please update your
            app to get the latest features, bug fixes, security patches, and
            more.
          </Text>
        </View>

        <View className="mx-5 mb-6">
          <Button text="Proceed" onPress={proceedToStore} classNames="" />

          {!isForceUpdateEnabled && (
            <Button text="Later" softBg onPress={handleLater} />
          )}
        </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.95)",
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
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
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
