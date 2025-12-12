import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  FontAwesome6,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { formatAmount } from "@/utils";

interface CardProps {
  holdings?: any[];
  totalAssets?: number;
}

const card: React.FC<CardProps> = ({ holdings, totalAssets }) => {
  // console.log({ totalAssets });
  return (
    <View style={styles.card}>
      <Text style={styles.label}>My Balance</Text>

      <View style={styles.balance}>
        <Text style={styles.balanceText}>
          ₦{formatAmount((totalAssets as number) ?? 0)}
        </Text>
        <Text style={styles.percentage}>50%</Text>
      </View>

      {/* <Text style={styles.label}>$0.00</Text> */}

      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.items}
          onPress={() => router.push("/InvestAssetHoldings")}
        >
          <FontAwesome6 name="chart-line" color={"#000"} size={20} />
          <Text>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.items}
          onPress={() => router.push("/InvestAssetHoldings")}
          // onPress={() => router.push("/InvestAssetHoldings")}
        >
          <Feather name="play" color={"#000"} size={20} />
          <Text>Start Holdings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.items}
          onPress={() => router.push("/HoldingsHistory")}
        >
          <FontAwesome5 name="history" color={"#000"} size={20} />
          <Text>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0000ff",
    width: "100%",
    height: 180,
    borderRadius: 15,
    padding: 15,
    paddingHorizontal: 20,
    marginTop: -20,
    alignSelf: "center",
  },
  balance: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#d8d8d8",
    fontSize: 16,
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 10,
  },
  percentage: {
    color: "green",
    backgroundColor: "#fff",
    padding: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  bottomCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    padding: 10,
    paddingVertical: 20,
    borderRadius: 15,
  },
  items: {
    alignItems: "center",
  },
});
