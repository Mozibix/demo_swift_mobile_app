import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import SvgQRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing"; // Importing expo-sharing
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Myqrcode = () => {
  const [userName, setUserName] = useState("Adeagbo Josiah");
  const [swiftPayTag, setSwiftPayTag] = useState("@josiah123");
  const [qrValue, setQrValue] = useState(`${userName} - ${swiftPayTag}`);
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    // Fetch user name and SwiftPay tag from an API or AsyncStorage if necessary
  }, []);

  // Function to generate a new QR code
  const generateNewQRCode = () => {
    setQrValue(
      `${userName} - ${swiftPayTag} - ${Math.floor(Math.random() * 10000)}`
    );
  };

  // Function to ask for permission before generating a new QR code
  const askForPermissionToGenerate = () => {
    Alert.alert(
      "Generate New QR Code",
      "Are you sure you want to generate a new QR code? This will replace the current one.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => generateNewQRCode(),
        },
      ],
      { cancelable: true }
    );
  };

  // Function to capture QR code view and share the image
  const handleShareQR = async () => {
    if (viewShotRef.current) {
      try {
        const uri = await viewShotRef.current.capture(); // Capture the QR code view
        const shareOptions = {
          title: `${userName}'s SwiftPay QR Code`,
          url: uri, // Use the captured image URI
          message: `${userName}'s SwiftPay tag is ${swiftPayTag}. Scan this QR code to send money!`, // Include the message
        };

        await Sharing.shareAsync(uri, {
          dialogTitle: shareOptions.title,
          UTI: "public.png", // Specify the type of file
        });

        console.log("Shared successfully");
      } catch (err) {
        console.error("Error capturing or sharing:", err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
        <View style={styles.qrContainer}>
          <SvgQRCode value={qrValue} size={250} backgroundColor="white" />
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/icons/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </ViewShot>

      <TouchableOpacity
        style={styles.generateQRButton}
        onPress={askForPermissionToGenerate}
      >
        <Ionicons name="reload" size={24} color="#0000ff" />
        <Text style={styles.generateQRText}>Generate New QR Code</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Here's Your QR Code</Text>
      <Text style={styles.description}>Scan My QR Code To Pay Money</Text>

      {/* Share QR Button */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShareQR}>
        <Text style={styles.shareBtnText}>Share QR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.dismiss()}>
        <Text style={styles.backBtnText}>Back To Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Myqrcode;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 20,
    justifyContent: "center",
  },
  qrContainer: {
    position: "relative",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  logoContainer: {
    position: "absolute",
    top: "57%",
    left: "60%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  logo: {
    width: 40,
    height: 40,
  },
  shareBtn: {
    backgroundColor: "#0000ff",
    padding: 15,
    width: "90%",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 100,
  },
  backBtn: {
    backgroundColor: "#fff",
    padding: 15,
    width: "90%",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0000ff",
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  backBtnText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: "#666",
    fontSize: 16,
  },
  generateQRButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  generateQRText: {
    color: "#0000ff",
    marginLeft: 10,
    fontSize: 16,
  },
});
