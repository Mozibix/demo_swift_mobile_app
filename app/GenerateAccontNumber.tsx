import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { BottomSheet } from "@rneui/themed";
import * as LocalAuthentication from "expo-local-authentication";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

const GenerateAccountNumber = () => {
  const [email, setEmail] = useState("");
  const [bvn, setBvn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  const validateBvn = (bvn: string) => {
    return bvn.length === 11 && /^\d+$/.test(bvn);
  };

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
      try {
        await SecureStore.setItemAsync("biometrics_enabled", "true");
        router.replace("/(tabs)");
      } catch (error) {
        console.error("Error saving biometrics preference:", error);
        router.replace("/(tabs)");
      }
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleSkipBiometrics = async () => {
    try {
      await SecureStore.setItemAsync("biometrics_enabled", "false");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving biometrics preference:", error);
      router.replace("/(tabs)");
    }
  };

  useEffect(() => {
    checkDeviceForBiometrics();
  }, []);

  const handleGenerateAccount = async () => {
    if (!validateBvn(bvn)) {
      setError("BVN must be exactly 11 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }
      console.log(email);

      await axios({
        url: "https://swiftpaymfb.com/api/onboarding/create-account-number",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ email, bvn }),
      });

      // First verify fingerprint
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Please verify your identity",
        fallbackLabel: "Use Passcode",
      });

      if (biometricResult.success) {
        Alert.alert("Success", `Account created successfully!`, [
          { text: "OK", onPress: () => setIsSuccessVisible(true) },
        ]);
        // router.replace("/(tabs)");
      } else {
        Alert.alert("Success", `Account created successfully!`, [
          { text: "OK", onPress: () => handleSkipBiometrics() },
        ]);
      }
    } catch (err: any) {
      console.log(err?.response?.data);

      setError(err?.response?.data?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  async function getEmail() {
    let userData = await AsyncStorage.getItem("UserDetails");

    if (userData) {
      let data = JSON.parse(userData);
      setEmail(data.email);
    }
  }

  useEffect(() => {
    getEmail();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account Number</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#f1f1f1" }]}
        value={email}
        editable={false}
      />

      <Text style={styles.label}>Your BVN</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your BVN"
        value={bvn}
        onChangeText={setBvn}
        keyboardType="numeric"
        maxLength={11}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleGenerateAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Generate Account Number</Text>
        )}
      </TouchableOpacity>

      <BottomSheet
        isVisible={isSuccessVisible}
        onBackdropPress={() => {
          setIsSuccessVisible(false);
          handleSkipBiometrics();
        }}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.successBottomSheetHeader}>
            Allow biometric login?
          </Text>
          <Text style={styles.successBottomSheetSubtext}>
            Login with biometric. It's smoother, faster and more secure. You can
            activate this later in your settings.
          </Text>
          <View style={styles.biometricContainer}>
            <Image
              source={require("../assets/icons/face.png")}
              style={styles.bioImage}
            />
            <MaterialIcons name="fingerprint" size={80} />
          </View>

          <TouchableOpacity
            style={styles.bottomSheetButton}
            onPress={handleBiometricAuth}
          >
            <Text style={styles.bottomSheetButtonText}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomSheetButton, styles.bottomSheetButton2]}
            onPress={handleSkipBiometrics}
          >
            <Text style={styles.btnText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

export default GenerateAccountNumber;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  greetingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginLeft: 15,
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    marginTop: 20,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#0000ff",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    width: "70%",
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    borderTopWidth: 1,
    borderColor: "#ddd",
    marginTop: 30,
  },
  navItem: {
    fontSize: 12,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#0000ff",
  },
  bottomSheetButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  bottomSheetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successBottomSheetSubtext: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  biometricContainer: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 20,
  },
  bottomSheetButton2: {
    backgroundColor: "#D5EBFD",
  },
  btnText: {
    color: "#0000ff",
    fontWeight: "600",
    fontSize: 16,
  },
  bioImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
});
