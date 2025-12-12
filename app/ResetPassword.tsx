import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import axios from "axios";
const API_BASE_URL = "https://swiftpaymfb.com/api";
import * as SecureStore from "expo-secure-store";
import KAScrollView from "@/components/ui/KAScrollView";
import { cn, getErrorMessage, navigationWithReset } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";
import { showLogs } from "@/utils/logger";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const ResetPassword: React.FC = () => {
  const navigation = useNavigation();
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  // Separate visibility state for each password field
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState<any>();
  const [newPassword, setNewPassword] = useState<any>();
  const [confirmPassword, setConfirmPassword] = useState<any>();
  const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const { displayLoader, hideLoader } = useAuth();

  const debounce = (callback: () => void, delay: number) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const timeout = setTimeout(callback, delay);
    setDebounceTimeout(timeout);
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

  const HnadlePasswordChange = async () => {
    if (!isValidPassword) {
      Toast.show({
        type: "error",
        text1: "Invalid Password payload",
        text2: "Invalid email or password",
        position: "top",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password mismatch",
        text2: "New password and confirm password do not match",
        position: "top",
      });
      return;
    }

    try {
      setIsLoading(true);
      displayLoader();
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/user/change-password`,
        {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      showLogs("response", response.data);

      if (response?.data?.status === "success") {
        setPackageModalVisible(true);
        await SecureStore.deleteItemAsync("userData");
        await SecureStore.deleteItemAsync("userToken");
      }

      if (response.data.status === "error") {
        Toast.show({
          type: "error",
          text1: response.data.message,
          text2: "Failed to change pin",
          position: "top",
        });
      }
    } catch (error: any) {
      showLogs("error during login", error.response.data);
      if (axios.isAxiosError(error) && error.response) {
        const firstError = getErrorMessage(error);
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: firstError || serverMessage,
          text2: "Password change unsuccessful",
          position: "top",
        });
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className={cn(IS_ANDROID_DEVICE ? "pt-12 mx-5" : "mx-5")}>
        {/* Back Button */}
        <KAScrollView>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Image
            source={require("../assets/logos/swiftpaylogo.png")}
            style={styles.image}
          />

          {/* Header Text */}
          <Text style={styles.headerText}>Create New Password</Text>

          {/* Description */}
          <Text style={styles.descriptionText}>Create new password</Text>

          <View className="mb-4">
            <Text className="font-medium mb-1">Current password</Text>
            <View className="flex-row items-center justify-between border border-gray-300 rounded-xl mt-1 px-3">
              <TextInput
                className="flex-1 h-12"
                secureTextEntry={!currentPasswordVisible}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  validatePassword(text);
                }}
                placeholder="Enter your current password"
                placeholderTextColor="#808080"
              />
              <TouchableOpacity
                className="-ml-10"
                onPress={() =>
                  setCurrentPasswordVisible(!currentPasswordVisible)
                }
              >
                <Ionicons
                  name={
                    currentPasswordVisible ? "eye-outline" : "eye-off-outline"
                  }
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-medium mb-1">New password</Text>
            <View className="flex-row items-center justify-between border border-gray-300 rounded-xl mt-1 px-3">
              <TextInput
                className="flex-1 h-12"
                secureTextEntry={!newPasswordVisible}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  validatePassword(text);
                }}
                placeholder="Enter your new password"
                placeholderTextColor="#808080"
              />
              <TouchableOpacity
                className="-ml-10"
                onPress={() => setNewPasswordVisible(!newPasswordVisible)}
              >
                <Ionicons
                  name={newPasswordVisible ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-medium mb-1">Confirm password</Text>
            <View className="flex-row items-center justify-between border border-gray-300 rounded-xl mt-1 px-3">
              <TextInput
                className="flex-1 h-12"
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  validatePassword(text);
                }}
                placeholder="Confirm your new password"
                placeholderTextColor="#808080"
              />
              <TouchableOpacity
                className="-ml-10"
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                <Ionicons
                  name={
                    confirmPasswordVisible ? "eye-outline" : "eye-off-outline"
                  }
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            text="Save Changes"
            onPress={HnadlePasswordChange}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          />

          <Modal
            visible={packageModalVisible}
            transparent={true}
            animationType="fade"
          >
            <Pressable
              style={styles.modalOverlay}
              // onPress={() => setPackageModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <Image
                  source={require("../assets/icons/locker.png")}
                  style={styles.logo}
                />
                <Text style={styles.title}>Password changed</Text>
                <Text style={styles.subTitle}>
                  Your password has been successfully changed, Please sign in
                  again.
                </Text>
                <Button
                  text="Sign In"
                  full
                  onPress={() => {
                    setPackageModalVisible(false);
                    navigationWithReset(navigation, "login");
                  }}
                  classNames="mt-2"
                />
              </View>
            </Pressable>
          </Modal>

          <Toast />
        </KAScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    padding: 6,
    width: 45,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#000",
  },
  descriptionText: {
    fontSize: 14,
    color: "#7E7E7E",
    marginBottom: 40,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  input: {
    fontSize: 16,
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#0000FF", // Blue color for the button
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 40,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    alignSelf: "center",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  icon: {
    alignSelf: "flex-end",
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  tagBg: {
    width: 420,
    alignSelf: "center",
    top: -20,
    borderRadius: 30,
    marginBottom: 40,
    resizeMode: "cover",
    borderTopLeftRadius: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },
  subTitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#0000FF",
    padding: 15,
    borderRadius: 30,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
  },
  image: {
    width: 117,
    height: 52,
    left: -15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
    color: "#000",
  },
});
