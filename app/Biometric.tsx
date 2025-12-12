import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";

const Biometric = () => {
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const router = useRouter();

  const checkDeviceForBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      Alert.alert(
        "Biometrics not supported",
        "Your device does not support biometrics."
      );
      return;
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType("Fingerprint");
    } else if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      setBiometricType("Face");
    }
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate with ${biometricType}`,
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      Alert.alert(
        "Authenticated",
        `${biometricType} authentication successful!`
      );
      router.push("/login");
    } else {
      Alert.alert(
        "Authentication failed",
        `Failed to authenticate using ${biometricType}.`
      );
      console.error(result.warning);
    }
  };

  React.useEffect(() => {
    checkDeviceForBiometrics();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Register Bio-Metric Function</Text>
      <Text style={styles.subtitle}>
        Please activate your {biometricType?.toLowerCase() || "biometric"}
      </Text>
      <Image
        source={require("../assets/logos/fingerprint.png")}
        style={styles.image}
      />
      <TouchableOpacity style={styles.button} onPress={handleBiometricAuth}>
        <Text style={styles.buttonText}>Activate</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "#0000ff",
    borderRadius: 30,
    alignItems: "center",
    width: "20%",
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: "30%",
  },
  subtitle: {
    fontSize: 16,
    color: "#a3a3a3",
    marginBottom: 40,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 40,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    width: "40%",
    marginTop: 50,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default Biometric;
