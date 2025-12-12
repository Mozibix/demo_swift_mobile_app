import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import Button from "@/components/ui/Button";

const SaveWithInterest = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ marginHorizontal: 15 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Image
          source={require("../assets/interestmockup.png")}
          style={styles.mock}
        />
        <View style={styles.highlight}>
          <Text style={styles.headerTitle}>Save With Interest</Text>
          <View style={styles.row}>
            <Image
              source={require("../assets/icons/security-safe.png")}
              style={styles.icon}
            />
            <Text>Safe and Secured way to save your money</Text>
          </View>

          <View style={styles.row}>
            <Image
              source={require("../assets/icons/lock2.png")}
              style={styles.icon}
            />
            <Text>Lock your savings whenever you want</Text>
          </View>

          <View style={styles.row}>
            <Image
              source={require("../assets/icons/card-send.png")}
              style={styles.icon}
            />
            <Text>Get high interest on your savings today</Text>
          </View>

          <Button text="Next" onPress={() => router.push("/SaveNow")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SaveWithInterest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  highlight: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 24,
    width: "100%",
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
    marginBottom: 32,
    color: "#000",
  },
  mock: {
    width: "80%",
    height: 280,
    alignSelf: "center",
    resizeMode: "contain",
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 50,
    alignSelf: "flex-start",
    // marginTop: 48,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
