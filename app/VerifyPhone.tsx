import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { router } from "expo-router";

const VerifyPhone: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState<boolean | null>(
    null
  );

  const validatePhoneNumber = (text: string) => {
    const phoneNumberPattern = /^234\d{10}$/; // Pattern for "234" followed by exactly 10 digits
    const isValid = phoneNumberPattern.test(text);
    setIsValidPhoneNumber(isValid);

    if (!isValid && text.length > 0) {
      // Show toast if the input is not valid
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2:
          "Please enter a valid phone number starting with 234 followed by 10 digits.",
        position: "bottom",
      });
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    validatePhoneNumber(text);
  };

  const handleNextPress = () => {
    if (phoneNumber.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Empty Phone Number",
        text2: "Please enter your phone number before proceeding.",
        position: "bottom",
      });
      return;
    }

    if (isValidPhoneNumber) {
      router.replace("./OtpVerificationScreen");
    } else {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid phone number before proceeding.",
        position: "bottom",
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back-outline" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Phone Number</Text>
      <Text style={styles.subtitle}>Please Add your mobile number</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="2341234567890"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
          />
          {isValidPhoneNumber === true && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="green"
              style={styles.icon}
            />
          )}
          {isValidPhoneNumber === false && (
            <Ionicons
              name="close-circle"
              size={24}
              color="red"
              style={styles.icon}
            />
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNextPress}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      {/* Add Toast Component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  backButton: {
    marginBottom: 20,
    backgroundColor: "#eee",
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 100,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
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
  },
  input: {
    flex: 1,
  },
  icon: {
    marginLeft: 10,
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
  label: {
    fontWeight: "500",
  },
});

export default VerifyPhone;
