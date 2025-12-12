import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import React from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const StartHoldings = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput placeholder="Search asset" style={styles.input} />
        <Ionicons name="search" size={20} />
      </View>
      <View style={styles.container}>
        <Pressable style={styles.itemContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/icons/bitcoin.png")}
              style={styles.icon}
            />
            <View style={styles.item}>
              <Text style={styles.title}>BTC</Text>
              <Text style={styles.subText}>
                $1,267.98 <AntDesign name="arrowright" /> $12,789.76
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>$2,878.98</Text>
            <Text>$1,230.78</Text>
          </View>
        </Pressable>

        <Pressable style={styles.itemContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/icons/litecoin.png")}
              style={styles.icon}
            />
            <View style={styles.item}>
              <Text style={styles.title}>LiteCoin</Text>
              <Text style={styles.subText}>
                $1,267.98 <AntDesign name="arrowright" /> $12,789.76
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>$2,878.98</Text>
            <Text>$1,230.78</Text>
          </View>
        </Pressable>

        <Pressable style={styles.itemContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/icons/enjin.png")}
              style={styles.icon}
            />
            <View style={styles.item}>
              <Text style={styles.title}>Enjin</Text>
              <Text style={styles.subText}>
                $1,267.98 <AntDesign name="arrowright" /> $12,789.76
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>$2,878.98</Text>
            <Text>$1,230.78</Text>
          </View>
        </Pressable>

        <Pressable style={styles.itemContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/icons/gold.png")}
              style={styles.icon}
            />
            <View style={styles.item}>
              <Text style={styles.title}>Gold</Text>
              <Text style={styles.subText}>
                $1,267.98 <AntDesign name="arrowright" /> $12,789.76
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>$2,878.98</Text>
            <Text>$1,230.78</Text>
          </View>
        </Pressable>

        <Pressable style={styles.itemContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/icons/silver.png")}
              style={styles.icon}
            />
            <View style={styles.item}>
              <Text style={styles.title}>Silver</Text>
              <Text style={styles.subText}>
                $1,267.98 <AntDesign name="arrowright" /> $12,789.76
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>$2,878.98</Text>
            <Text>$1,230.78</Text>
          </View>
        </Pressable>

        <Pressable style={styles.itemContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/icons/bitcoin.png")}
              style={styles.icon}
            />
            <View style={styles.item}>
              <Text style={styles.title}>BTC</Text>
              <Text style={styles.subText}>
                $1,267.98 <AntDesign name="arrowright" /> $12,789.76
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>$2,878.98</Text>
            <Text>$1,230.78</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default StartHoldings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 15,
    borderRadius: 100,
    top: 40,
    marginBottom: 60,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 40,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    padding: 10,
    width: 300,
    borderRadius: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  item: {},
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subText: {
    color: "#666",
  },
  price: {
    color: "green",
    fontSize: 18,
    fontWeight: "700",
  },
});
