import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import PinComponent from "@/components/ui/PinComponent";
import { ScrollView } from "react-native";
import { IS_ANDROID_DEVICE } from "@/constants";
import { cn } from "@/utils";

const TransactionPinSetup = () => {
  const [pin, setPin] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state
  const router = useRouter();
  const params = useLocalSearchParams();

  const handlePress = (value: string) => {
    if (pin.length < 4) {
      setPin(pin + value);
    }
    setPressedKey(value);
    setTimeout(() => setPressedKey(null), 150); // Reset after 150ms
  };

  const handleGoPress = async (pin: string) => {
    try {
      const success = true;
      if (success) {
        console.log("here routing");
        await SecureStore.setItemAsync("temp_pin", pin);
        if (params.from_home === "true") {
          router.push("/ConfirmTransactionPin?from_home=true");
        } else {
          router.push("/ConfirmTransactionPin");
        }
      } else {
        throw new Error("Failed to create PIN");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create PIN. Please try again.",
        position: "bottom",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

          <View style={{ paddingTop: 20 }}>
            <Text style={styles.title}>Create Transaction Pin</Text>
            <Text style={styles.subtitle}>Please enter Pin Code</Text>

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
                    Your transaction pin has been created successfully.
                  </Text>
                </View>
              </View>
            </Modal>

            <Toast />
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <PinComponent
            showHeading={false}
            biometricEnabled={false}
            onComplete={(pin: string) => {
              handleGoPress(pin);
            }}
            setModalState={setIsModalVisible}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionPinSetup;

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
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
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
});
