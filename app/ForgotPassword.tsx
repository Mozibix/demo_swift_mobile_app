import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { router, useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useForgotPassword } from "../hooks/useApi";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import Modal from "react-native-modal";

const CustomCheckbox: React.FC<{
  value: boolean;
  onValueChange: () => void;
}> = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity onPress={onValueChange} style={styles.checkboxContainer}>
      <Ionicons
        name={value ? "checkbox" : "square-outline"}
        size={24}
        color="#0000ff"
      />
    </TouchableOpacity>
  );
};

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
  const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const forgotPassword = useForgotPassword();
  const isLoading = forgotPassword.isPending;
  const { displayLoader, hideLoader } = useAuth();

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
      router.push("/(tabs)");
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

  const validateEmail = (text: string) => {
    // Simple email validation pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailPattern.test(text);
    setIsValidEmail(isValid);

    // if (!isValid && text.length > 0) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Invalid Email",
    //     text2: "Please enter a valid email address.",
    //     position: "bottom",
    //   });
    // }
  };

  const validatePassword = (text: string) => {
    const isValid = text.length >= 6;
    setIsValidPassword(isValid);

    if (!isValid && text.length > 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Password",
        text2: "Password must be at least 6 characters long.",
        position: "bottom",
      });
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    validateEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    validatePassword(text);
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
        position: "bottom",
      });
      return;
    }

    try {
      displayLoader();
      await forgotPassword.mutateAsync(email);
      setIsModalVisible(true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          "Failed to send. Ensure this email is registered and try again",
        position: "bottom",
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../assets/logos/swiftpaylogo.png")}
        style={styles.image}
      />
      <Text style={styles.subtitle}>Forgot Password</Text>
      <Text style={styles.subtext}>
        Forgot your password? No problem. Just let us know your email address
        and we will email you a password reset link that will allow you to
        choose a new one.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Example@gmail.com"
            keyboardType="email-address"
            value={email}
            onChangeText={handleEmailChange}
          />
          {isValidEmail === true && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="green"
              style={styles.icon}
            />
          )}
          {isValidEmail === false && (
            <Ionicons
              name="close-circle"
              size={24}
              color="red"
              style={styles.icon}
            />
          )}
        </View>
      </View>

      <Button
        text="Reset Password"
        onPress={handleForgotPassword}
        disabled={isLoading}
      />

      <Modal
        animationIn="slideInUp"
        animationOut="slideOutDown"
        isVisible={isModalVisible}
        onBackdropPress={() => {
          setIsModalVisible(false);
          router.replace("/login");
        }}
      >
        <View style={styles.modalContent}>
          <Image
            source={require("../assets/images/mailbox.png")}
            style={{ height: 70, width: 120, borderRadius: 10 }}
          />

          <Text className="text-[20px] font-bold mt-5 mb-1">
            Reset link sent
          </Text>
          <Text className="text-[15px] text-gray-600 text-center">
            A password reset link has been sent to {email}
          </Text>

          <Button
            text="Login"
            onPress={() => router.replace("/login")}
            classNames="w-full"
          />
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  subtitle: {
    fontSize: 20,
    textAlign: "left",
    marginBottom: 16,
    fontWeight: "700",
  },
  subtext: {
    fontSize: 15,
    marginBottom: 20,
    fontWeight: "400",
    color: "#666",
  },
  inputContainer: {
    marginBottom: 15,
  },
  modalContent: {
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#d3d3d3",
    borderWidth: 1,
    borderRadius: 10,
    padding: 5,
    marginTop: 5,
    paddingHorizontal: 10,
    height: 50, // Added fixed height
  },
  input: {
    flex: 1,
    fontSize: 16, // Added font size
    height: 50, // Added fixed height
    paddingVertical: 12, // Added vertical padding
  },
  icon: {
    marginLeft: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  image: {
    width: 117,
    height: 52,
    left: -15,
  },
  label: {
    fontWeight: "500",
  },
  passwordinput: {
    width: "100%",
    borderColor: "#d3d3d3",
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 5,
    paddingHorizontal: 10,
    height: 50, // Added fixed height
    fontSize: 16, // Added font size
    paddingVertical: 12, // Added vertical padding
  },
  checkboxContainer: {
    marginRight: -4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    marginRight: "auto",
  },
  forgotPassword: {
    marginLeft: "auto",
    color: "red",
  },
  biometric: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  Biometricimage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 10,
  },
  biometricText: {
    fontSize: 16,
    color: "#0000ff",
    fontWeight: "500",
  },
  biometricTitle: {
    fontWeight: "500",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#6666ff", // lighter blue when disabled
    opacity: 0.7,
  },
});

export default ForgotPassword;
