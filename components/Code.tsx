import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import { Icon } from "react-native-elements";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Code = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    // Set OTP value at the current index
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to the next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      // Move to the previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Header Text */}
      <Text style={styles.headerText}>Enter Code</Text>

      {/* Description */}
      <Text style={styles.descriptionText}>
        We sent a code to example@gmail.com
      </Text>
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
            autoFocus={index === 0} // Auto-focus the first input
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => router.push("/ResetPassword")}
      >
        <Text style={styles.saveButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Code;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  otpContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 35,
    alignSelf: "center",
  },
  otpInput: {
    width: 65,
    height: 65,
    borderWidth: 1,
    borderColor: "#999", // Success green color for the border
    borderRadius: 15,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
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
  backButton: {
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    padding: 10,
    width: 45,
    left: -15,
  },
  saveButton: {
    backgroundColor: "#0000FF", // Blue color for the button
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
  },
});
