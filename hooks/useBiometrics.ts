import * as LocalAuthentication from "expo-local-authentication";
import { Alert, Linking, Platform } from "react-native";

export async function authenticateWithBiometric() {
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!isEnrolled) {
    Alert.alert(
      "Face ID/FingerPrint not enabled",
      "You have not given SwifyPay MFB permission to use Face ID/Fingerprint. You can grant access to Face ID/Fingerprint in app settings.",
      [
        {
          text: "Grant Access",
          onPress: async () => Linking.openSettings(),
        },
        {
          text: "Use Pin/Passcode",
          onPress: () => handleBiometricAuth(),
        },
      ]
    );
    return false;
  }

  return await handleBiometricAuth();
}

export async function handleBiometricAuth() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage:
      Platform.OS === "android"
        ? "Use your device Fingerprint or Pin to continue to SwiftPay MFB"
        : "Use your device Pin/Passcode to continue to SwiftPay MFB",
    fallbackLabel: "Use Pin/Passcode",
  });

  return result.success;
}
