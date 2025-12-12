import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const TransferPin = () => {
  const [pin, setPin] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const router = useRouter();

  const handlePress = (value: string) => {
    if (pin.length < 4) {
      setPin(pin + value);
    }
    setPressedKey(value);
    setTimeout(() => setPressedKey(null), 150); // Reset after 150ms
  };

  const handleGoPress = () => {
    if (pin.length !== 4) {
      Toast.show({
        type: "error",
        text1: "Incomplete PIN",
        text2: "Please enter a 4-digit PIN to proceed.",
        position: "bottom",
      });
      return;
    }

    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Create Transaction Pin</Text>
      <Text style={styles.subtitle}>Please enter Pin Code</Text>
      <View style={styles.pinContainer}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinCircle,
              { backgroundColor: pin.length > index ? "#0000ff" : "#fff" },
            ]}
          />
        ))}
      </View>
      <View style={styles.numPad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.numPadButton,
              pressedKey === num && styles.numPadButtonPressed, // Apply pressed style
            ]}
            onPress={() => handlePress(num)}
          >
            <Text style={styles.numPadText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleGoPress}>
        <Text style={styles.buttonText}>Go</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
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
    gap: 15,
  },
  numPadButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
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
});

export default TransferPin;
