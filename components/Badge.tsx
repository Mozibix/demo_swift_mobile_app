import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ProgressBarAndroid,
} from "react-native";

const Badge = () => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Image
          source={require("./path/to/your/icon.png")} // Replace with your image path
          style={styles.icon}
        />
      </View>
      <Text style={styles.title}>Green Badge</Text>
      <View style={styles.transactionContainer}>
        <Text style={styles.label}>Today's Transaction</Text>
        <Text style={styles.amount}>₦500,000</Text>
      </View>
      <View style={styles.progressContainer}>
        <Text style={styles.label}>Progress to next level</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.remaining}>Remaining ₦500,000</Text>
      </View>
    </View>
  );
};

export default Badge;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: "#673AB7",
    borderRadius: 50,
    padding: 15,
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    tintColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginBottom: 15,
  },
  transactionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#7E7E7E",
  },
  amount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    height: 6,
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    marginVertical: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "50%",
    backgroundColor: "#673AB7",
  },
  remaining: {
    fontSize: 14,
    color: "#7E7E7E",
  },
});
