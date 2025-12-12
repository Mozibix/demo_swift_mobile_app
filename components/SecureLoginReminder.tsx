import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, Image } from "react-native";

const SecureLoginReminder: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✖</Text>
          </Pressable>

          {/* Icon/Illustration */}
          <Image
            source={require("../assets/piggy.png")} // Replace with your illustration URL
            style={styles.image}
          />

          {/* Title */}
          <Text style={styles.title}>Secure Login Reminder</Text>

          {/* Message */}
          <Text style={styles.message}>
            Your SwiftPay account has recently been logged in on a new device
            iPhone 14 Pro at 2024-08-12 21:12:32. Login from a non-authorized
            person may cause account fund theft. Please change your password or
            contact support to freeze your account.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.buttonOutline}
              onPress={() => alert("Reset Password")}
            >
              <Text style={styles.buttonOutlineText}>Reset Password</Text>
            </Pressable>
            <Pressable
              style={styles.buttonSolid}
              onPress={() => alert("Re-Login")}
            >
              <Text style={styles.buttonSolidText}>Re-Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    width: "85%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  closeText: {
    fontSize: 18,
    color: "red",
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  buttonOutline: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0056FF",
    marginRight: 8,
    alignItems: "center",
  },
  buttonOutlineText: {
    color: "#0056FF",
    fontWeight: "bold",
  },
  buttonSolid: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#0056FF",
    alignItems: "center",
  },
  buttonSolidText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default SecureLoginReminder;
