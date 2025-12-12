import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useToast } from "react-native-toast-notifications";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { COLORS } from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import Button from "@/components/ui/Button";

const VerifyAccount = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const params = useLocalSearchParams();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev - 1;
          if (newTime === 0) {
            setCanResend(true);
            console.log("Timer finished, resend enabled");
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Refs for input fields
  const textInputs: Record<string, React.RefObject<TextInput>> = otp.reduce(
    (refs, _, index) => {
      refs[`otpInput-${index}`] = React.createRef<TextInput>();
      return refs;
    },
    {} as Record<string, React.RefObject<TextInput>>,
  );

  // Function to handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    console.log(`OTP digit ${index + 1} changed:`, value);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Automatically focus the next input
    if (value && index < otp.length) {
      const nextInput = `otpInput-${index + 1}`;
      textInputs[nextInput]?.current?.focus();
    }

    console.log(newOtp);
  };

  const resendOTP = async () => {
    if (!canResend) return;

    console.log("Attempting to resend OTP");
    setIsLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      console.log("Retrieved token:", token);

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post(
        "https://swiftpaymfb.com/api/onboarding/resend-otp",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Resend OTP response:", response.data);
      toast.show(response.data.message || "OTP resent successfully", {
        type: "success",
        placement: "top",
        duration: 4000,
      });

      setTimer(60);
      setCanResend(false);
    } catch (error: any) {
      console.error("Resend OTP error:", error.response || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to resend OTP";

      toast.show(errorMessage, {
        type: "danger",
        placement: "top",
        duration: 4000,
      });

      if (error.response?.status === 401) {
        // Handle unauthorized access
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isVerifyEnabled = otp.every((digit) => digit !== "") && !isLoading;

  const verifyOTP = async () => {
    const otpString = otp.join("");
    setError(null);

    if (!otpString || otpString.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      toast.show("Please enter a valid 6-digit OTP", {
        type: "warning",
        placement: "top",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // console.log(otpString.join(''));

      const response = await axios.post(
        "https://swiftpaymfb.com/api/onboarding/verify-otp",
        { otp_code: otpString }, // Send OTP as string instead of integer
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.data) {
        throw new Error("Invalid server response");
      }

      if (params.isResettingPin) {
        router.push("/EnterPin");
      } else {
        console.log("Verify OTP response:", response.data);
        toast.show("OTP verified successfully", {
          type: "success",
          placement: "top",
          duration: 4000,
        });
        router.push("/TransactionPinSetup");
      }
    } catch (error: any) {
      console.log(error.response.data);

      const errorMessage =
        error.response?.data?.message || error.message || "Verification failed";
      setError(errorMessage);
      console.error("Verify OTP error:", errorMessage);
      toast.show(errorMessage, {
        type: "danger",
        placement: "top",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {params.isResettingPin ? "Verify OTP" : "Verify your Account"}
        </Text>
        <Text style={styles.subtitle}>
          {params.isResettingPin
            ? "Enter the 6-digit code sent to your email to proceed to reset your pin"
            : "Enter the 6-digit code sent to your email"}
        </Text>
      </View>

      <View style={styles.otpContainer}>
        <Text style={styles.enterPinText}>Enter Verification Code</Text>
        <View style={styles.otpInputContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={`otp-${index}`}
              ref={textInputs[`otpInput-${index}`]}
              style={[
                styles.otpInput,
                { borderColor: digit ? "#0066FF" : "#E5E5E5" },
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              maxLength={1}
              keyboardType="number-pad"
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                  const prevField =
                    textInputs[`otpInput-${index - 1}`]?.current;
                  prevField?.focus();
                }
              }}
              editable={!isLoading}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={resendOTP}
        disabled={timer > 0 || isLoading}
        style={styles.resendContainer}
      >
        <Text style={[styles.resendText, timer === 0 && styles.resendActive]}>
          {timer > 0
            ? `Resend code in ${timer.toString().padStart(2, "0")}s`
            : "Resend Code"}
        </Text>
      </TouchableOpacity>

      <Button
        text="Verify & Continue"
        onPress={verifyOTP}
        disabled={!isVerifyEnabled || isLoading}
        isLoading={isLoading}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default VerifyAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  otpContainer: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  enterPinText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  otpInput: {
    width: 46,
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    backgroundColor: "#F0F7FF",
    borderColor: "#0066FF",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 24,
    padding: 8,
  },
  resendText: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "500",
  },
  resendActive: {
    color: "#0066FF",
    textDecorationLine: "underline",
  },
  verifyButton: {
    marginTop: 32,
    backgroundColor: COLORS.swiftPayBlue,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  verifyButtonDisabled: {
    backgroundColor: "#99C2FF",
    shadowOpacity: 0,
    elevation: 0,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
});
