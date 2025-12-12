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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { cn } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";

const TwoFactorAuthentication: React.FC = () => {
  const navigation = useNavigation();
  const [packageModalVisible, setPackageModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View className={cn("mx-5", IS_ANDROID_DEVICE && "mt-12")}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Header Text */}
        <Text style={styles.headerText}>Two Factor Authentication</Text>

        {/* Description */}
        <Text style={styles.descriptionText}>
          This ensures your account is protected from cyber attack, and
          malicious attacks
        </Text>

        {/* Input for SwiftPay Tag */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="default"
          />
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.text}>Email Address</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>
          Enter your email to receive authorization code
        </Text>
        <Text style={styles.label2}>Email</Text>
        <View style={styles.inputContainer2}>
          <TextInput
            style={styles.input2}
            placeholder="name@example.com"
            keyboardType="default"
          />
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => router.push("/AuthVerification")}
        >
          <Ionicons name="send" size={20} color={"#fff"} />
          <Text style={styles.saveButtonText}>Send Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TwoFactorAuthentication;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    marginBottom: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    padding: 10,
    width: 45,
    left: -10,
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
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
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
    marginBottom: 20,
  },
  subTitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#0000FF",
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  btnText: {
    color: "#fff",
  },
  btn: {
    backgroundColor: "#0000ff",
    padding: 10,
    width: 115,
    alignItems: "center",
    borderRadius: 15,
  },
  text: {
    color: "#fff",
  },
  label: {
    color: "#666",
    marginBottom: 20,
  },
  inputContainer2: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input2: {
    fontSize: 16,
    color: "#000",
  },
  label2: {
    color: "#000",
    fontWeight: "500",
  },
});
