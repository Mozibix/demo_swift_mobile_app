import { _TSFixMe, triggerHaptic, triggErrrorHaptic } from "@/utils";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { showErrorToast } from "./Toast";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";

interface Props {
  onComplete: (pin: string) => void;
  showHeading?: boolean;
  biometricEnabled?: boolean;
  contStyles?: ViewStyle;
  setModalState?: Dispatch<SetStateAction<boolean>>;
}

export default function PinComponent({
  onComplete,
  showHeading = true,
  biometricEnabled = true,
  contStyles,
  setModalState,
}: Props) {
  const [localPin, setLocalPin] = useState("");
  const router = useRouter();

  const handlePress = (value: string) => {
    const newPin = localPin + value;
    if (newPin.length <= 4) {
      setLocalPin(newPin);
      if (newPin.length === 4 && onComplete) onComplete(newPin);
    }
  };

  const handleBackspace = () => {
    const newPin = localPin.slice(0, -1);
    setLocalPin(newPin);
  };

  async function handleBiometricAuthentication() {
    triggerHaptic();
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        showErrorToast({
          title: "Biometric Authentication",
          desc: "Biometric authentication is not available on this device.",
        });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to complete payment",
        fallbackLabel: "Enter PIN",
      });

      if (result.success) {
        triggerHaptic();
        onComplete("xxxx");
      } else {
        showErrorToast({
          title: "Failed",
          desc: "Biometric authentication failed. Please try again.",
        });
      }
    } catch (error) {
      triggErrrorHaptic();
      console.error("Biometric authentication error:", error);
      showErrorToast({
        title: "Error",
        desc: "An error occurred during biometric authentication.",
      });
    }
  }

  return (
    <View style={[styles.container, contStyles]}>
      <View style={{ padding: 10 }}>
        {showHeading && <Text style={styles.title}>Enter your PIN</Text>}

        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.pinBox,
                i === localPin.length && localPin.length < 4
                  ? styles.activePinBox
                  : null,
              ]}
            >
              <Text style={styles.pinText}>
                {localPin.length > i ? "●" : ""}
              </Text>
            </View>
          ))}
        </View>

        {showHeading && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => {
              setModalState?.(false);
              setTimeout(() => router.push("/ChangePin"), 300);
            }}
          >
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.keypadWrapper}>
        <View style={styles.verified}>
          <MaterialIcons name="verified-user" size={18} color="#1400FB" />
          <Text style={styles.keypadLabel}>SwiftPay Secure Numeric Keypad</Text>
        </View>

        <View style={styles.keypad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <Pressable
              key={num}
              style={styles.key}
              onPress={() => handlePress(num)}
            >
              <Text style={styles.keyText}>{num}</Text>
            </Pressable>
          ))}

          <Pressable style={styles.key} onPress={handleBiometricAuthentication}>
            <Ionicons name="finger-print-outline" size={24} color="#000" />
          </Pressable>
          <Pressable style={styles.key} onPress={() => handlePress("0")}>
            <Text style={styles.keyText}>0</Text>
          </Pressable>
          <Pressable style={styles.key} onPress={handleBackspace}>
            <Ionicons name="backspace" size={30} color="#222" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    height: 520,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    color: "#000",
    textAlign: "center",
    marginTop: 10,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginBottom: 10,
  },
  pinBox: {
    width: 50,
    height: 50,
    borderWidth: 1.5,
    borderColor: "#f2f2f2",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activePinBox: {
    borderColor: "#1400FB",
  },
  pinText: {
    fontSize: 20,
    color: "#000",
  },
  forgotText: {
    color: "#1400FB",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  keypadWrapper: {
    backgroundColor: "#f2f2f2",
    paddingVertical: 16,
    paddingHorizontal: 10,
    width: "100%",
    alignItems: "center",
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  keypadLabel: {
    fontSize: 14,
    color: "#555",
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    justifyContent: "space-between",
  },
  key: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  keyText: {
    fontSize: 20,
    color: "#000",
  },
});
