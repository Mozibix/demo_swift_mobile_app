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
import Toast from "react-native-toast-message";
import KAScrollView from "@/components/ui/KAScrollView";
import { _TSFixMe, cn } from "@/utils";
import { IS_ANDROID_DEVICE } from "@/constants";
import { apiService } from "@/services/api";
import { showErrorToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";

const ChangePin: React.FC = () => {
  const navigation = useNavigation();
  const [currentPin, setCurrentPin] = useState<any>("");
  const [error, setError] = useState("");
  const { displayLoader, hideLoader, verifyPin } = useAuth();

  const HandlePinChange = async () => {
    if (currentPin.length < 4) {
      return showErrorToast({
        title: "Enter Valid Pin",
        desc: "Pin must be at least 4 characters long",
      });
    }

    displayLoader();
    const isValid = await verifyPin(currentPin);
    if (!isValid) {
      showErrorToast({
        title: "Invalid PIN",
        desc: "Please ensure your PIN is correct",
      });
      hideLoader();
      return;
    }

    hideLoader();
    router.push({
      pathname: "/EnterPin",
      params: {
        formdata: currentPin ? JSON.stringify(currentPin) : null,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View className={cn("mx-5", IS_ANDROID_DEVICE && "mt-12")}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Header Text */}
        <Text style={styles.headerText}>Change Pin</Text>

        {/* Description */}
        <Text style={styles.descriptionText}>
          Enter password to confirm pin change
        </Text>

        {/* Input for SwiftPay Tag */}
        <Text style={{ fontWeight: "500", fontSize: 16, marginBottom: 5 }}>
          Current Pin
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Current Pin"
          secureTextEntry={true}
          keyboardType="numeric"
          maxLength={4}
          value={currentPin}
          onChangeText={(text) => {
            setCurrentPin(text);
            if (error)
              Toast.show({
                type: "error",
                text1: "An error occured",
                text2: "Opps try again",
                position: "top",
              });
          }}
        />

        <Button
          text="Continue"
          disabled={!currentPin}
          onPress={HandlePinChange}
        />
        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default ChangePin;

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
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#0000FF",
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
});
