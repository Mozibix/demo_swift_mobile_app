import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const GroupSavings = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={22} color="#000" />
      </TouchableOpacity>
      <Image source={require("../assets/mock.png")} style={styles.mock} />
      <View style={styles.highlight}>
        <Text style={styles.headerTitle}>Group Savings</Text>
        <View style={styles.row}>
          <Image
            source={require("../assets/icons/security-safe.png")}
            style={styles.icon}
          />
          <Text className="">
            Safe and Secured way to save your {"\n"} money
          </Text>
        </View>

        <View style={styles.row}>
          <Image
            source={require("../assets/icons/lock2.png")}
            style={styles.icon}
          />
          <Text>Create a shared Savings wallet for any purpose in mind</Text>
        </View>

        <View style={styles.row}>
          <Image
            source={require("../assets/icons/card-send.png")}
            style={styles.icon}
          />
          <Text>Add members and view saving activities</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.push("/GroupDashboard")}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupSavings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  highlight: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 30,
    shadowColor: "#0000ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    alignSelf: "center",
    marginBottom: 10,
    color: "#000",
    paddingTop: 20,
  },
  mock: {
    width: "100%",
    height: 250,
    marginVertical: 20,
    alignSelf: "center",
    resizeMode: "contain",
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
