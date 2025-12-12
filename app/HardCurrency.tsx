import Button from "@/components/ui/Button";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

const HardCurrency = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/payments/6.png")}
        style={styles.image}
      />
      <Text style={styles.text}>Hard Currency</Text>
      <View style={styles.listContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/currency.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Save your money in hard currency or Gold
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/2.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Earn more in your local currency once the rate of the hard currency
            you saved your money in goes higher.
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/dolls.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Money saved would be sent back to your swiftpay wallet, at that
            day's rate. If the rate is higher than what you saved, the user
            would earn more money!
          </Text>
        </View>
      </View>

      <Button
        text="Save Now"
        onPress={() => router.push("/HoldingsInvest")}
        classNames="w-full"
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

export default HardCurrency;
