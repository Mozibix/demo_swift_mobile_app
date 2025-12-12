import { AntDesign } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ExchangeProps = {
  navigation: {
    goBack: () => void;
  };
};

const TradingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>S2P Trading</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.CardContainer}>
        <View style={styles.optionContainer}>
          <View style={styles.textContainer}>
            <Image
              source={require("../assets/icons/btc.png")}
              style={styles.icon}
            />
            <Text style={styles.title}>Ethereum</Text>
          </View>
          <Text style={styles.title}>Closed</Text>
        </View>
        <View style={styles.assetsName}>
          <Text style={styles.price}>$ 5,356</Text>

          <Text style={styles.quantity}>Quantity 34.3466 ETH</Text>
          <Text style={styles.limit}>Limits 10,000.00 - 65,689.87 NGN</Text>
          <Text style={styles.balanceName}>SwiftPay Balance</Text>
        </View>
      </View>

      <View style={styles.CardContainer}>
        <View style={styles.optionContainer}>
          <View style={styles.textContainer}>
            <Image
              source={require("../assets/icons/ethereum.png")}
              style={styles.icon}
            />
            <Text style={styles.title}>Ethereum</Text>
          </View>
          <Text style={styles.title}>Closed</Text>
        </View>
        <View style={styles.assetsName}>
          <Text style={styles.price}>$ 5,356</Text>

          <Text style={styles.quantity}>Quantity 34.3466 ETH</Text>
          <Text style={styles.limit}>Limits 10,000.00 - 65,689.87 NGN</Text>
          <Text style={styles.balanceName}>SwiftPay Balance</Text>
        </View>
      </View>

      <View style={styles.CardContainer}>
        <View style={styles.optionContainer}>
          <View style={styles.textContainer}>
            <Image
              source={require("../assets/icons/tether.png")}
              style={styles.icon}
            />
            <Text style={styles.title}>Ethereum</Text>
          </View>
          <Text style={styles.title}>Closed</Text>
        </View>
        <View style={styles.assetsName}>
          <Text style={styles.price}>$ 5,356</Text>

          <Text style={styles.quantity}>Quantity 34.3466 ETH</Text>
          <Text style={styles.limit}>Limits 10,000.00 - 65,689.87 NGN</Text>
          <Text style={styles.balanceName}>SwiftPay Balance</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    marginBottom: 40,
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
  listContainer: {
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  textContainer: {
    flexDirection: "row",
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  CardContainer: {
    backgroundColor: "#D3EDFC",
    marginBottom: 20,
    borderRadius: 10,
  },
  assetsName: {
    paddingHorizontal: 10,
  },
  price: {
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 10,
  },
  quantity: {
    color: "#666",
    marginBottom: 5,
  },
  limit: {
    color: "#666",
    marginBottom: 5,
  },
  balanceName: {
    color: "#111",
    fontWeight: "500",
    marginBottom: 5,
  },
});

export default TradingScreen;
