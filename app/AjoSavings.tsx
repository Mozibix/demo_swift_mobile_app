import Button from "@/components/ui/Button";
import { router } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

const AjoSavings = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/payments/4.png")}
        style={styles.image}
      />
      <Text style={styles.text}>Ajo Savings</Text>
      <View style={styles.listContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/currency.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Create daily, week, Monthly & yearly Ajo Contribution
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/2.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Manage and keep track of your Ajo savings.
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/dolls.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Make swift Withdrawal and also create multiple Ajo Savings
          </Text>
        </View>
      </View>

      <Button
        text="Start Ajo Savings"
        full
        onPress={() => router.push("/StartAjoSavings")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  text: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "700",
    color: "#333",
  },
  listContainer: {
    width: "100%",
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  listItem: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
  icon: {
    width: 35,
    height: 35,
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default AjoSavings;
