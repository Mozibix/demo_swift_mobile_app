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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { BottomSheet } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { BackgroundImage } from "react-native-elements/dist/config";
import Toast from "react-native-toast-message";
import {
  useChangeSwiftPayTag,
  useSendOTP,
  useVerifyOTP,
} from "../hooks/useApi";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import { showLogs } from "@/utils/logger";
import { cn, getErrorMessage, navigationWithReset } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import { IS_ANDROID_DEVICE } from "@/constants";

const ChangeSwiftPayTag: React.FC = () => {
  const navigation = useNavigation();

  const { tag }: any = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [swiftPayTag, setSwiftPayTag] = useState<string>(
    tag && tag !== "null" ? tag : "",
  );
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isOtpBottomSheetVisible, setIsOtpBottomSheetVisible] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const updateTagMutation = useChangeSwiftPayTag();
  const sendOtpMutation = useSendOTP();
  const verifyOtpMutation = useVerifyOTP();
  const { getUserProfile } = useAuth();

  const handleSendOTP = async () => {
    try {
      if (!swiftPayTag) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please enter a SwiftPay Tag",
          position: "top",
          topOffset: 50,
        });
        return;
      }

      const response = await sendOtpMutation.mutateAsync();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: response.message || "OTP sent successfully to your email",
        position: "top",
        topOffset: 50,
      });
      setIsOtpBottomSheetVisible(true);
    } catch (error: any) {
      if (error.response?.status === 401) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.response.data.message || "Please log in to proceed",
          position: "top",
          topOffset: 50,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            error.response?.data?.message ||
            "Failed to send OTP. Please try again later",
          position: "top",
          topOffset: 50,
        });
      }
    }
  };

  async function updateTagApi() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/user/change-swiftpay-tag`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({ username: swiftPayTag }),
      });

      // showLogs("intigrate", intigrate.data);

      await AsyncStorage.setItem(
        "UserDetails",
        JSON.stringify(intigrate.data.data),
      );

      await AsyncStorage.setItem(
        "WalletBalance",
        JSON.stringify(intigrate.data.data.wallet_balance),
      );

      getUserProfile();

      setTimeout(() => {
        setIsSuccessVisible(true);
      }, 1000);
    } catch (error: any) {
      showLogs("error", error?.response);
      const firstErrorMessage = getErrorMessage(error);

      Toast.show({
        type: "error",
        text1: "Failed to change tag",
        text2:
          firstErrorMessage ||
          error.response?.data?.message ||
          "An error occurred",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessOkay() {
    setIsSuccessVisible(false);
    setTimeout(() => {
      navigationWithReset(navigation, "(tabs)");
    }, 300);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerClassName={cn("mx-5", IS_ANDROID_DEVICE && "mt-14")}
        showsVerticalScrollIndicator={false}
      >
        <LoadingComp visible={loading} />
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerText}>
          {tag ? "Change" : "Set"} SwiftPay Tag
        </Text>

        <Text style={styles.descriptionText}>
          Your SwiftPay Tag for receiving money from other SwiftPay users.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={swiftPayTag}
            onChangeText={setSwiftPayTag}
            placeholder="Enter new SwiftPay Tag (e.g. @username)"
            keyboardType="default"
            autoCapitalize="none"
            editable={!updateTagMutation.isPending}
          />
        </View>

        <Button
          onPress={updateTagApi}
          disabled={
            !swiftPayTag ||
            sendOtpMutation.isPending ||
            updateTagMutation.isPending
          }
          text="Save Changes"
          loadingText="Loading..."
        />

        {/* Success Bottom Sheet */}

        <Toast />
      </ScrollView>

      <BottomSheet
        isVisible={isSuccessVisible}
        onBackdropPress={() => setIsSuccessVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <ImageBackground
            source={require("../assets/icons/background.png")}
            style={styles.tagBg}
            imageStyle={styles.imageStyle}
          >
            <Image
              source={require("../assets/icons/at.png")}
              style={styles.logo}
            />
          </ImageBackground>

          <Text style={styles.successBottomSheetHeader}>
            SwiftPay Tag Updated
          </Text>
          <Text style={styles.desc}>
            Let's go! your SwiftPay tag has been changed successfully you can
            now receive money from other SwiftPay users with your SwiftPay tag.
          </Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleSuccessOkay}
          >
            <Text style={styles.nextButtonText}>Okay got it.</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    marginBottom: 20,
    backgroundColor: "#ddd",
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
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 50,
    borderColor: "#31A6D9",
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
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    top: 40,
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
    width: 400,
    alignSelf: "center",
    top: -20,
    borderRadius: 30,
    marginBottom: 40,
    resizeMode: "contain",
  },
  imageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignSelf: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  otpHeader: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  otpDescription: {
    fontSize: 14,
    color: "#7E7E7E",
    textAlign: "center",
    marginBottom: 20,
  },
  otpInputContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderColor: "#31A6D9",
    borderWidth: 1,
  },
  otpInput: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ChangeSwiftPayTag;
