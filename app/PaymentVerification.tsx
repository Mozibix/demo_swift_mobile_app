import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect } from "react";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const PaymentVerification = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/PaymentVerified"); // Replace '/verified' with your actual verified screen route
    }, 6000); // 6 seconds

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Payment Option</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Image
          source={require("../assets/icons/process.png")}
          style={styles.icon}
        />
        <Text style={styles.title}>Verifying Payment</Text>
        <Text style={styles.description}>
          Hold on while we verify your payments, once confirmed you would be
          credited with your gift card equivalent
        </Text>
        <ActivityIndicator
          size="large"
          color="#000"
          style={styles.activityIndicator}
        />
      </View>
    </View>
  );
};

export default PaymentVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  placeholder: {
    width: 50,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -50,
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 20,
  },
  activityIndicator: {
    marginTop: 20,
  },
});
