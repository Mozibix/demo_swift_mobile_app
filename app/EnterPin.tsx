import Button from "@/components/ui/Button";
import { IS_ANDROID_DEVICE } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { cn, navigationWithReset } from "@/utils";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";

const EnterPin: React.FC = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { formdata } = params;
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [newPin, setNewPin] = useState<any>();
  const [confirmPin, setConfirmPin] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const { displayLoader, hideLoader } = useAuth();
  const API_BASE_URL = "https://swiftpaymfb.com/api";

  const ConfirmPinChange = async () => {
    if (!newPin || !confirmPin) {
      Toast.show({
        type: "error",
        text1: "Enter Valid Pin",
        text2: "Pin cannot be empty",
        position: "top",
      });
      return;
    }

    if (newPin.length < 4 || confirmPin.length < 4) {
      Toast.show({
        type: "error",
        text1: "Enter Valid Pin",
        text2: "Pin must be at least 4 characters long",
        position: "top",
      });
      return;
    }

    if (newPin !== confirmPin) {
      Toast.show({
        type: "error",
        text1: "Enter Valid Pin",
        text2: "Pins do not match",
        position: "top",
      });
      return;
    }

    const currentPin =
      typeof formdata === "string" ? JSON.parse(formdata) : formdata;

    try {
      setIsLoading(true);
      displayLoader();
      const token = await SecureStore.getItemAsync("userToken");

      const response = await axios.post(
        `${API_BASE_URL}/user/change-transaction-pin`,
        {
          new_pin: newPin,
          confirm_pin: confirmPin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status === "success") {
        setPackageModalVisible(true);
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
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";

        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "Pin change unsuccessful",
          position: "top",
        });
      }
      const serverMessage =
        error.response?.data?.message || "An error occurred";
      console.error("Error: ", serverMessage);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  function closeModal() {
    setPackageModalVisible(false);
    navigationWithReset(navigation, "(tabs)");
  }

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
        <Text style={styles.headerText}>Reset Pin</Text>

        {/* Description */}
        <Text style={styles.descriptionText}>Enter new pin</Text>

        <Text style={{ fontWeight: "500", fontSize: 16, marginBottom: 5 }}>
          Enter New Pin
        </Text>

        <TextInput
          style={styles.input}
          placeholder="New Pin"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={newPin}
          onChange={(e) => setNewPin(e.nativeEvent.text)}
        />

        <Text style={{ fontWeight: "500", fontSize: 16, marginBottom: 5 }}>
          Confirm New Pin
        </Text>

        <TextInput
          secureTextEntry
          style={styles.input}
          placeholder="Confirm Pin"
          keyboardType="numeric"
          maxLength={4}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.nativeEvent.text)}
        />

        <Button
          text="Confirm"
          disabled={!newPin || !confirmPin}
          onPress={ConfirmPinChange}
        />

        <Modal
          visible={packageModalVisible}
          onRequestClose={closeModal}
          onDismiss={closeModal}
          transparent={true}
          animationType="fade"
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPackageModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <Image
                source={require("../assets/icons/locker.png")}
                style={styles.logo}
              />
              <Text style={styles.title} className="mt-2">
                Pin Changed
              </Text>
              <Text style={styles.subTitle}>
                Your pin has been successfully changed, don't forget this next
                time you log in.
              </Text>

              <Button text="Close" onPress={closeModal} full />
            </View>
          </Pressable>
        </Modal>
        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default EnterPin;

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
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 10,
  },
  subTitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
    fontSize: 15,
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
