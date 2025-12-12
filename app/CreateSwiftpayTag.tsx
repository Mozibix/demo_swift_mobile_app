import KAScrollView from "@/components/ui/KAScrollView";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { IS_ANDROID_DEVICE, IS_IOS_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { navigationWithReset } from "@/utils";
import { showLogs } from "@/utils/logger";
import { BottomSheet } from "@rneui/themed";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useChangeSwiftPayTag,
  useSendOTP,
  useVerifyOTP,
} from "../hooks/useApi";

const CreateSwiftPayTag: React.FC = () => {
  const navigation = useNavigation();
  const [swiftPayTag, setSwiftPayTag] = useState<string>("");
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isOtpBottomSheetVisible, setIsOtpBottomSheetVisible] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const updateTagMutation = useChangeSwiftPayTag();
  const sendOtpMutation = useSendOTP();
  const verifyOtpMutation = useVerifyOTP();
  const { displayLoader, hideLoader } = useAuth();

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
      console.log(response);
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

  const handleChageTag = async () => {
    if (!swiftPayTag) {
      return showErrorToast({
        title: "Error",
        desc: "Please enter a SwiftPay Tag",
      });
    }

    try {
      displayLoader();
      const username = swiftPayTag.startsWith("@")
        ? swiftPayTag.slice(1)
        : swiftPayTag;
      const tagResponse = await updateTagMutation.mutateAsync(username);
      showLogs("tagResponse", tagResponse);
      setIsSuccessVisible(true);
      // showSuccessToast({
      //   title: "Successful!",
      //   desc: tagResponse.message || "SwiftPay Tag created successfully",
      // });
    } catch (error: any) {
      showLogs("error", error.response.data.message);
      if (error.response?.status === 400) {
        showErrorToast({
          title: "Error",
          desc:
            error.response?.data?.message ||
            "Something went wrong, please try again",
        });
      } else if (error.response?.status === 422) {
        const errorMessage =
          error.response.data.errors?.otp?.[0] ||
          error.response.data.errors?.username?.[0] ||
          error.response.data.message ||
          "Validation failed. Please check your input";
        showErrorToast({
          title: "Error",
          desc: errorMessage,
        });
      } else {
        showErrorToast({
          title: "Error",
          desc:
            error.response?.data?.message ||
            "Something went wrong, please try again",
        });
      }
    } finally {
      hideLoader();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <KAScrollView styles={{ marginHorizontal: IS_IOS_DEVICE ? 15 : 5 }}>
        <Text style={styles.headerText}>Create SwiftPay Tag</Text>

        <Text style={styles.descriptionText}>
          Your SwiftPay Tag is your unique tag for receiving money from other
          SwiftPay users.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={swiftPayTag}
            onChangeText={setSwiftPayTag}
            placeholder="Enter SwiftPay Tag (e.g. @username)"
            keyboardType="default"
            autoCapitalize="none"
            editable={!updateTagMutation.isPending}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (sendOtpMutation.isPending || updateTagMutation.isPending) &&
              styles.disabledButton,
          ]}
          // onPress={handleSendOTP}
          onPress={handleChageTag}
          disabled={updateTagMutation.isPending}
        >
          {sendOtpMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Create Tag</Text>
          )}
        </TouchableOpacity>

        <BottomSheet
          isVisible={isOtpBottomSheetVisible}
          onBackdropPress={() =>
            !isVerifyingOtp && setIsOtpBottomSheetVisible(false)
          }
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.otpHeader}>Enter OTP</Text>
            <Text style={styles.otpDescription}>
              Please enter the OTP sent to your email to verify your identity.
            </Text>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isVerifyingOtp}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                isVerifyingOtp && styles.disabledButton,
              ]}
              onPress={handleChageTag}
            >
              {isVerifyingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Success Bottom Sheet */}
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
              SwiftPay Tag Created
            </Text>
            <Text style={styles.desc}>
              Let's go! your SwiftPay tag has been created successfully you can
              now receive money from other SwiftPay users with your SwiftPay
              tag.
            </Text>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => navigationWithReset(navigation, "(tabs)")}
            >
              <Text style={styles.nextButtonText}>Okay got it.</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
        <Toast />
      </KAScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: IS_ANDROID_DEVICE ? 40 : 0,
    marginLeft: IS_ANDROID_DEVICE ? 0 : 10,
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

export default CreateSwiftPayTag;
