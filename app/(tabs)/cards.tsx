import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBroswer from "expo-web-browser";
import { COLORS } from "@/constants/Colors";
import Button from "@/components/ui/Button";
import { showInfoToast } from "@/components/ui/Toast";

const CustomCheckbox: React.FC<{
  value: boolean;
  onValueChange: () => void;
}> = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity onPress={onValueChange} style={styles.checkboxContainer}>
      <Ionicons
        name={value ? "checkbox" : "square-outline"}
        size={24}
        color="#0000ff"
      />
    </TouchableOpacity>
  );
};

const cards = () => {
  const [isSelected, setSelection] = React.useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const _handlePressTerms = async () => {
    const url = "https://swiftpaymfb.com/terms-and-conditions";
    await WebBroswer.openBrowserAsync(url);
  };

  function handleGetCard() {
    showInfoToast({
      title: "Coming soon",
      desc: "This feature is coming soon",
    });
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Card Order</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          <Image
            source={require("../../assets/images/card.png")}
            style={styles.cardImage}
          />
        </View>

        <View style={styles.bankHeader}>
          <Image
            source={require("../../assets/icons/bolt.png")}
            style={styles.bankImage}
          />
          <View style={{ marginRight: 30 }}>
            <Text style={styles.methodTitle}>Instant Access</Text>
            <Text style={styles.methodSubtitle}>
              Instant activation once card is issued
            </Text>
          </View>
        </View>

        <View style={styles.bankHeader}>
          <Image
            source={require("../../assets/icons/safety_check.png")}
            style={styles.bankImage}
          />
          <View style={{ marginRight: 30 }}>
            <Text style={styles.methodTitle}>Easy online purchase</Text>
            <Text style={styles.methodSubtitle}>
              Accepted by both local and international merchants.
            </Text>
          </View>
        </View>

        <View style={styles.bankHeader}>
          <Image
            source={require("../../assets/icons/lock.png")}
            style={styles.bankImage}
          />
          <View style={{ marginRight: 30 }}>
            <Text style={styles.methodTitle}>Security</Text>
            <Text style={styles.methodSubtitle}>
              <Text style={styles.bold}>CBN</Text> licensed,{" "}
              <Text style={styles.bold}>NDIC</Text> issued
            </Text>
          </View>
        </View>

        <View style={styles.checkboxRow}>
          <CustomCheckbox
            value={rememberMe}
            onValueChange={() => setRememberMe(!rememberMe)}
          />
          <Text style={styles.checkboxLabel}>
            I have accepted the{" "}
            <Text style={styles.bold} onPress={_handlePressTerms}>
              Terms and Conditions
            </Text>
          </Text>
        </View>

        <Button text="Get Now" onPress={handleGetCard} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
    marginTop: 40,
  },
  cardContainer: {
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  cardImage: {
    width: "98%",
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  cardDetails: {
    alignItems: "center",
  },
  cardNumber: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  cardName: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },
  cardExpiry: {
    color: "#fff",
    fontSize: 14,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    alignSelf: "center",
  },
  label: {
    marginLeft: 10,
  },
  link: {
    color: "#0047FF",
    textDecorationLine: "underline",
  },
  getNowButton: {
    backgroundColor: COLORS.swiftPayBlue,
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  getNowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 20,
    padding: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  forgotPassword: {
    marginLeft: "auto",
    color: "red",
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    marginTop: -20,
  },
  methodItem: {
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodName: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  bankImage: {
    width: 30,
    height: 30,
    marginRight: 20,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#555",
  },
  methodSubtitle: {
    fontSize: 14,
    color: "#7D7D7D",
    maxWidth: 300,
  },
  bold: {
    color: COLORS.swiftPayBlue,
    fontWeight: "600",
  },
});

export default cards;
