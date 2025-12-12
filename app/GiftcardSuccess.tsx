import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearProgress } from "@rneui/themed";

const GiftcardSuccess = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 0.1;
        if (newProgress >= 1) {
          clearInterval(interval); // Stop incrementing when it reaches 100%
        }
        return newProgress;
      });
    }, 100); // Increment progress every 100ms

    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Image
          source={require("../assets/icons/verified.png")}
          style={styles.icon}
        />
        <Text style={styles.title}>Transaction Submitted</Text>
        <View style={styles.progress}>
          <Text style={styles.description}>Current Trade Status:</Text>
          <LinearProgress
            style={{
              marginVertical: 10,
              height: 20,
              width: 120,
              borderRadius: 15,
            }}
            value={progress}
            variant="determinate"
            color="#4CAF50" // Progress bar color
            trackColor="#EFFFF8" // Background color
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.proceedButton}
        onPress={() => router.push("/")}
      >
        <Text style={styles.proceedButtonText}>Start New Trade</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GiftcardSuccess;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -50,
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 20,
  },
  activityIndicator: {
    marginTop: 20,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  proceedButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 20,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
