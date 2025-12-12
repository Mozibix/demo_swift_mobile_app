import Button from "@/components/ui/Button";
import CustomCheckbox from "@/components/ui/CustomCheckbox";
import KAScrollView from "@/components/ui/KAScrollView";
import { IS_ANDROID_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { cn, navigationWithReset } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Device from "expo-device";
import { router, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBroswer from "expo-web-browser";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const Signup: React.FC = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasAgreed, setHasAgreed] = useState(false);

  const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState<boolean | null>(
    null,
  );
  const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
  const [isValidConfirmPassword, setIsValidConfirmPassword] = useState<
    boolean | null
  >(null);
  const { displayLoader, hideLoader } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const navigation = useNavigation();
  const showToast = (message: string, type: "success" | "error" = "error") => {
    Toast.show({
      type: type,
      text1: message,
      position: "top",
      visibilityTime: 4000,
    });
  };

  const debounce = (callback: () => void, delay: number) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const timeout = setTimeout(callback, delay);
    setDebounceTimeout(timeout);
  };

  const validateFirstName = (text: string) => {
    debounce(() => {
      const isValid = text.length > 2;
      setIsValidUsername(isValid);
      // if (!isValid && text.length > 0) {
      //   showToast("Username must be more than 2 characters long.");
      // }
    }, 1000);
  };

  const validateEmail = (text: string) => {
    debounce(() => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailPattern.test(text);
      setIsValidEmail(isValid);
      // if (!isValid && text.length > 0) {
      //   showToast("Please enter a valid email address.");
      // }
    }, 1000);
  };

  const validatePhoneNumber = (text: string) => {
    debounce(() => {
      const phoneNumberPattern = /^\d{10,12}$/;
      const isValid = phoneNumberPattern.test(text);
      setIsValidPhoneNumber(isValid);
      // if (!isValid && text.length > 0) {
      //   showToast(
      //     "Please enter a valid phone number between 10 and 12 digits."
      //   );
      // }
    }, 1000);
  };

  const validatePassword = (text: string) => {
    debounce(() => {
      const hasMinLength = text.length >= 8;
      const hasUpperCase = /[A-Z]/.test(text);
      const hasLowerCase = /[a-z]/.test(text);
      const hasNumber = /\d/.test(text);
      const hasSpecialChar = /[!@#$%^&*(),.?_":{}|<>]/.test(text);

      const isValid =
        hasMinLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar;
      setIsValidPassword(isValid);

      if (!isValid && text.length > 0) {
        let message = "Password must contain:";
        if (!hasMinLength) message += "\n- At least 8 characters";
        if (!hasUpperCase) message += "\n- At least one uppercase letter";
        if (!hasLowerCase) message += "\n- At least one lowercase letter";
        if (!hasNumber) message += "\n- At least one number";
        if (!hasSpecialChar) message += "\n- At least one special character";

        // showToast(message);
      }
    }, 1000);
  };

  const validateConfirmPassword = (text: string) => {
    debounce(() => {
      const isValid = text === password;
      setIsValidConfirmPassword(isValid);
      if (!isValid && text.length > 0) {
        showToast("Confirm password must match the password.");
      }
    }, 1000);
  };

  const handleSignup = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !isValidEmail ||
      !isValidPhoneNumber ||
      !isValidPassword ||
      !isValidConfirmPassword
    ) {
      console.log("Validation failed - missing or invalid fields");
      showToast("Please ensure all fields are filled out correctly.");
      return;
    }

    if (!hasAgreed) {
      return showToast(
        "Please agree to SwiftPay's terms of service and privacy policy",
      );
    }

    setIsLoading(true);
    displayLoader();

    try {
      const response = await axios.post(
        "https://swiftpaymfb.com/api/register",
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phoneNumber,
          password: password,
          password_confirmation: confirmPassword,
          device_name: `${Device.manufacturer} ${Device.modelName} os:${Device.osVersion}`,
        },
      );

      const data = response.data;
      showToast(data.message, "success");

      console.log("Storing user data in SecureStore...");
      await SecureStore.setItemAsync("user_token", data.data.token);
      await SecureStore.setItemAsync("userToken", data.data.token);

      await SecureStore.setItemAsync("biometricEmail", email);
      await SecureStore.setItemAsync("biometricPassword", password);

      await SecureStore.setItemAsync(
        "user_data",
        JSON.stringify(data.data.user),
      );
      await AsyncStorage.setItem("UserDetails", JSON.stringify(data.data.user));
      await AsyncStorage.setItem("RegCompleted", "false");

      console.log("User data stored successfully");

      showToast("Please verify your account", "success");

      navigationWithReset(navigation, "VerifyAccount");
    } catch (error) {
      console.log("Error during signup:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.log("API error response:", error.response.data);
        if (error.response.status === 422 && error.response.data.errors) {
          Object.values(error.response.data.errors).forEach((error: any) => {
            showToast(error[0]);
          });
        } else {
          showToast(error.response.data.message || "An error occurred");
        }
      } else {
        console.log("Non-API error:", error);
        showToast("An error occurred during signup");
      }
    } finally {
      console.log("Signup process completed");
      setIsLoading(false);
      hideLoader();
    }
  };

  function handleUsernameChange(text: string): void {
    throw new Error("Function not implemented.");
  }

  const handleEmailChange = (text: string) => {
    setEmail(text);
    validateEmail(text);
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    validatePhoneNumber(text);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className={cn("mx-5", IS_ANDROID_DEVICE && "mt-14")}>
        <Image
          source={require("../assets/logos/swiftpaylogo.png")}
          className="w-[117px] h-[52px] -left-4"
        />
        <Text className="text-xl text-left mb-5 font-bold">Create Account</Text>

        <KAScrollView>
          {/* First Name Input */}
          <View className="mb-4">
            <Text className="font-medium">First Name</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mt-1">
              <TextInput
                className="flex-1 px-3 py-2.5 min-h-[48px]"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
          </View>

          {/* Last Name Input */}
          <View className="mb-4">
            <Text className="font-medium">Last Name</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mt-1">
              <TextInput
                className="flex-1 px-3 py-2.5 min-h-[48px]"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="font-medium">Email</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mt-1">
              <TextInput
                className="flex-1 px-3 py-2.5 min-h-[48px]"
                keyboardType="email-address"
                value={email}
                onChangeText={handleEmailChange}
              />
              {isValidEmail === true && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {isValidEmail === false && (
                <Ionicons name="close-circle" size={24} color="red" />
              )}
            </View>
          </View>

          {/* Phone Number Input */}
          <View className="mb-4">
            <Text className="font-medium">Enter Phone Number</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mt-1">
              <TextInput
                className="flex-1 px-3 py-2.5 min-h-[48px]"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
              />
              {isValidPhoneNumber === true && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {isValidPhoneNumber === false && (
                <Ionicons name="close-circle" size={24} color="red" />
              )}
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="font-medium">Password</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mt-1">
              <TextInput
                className="flex-1 px-3 py-2.5 min-h-[48px]"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validatePassword(text);
                }}
              />
              <TouchableOpacity
                className="-left-10"
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
              {isValidPassword === true && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {isValidPassword === false && (
                <Ionicons name="close-circle" size={24} color="red" />
              )}
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-4">
            <Text className="font-medium">Confirm Password</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mt-1">
              <TextInput
                className="flex-1 px-3 py-2.5 min-h-[48px]"
                secureTextEntry={!isPasswordVisible}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  validateConfirmPassword(text);
                }}
              />
              {isValidConfirmPassword === true && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {isValidConfirmPassword === false && (
                <Ionicons name="close-circle" size={24} color="red" />
              )}
            </View>
          </View>

          <View className="mt-4 mb-2">
            <View className="flex-row items-center justify-start gap-x-3">
              <CustomCheckbox
                value={hasAgreed}
                onValueChange={() => setHasAgreed(!hasAgreed)}
              />
              <Text className="text-gray-700 text-base max-w-[84%]">
                By signing up, you agree to our{" "}
                <Text
                  className="text-blue-600"
                  onPress={() =>
                    WebBroswer.openBrowserAsync(
                      "https://swiftpaymfb.com/terms-and-conditions",
                    )
                  }
                >
                  Terms of service
                </Text>{" "}
                and{" "}
                <Text
                  className="text-blue-600"
                  onPress={() =>
                    WebBroswer.openBrowserAsync(
                      "https://swiftpaymfb.com/privacy-policy",
                    )
                  }
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>

          <Button text="Sign up" onPress={handleSignup} />

          <View className="flex-row items-center justify-center gap-2.5 mt-3">
            <Text className="font-medium text-base">
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-base text-blue-600 font-medium">Login</Text>
            </TouchableOpacity>
          </View>
        </KAScrollView>
        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default Signup;
