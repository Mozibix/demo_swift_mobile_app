import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  ToastAndroid,
  Image,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const ConfirmationScreen = () => {
  const [code] = useState("IWUSSKXKXN");
  const navigation = useNavigation();

  const copyToClipboard = () => {
    Clipboard.setString(code);
    ToastAndroid.show("Code copied to clipboard!", ToastAndroid.SHORT);
  };

  const handleProceedToGroup = () => {
    // Navigate to the group screen
    router.push("/GroupDetails"); // Adjust with the actual route name
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>CONFIRMATION</Text>
      </View>
      <StatusBar backgroundColor={"#f5f5f5"} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {/* Placeholder for the thumbs-up icon */}
          <Image source={require("../assets/thumb.png")} style={styles.logo} />
        </View>

        <Text style={styles.title}>AJO CONTRIBUTION CREATED</Text>
        <Text style={styles.subtitle}>
          Use The Code Below To Invite Your Friends To Join The Group
        </Text>

        <TouchableOpacity
          style={styles.codeContainer}
          onPress={copyToClipboard}
        >
          <Text style={styles.codeText}>{code}</Text>
          <View style={styles.copyIcon}>
            <Text style={styles.copyText}>📋</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>SHARE LINK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToGroup}
        >
          <Text style={styles.proceedButtonText}>PROCEED TO GROUP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#0C0CFF",
    paddingVertical: 40,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    paddingHorizontal: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#ECECEC",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    color: "#0C0CFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0C0CFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  copyIcon: {
    marginLeft: 10,
  },
  copyText: {
    fontSize: 18,
    color: "#0C0CFF",
  },
  shareButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#0C0CFF",
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  proceedButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0000ff",
  },
  proceedButtonText: {
    color: "#0000ff",
    fontWeight: "bold",
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});

export default ConfirmationScreen;
