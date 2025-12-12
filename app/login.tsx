import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "../context/AuthContext";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import Button from "@/components/ui/Button";
import { showLogs } from "@/utils/logger";
import { authenticateWithBiometric } from "@/hooks/useBiometrics";
import { cn } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";
import { showErrorToast } from "@/components/ui/Toast";
import axios from "axios";

const CustomCheckbox = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: () => void;
}) => (
  <TouchableOpacity onPress={onValueChange} className="p-2">
    <Ionicons
      name={value ? "checkbox" : "square-outline"}
      size={24}
      color="#0000ff"
    />
  </TouchableOpacity>
);

const Login = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
  const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [userAuth, setUserAuth] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const { login, displayLoader, hideLoader } = useAuth();

  const checkDeviceForBiometrics = async () => {
    const token = await SecureStore.getItemAsync("userToken");

    // const regCompleted = await AsyncStorage.getItem("RegCompleted");

    if (!token) return;

    setUserAuth(token);

    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return;

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
      promptMessage:
        Platform.OS === "android"
          ? "Use your device Fingerprint or Pin to continue to SwiftPay MFB"
          : "Use your device Pin/Passcode to continue to SwiftPay MFB",
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      const storedPassword =
        await SecureStore.getItemAsync("biometricPassword");

      if (storedPassword) {
        setIsValidPassword(true);
        setPassword(storedPassword);
      }

      displayLoader();
      await login(email, storedPassword as string, true);
      await AsyncStorage.setItem("hasSeenBiometricPrompt", "true");
      hideLoader();
    } else {
      Alert.alert(
        "Authentication failed",
        `${biometricType} authentication failed`,
      );
    }
  };

  const validateEmail = (text: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailPattern.test(text);
    setIsValidEmail(isValid);
  };

  const validatePassword = (text: string) => {
    const isValid = text.length >= 6;
    setIsValidPassword(isValid);
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!isValidEmail || !isValidPassword) {
      showErrorToast({
        title: "Login Failed",
        desc: "Invalid email or password",
      });

      return;
    }

    setIsLoading(true);
    animateButton();
    displayLoader();

    try {
      await login(email, password);
    } catch (error: any) {
      showLogs("main error", error);
      showLogs("error", error.response.data.message);

      showErrorToast({
        title: "Login Failed",
        desc:
          error.response?.data?.message ||
          "An error occurred. Please try again",
      });
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  React.useEffect(() => {
    async function getSecureStoreCreds() {
      const storedEmail = await SecureStore.getItemAsync("biometricEmail");
      setEmail(storedEmail || "");
      setIsValidEmail(true);
    }

    getSecureStoreCreds();
    checkDeviceForBiometrics();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className={cn("mx-5", IS_ANDROID_DEVICE && "mt-14")}>
        <Image
          source={require("../assets/logos/swiftpaylogo.png")}
          className="w-[117px] h-[52px] -ml-3 mb-6"
        />

        <Text className="text-xl text-left mb-5 font-bold">
          Hello, There! 👋
        </Text>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="font-medium mb-1">Email</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl mt-1 px-3">
            <TextInput
              className="flex-1 h-12"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              placeholder="Enter your email"
              placeholderTextColor="#808080"
            />
            {isValidEmail !== null && (
              <Ionicons
                name={isValidEmail ? "checkmark-circle" : "close-circle"}
                size={24}
                color={isValidEmail ? "green" : "red"}
                className="ml-2"
              />
            )}
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-4">
          <Text className="font-medium mb-1">Password</Text>
          <View className="flex-row items-center justify-between border border-gray-300 rounded-xl mt-1 px-3">
            <TextInput
              className="flex-1 h-12"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
              }}
              autoCapitalize="none"
              placeholder="Enter your password"
              placeholderTextColor="#808080"
            />
            <TouchableOpacity
              className="-ml-10"
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
            {isValidPassword !== null && (
              <Ionicons
                name={isValidPassword ? "checkmark-circle" : "close-circle"}
                size={24}
                color={isValidPassword ? "green" : "red"}
                className="ml-2"
              />
            )}
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View className="flex-row items-center mt-5 mb-5">
          {/* <CustomCheckbox
            value={rememberMe}
            onValueChange={() => setRememberMe(!rememberMe)}
          />
          <Text className="ml-2 mr-auto">Remember Me</Text> */}
          <View className="flex-1" />
          <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
            <Text className="text-red-500">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Button
            text="Login"
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          />
        </Animated.View>

        {/* Biometric Auth */}
        {biometricType && userAuth && (
          <TouchableOpacity
            className="items-center mt-8"
            onPress={handleBiometricAuth}
            activeOpacity={0.7}
          >
            {biometricType === "Fingerprint" ? (
              <MaterialIcons name="fingerprint" size={32} color="#0000ff" />
            ) : (
              <Image
                source={require("../assets/icons/icons8-face-id-100.png")}
                style={{ width: 32, height: 32, tintColor: "#0000ff" }}
                resizeMode="contain"
              />
            )}
            <Text className="text-blue-600 font-medium mt-2">
              Login with {biometricType}
            </Text>
          </TouchableOpacity>
        )}

        {/* Signup Link */}
        <View className="flex-row items-center justify-center gap-2 mt-8">
          <Text className="font-medium">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text className="text-blue-600 font-medium">Signup</Text>
          </TouchableOpacity>
        </View>

        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default Login;
