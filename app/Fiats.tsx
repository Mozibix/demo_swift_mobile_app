import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import React, { useState } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Fiats = () => {
  const [activeTab, setActiveTab] = useState("Fiat"); // Default tab

  // Function to render different content based on the active tab
  const renderContent = () => {
    if (activeTab === "Fiat") {
      return (
        <>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/dollar.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>USDC</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/portfolio/chart1.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    } else if (activeTab === "Metals") {
      return (
        <>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/gold.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>GOLD</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/images/line2.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/gold.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>GOLD</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/images/line2.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/gold.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>GOLD</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/images/line2.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/gold.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>GOLD</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/images/line2.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/gold.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>GOLD</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/images/line2.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push("/InvestDetails")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                source={require("../assets/icons/gold.png")}
                style={styles.icon}
              />
              <View style={styles.item}>
                <Text style={styles.title}>GOLD</Text>
                <Text style={styles.subText}>
                  $1,267.98 <AntDesign name="arrowright" /> $12,789.76
                </Text>
              </View>
            </View>
            <Image
              source={require("../assets/images/line2.png")}
              style={styles.icon}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>$2,878.98</Text>
              <Text style={styles.sub}>$1,230.78</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
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

      <View style={styles.tobbarContainer}>
        <TouchableOpacity
          style={
            activeTab === "Fiat" ? styles.activeTopBarItem : styles.topBarItem
          }
          onPress={() => setActiveTab("Fiat")}
        >
          <Text style={styles.topBarText}>Fiat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            activeTab === "Metals" ? styles.activeTopBarItem : styles.topBarItem
          }
          onPress={() => setActiveTab("Metals")}
        >
          <Text style={styles.topBarText}>Metals</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default Fiats;

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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    padding: 10,
    width: 300,
    borderRadius: 10,
  },
  topBarItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topBarText: {
    fontWeight: "700",
    fontSize: 18,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0000ff",
  },
  price: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },
  subText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  item: {},

  flexTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coin: {
    fontSize: 12,
    fontWeight: "600",
  },
  subPrice: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
  },
  percentage: {
    backgroundColor: "#ff5361",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 20,
  },
  percentage3: {
    backgroundColor: "#07f8b5",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 20,
  },
  tobbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  activeTopBarItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#0000ff",
    color: "#333",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    alignSelf: "center",
  },
  notFound: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "400",
    color: "#0000ff",
  },
  sub: {
    fontSize: 12,
    fontWeight: "500",
    color: "green",
  },
});
