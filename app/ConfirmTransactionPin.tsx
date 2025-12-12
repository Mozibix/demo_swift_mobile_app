import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { BottomSheet } from "@rneui/themed";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import LoadingComp from "@/components/Loading";
import PinComponent from "@/components/ui/PinComponent";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { navigationWithReset } from "@/utils";
import { showLogs } from "@/utils/logger";
import axios from "axios";
import { IS_ANDROID_DEVICE } from "@/constants";
import { cn } from "@/utils";

const ConfirmTransactionPin = () => {
  const [pin, setPin] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state
  const router = useRouter();
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [Loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const handlePress = (value: string) => {
    if (pin.length < 4) {
      setPin(pin + value);
    }
    setPressedKey(value);
    setTimeout(() => setPressedKey(null), 150);
  };

  const handleGoPress = async (pin: string) => {
    setLoading(true);

    try {
      const storedPin = await SecureStore.getItemAsync("temp_pin");

      if (Number(pin) !== parseInt(storedPin ?? "0")) {
        showErrorToast({
          title: "Pin Mismatch",
          desc: "Pins do not match",
        });
        return;
      }

      const token = await SecureStore.getItemAsync("userToken");
      console.log({ token });

      await axios.post(
        "https://swiftpaymfb.com/api/onboarding/create-pin",
        { pin: parseInt(pin) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      showSuccessToast({
        title: "Success!",
        desc: "PIN setup successful!",
      });

      await SecureStore.deleteItemAsync("temp_pin");

      if (params.from_home === "true") {
        navigationWithReset(navigation, "(tabs)");
      } else {
        navigationWithReset(navigation, "CreateSwiftpayTag");
      }
      setIsModalVisible(true);
    } catch (error: any) {
      console.error(
        "Error creating PIN:",
        error.response?.data || error.message,
      );

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create PIN. Please try again.";

      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
        position: "bottom",
      });

      setPin("");
    } finally {
      // 5️⃣ End loading state
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingComp visible={Loading} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName={cn(IS_ANDROID_DEVICE && "mt-14")}
      >
        <View style={{ paddingHorizontal: 15 }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Transaction Pin</Text>
          <Text style={styles.subtitle}>Please enter Pin Again</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <PinComponent
            showHeading={false}
            biometricEnabled={false}
            onComplete={(pin: string) => {
              handleGoPress(pin);
            }}
          />
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AntDesign name="checkcircle" size={40} color="#02A53B" />
              <Text style={styles.modalText}>Congratulation!</Text>
              <Text style={styles.modalSubtext}>
                Your transaction pin has been confirmed successfully.
              </Text>
            </View>
          </View>
        </Modal>

        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConfirmTransactionPin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    backgroundColor: "#0000ff",
    borderRadius: 30,
    alignItems: "center",
    width: "20%",
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#a3a3a3",
    marginBottom: 40,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#0000ff",
  },
  numPad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 40,
    width: "100%",
    gap: 20,
  },
  numPadButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },
  numPadButtonPressed: {
    backgroundColor: "#0000ff", // Change background color when pressed
  },
  numPadText: {
    fontSize: 20,
    color: "#000",
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    width: "50%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  modalText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  modalSubtext: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
    textAlign: "center",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#0000ff",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
  },
  bottomSheetButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  bottomSheetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successBottomSheetSubtext: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  biometricContainer: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 20,
  },
  bottomSheetButton2: {
    backgroundColor: "#D5EBFD",
  },
  btnText: {
    color: "#0000ff",
    fontWeight: "600",
    fontSize: 16,
  },
  bioImiage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
});
