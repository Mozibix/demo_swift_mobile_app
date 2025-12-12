import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from "react-native";
import React, { useState } from "react"; // Import useState
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const TradeSummary = () => {
  const [isChecked, setIsChecked] = useState(false);

  const toggleCheckbox = () => {
    setIsChecked(!isChecked); // Toggle checkbox state
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Sell Gift Card</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.desc}>Please read the terms carefully</Text>

        <View style={styles.paymentDetailsContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>Gift Card</Text>
            <Text style={styles.value}>
              Australia Apple/iTunes Physical (50 and above)
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>$100</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>You will be paid</Text>
            <Text style={styles.value}>N24,979.00</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Comment</Text>
            <Text style={styles.value}>None</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Reward points</Text>
            <Text style={styles.value}>0.00</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>N480</Text>
          </View>

          <Image
            source={require("../assets/icons/amazon.png")}
            style={styles.icon}
          />
          <Text style={styles.desc2}>
            Understand that the amount payable can change if you upload in the
            wrong (sub)category. To be safe please read the terms below
            properly.
          </Text>
        </View>

        <Text style={styles.tradeTerms}>Trade Terms</Text>
        <Text style={styles.desc3}>
          Please ensure you have uploaded a physical picture of your AUSTRALIA
          iTunes gift card purchased from the store. iTunes gift card codes
          start with X and are 16-digits.
        </Text>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity onPress={toggleCheckbox}>
            <View style={[styles.circle, isChecked && styles.checkedCircle]}>
              {isChecked && <AntDesign name="check" size={16} color="white" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.labels}>I have read and accepted the terms</Text>
        </View>

        <TouchableOpacity
          style={styles.proceedButton}
          onPress={() => router.push("/GiftcardSuccess")}
        >
          <Text style={styles.proceedButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TradeSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  backButton: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  placeholder: {
    width: 50, // Same width as the backButton to keep alignment
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, // Allow text to take remaining space and center
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  desc2: {
    textAlign: "left",
    color: "#333",
    fontSize: 14,
    marginBottom: 20,
  },
  desc3: {
    textAlign: "left",
    color: "#000",
    fontSize: 14,
    marginBottom: 20,
  },
  paymentDetailsContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#ececec",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
    flex: 1, // Take up equal space on the left
    textAlign: "left", // Align the text to the left
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1, // Take up equal space on the right
    textAlign: "right", // Align the text to the right
    fontWeight: "500",
  },
  icon: {
    width: 40, // Adjust size as needed
    height: 40, // Adjust size as needed
    borderRadius: 100, // Half of the width/height to make it circular
    resizeMode: "cover", // To ensure the image covers the circular area
    marginTop: 10,
    marginBottom: 10,
  },
  tradeTerms: {
    fontSize: 18,
    fontWeight: "500",
    color: "#E00000",
    borderBottomWidth: 1,
    width: 110,
    borderBottomColor: "#E00000",
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    padding: 10,
    borderRadius: 25,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12, // Circular shape
    borderWidth: 2,
    borderColor: "#888",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkedCircle: {
    backgroundColor: "#4CAF50", // Color when checked
    borderColor: "#4CAF50",
  },
  labels: {
    fontSize: 15,
    color: "#888",
  },
  proceedButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 20,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
