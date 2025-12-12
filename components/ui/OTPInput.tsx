import { View, Text, TextInput, StyleSheet } from "react-native";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";

type OTPProps = {
  otp: string[];
  setOtp: Dispatch<SetStateAction<string[]>>;
};
export default function OTPInput({ otp, setOtp }: OTPProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.otpContainer}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={styles.otpInput}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleOtpChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          secureTextEntry
        />
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    color: "#000",
    fontWeight: "700",
    backgroundColor: "#F8F9FA",
  },
});
