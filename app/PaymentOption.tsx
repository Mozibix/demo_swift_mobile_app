import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PaymentOption: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Payment Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push("/CreditCard")}
        >
          <View style={styles.optionContent}>
            <Image
              source={require("../assets/cards/card.png")}
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>With Credit/ Debit Card</Text>
          </View>
          <AntDesign name="right" size={18} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push("/")}
        >
          <View style={styles.optionContent}>
            <Image
              source={require("../assets/cards/bank.png")}
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Bank Transfer</Text>
          </View>
          <AntDesign name="right" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 40,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 50,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default PaymentOption;
