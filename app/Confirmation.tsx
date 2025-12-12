import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { getErrorMessage } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";

const Confirmation = () => {
  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [isLoading, setIsLoading] = useState(false);
  const [groupCode, setGroupCode] = useState("");
  const { displayLoader, hideLoader } = useAuth();

  const handleJoinContribution = async () => {
    try {
      if (!groupCode) {
        Toast.show({
          type: "error",
          text1: "Group Code Required",
          text2: "Please enter a valid group code",
          position: "top",
        });
        return;
      }

      setIsLoading(true);
      displayLoader();

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/ajo-contributions/join?invite_code=${groupCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        router.push({
          pathname: "/GroupDetails",
          params: {
            data: JSON.stringify(response?.data?.data),
          },
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "An error occurred",
          position: "top",
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message ||
          "An error occurred. Please check that the Group code is correct and try again";
        Toast.show({
          type: "error",
          text1: "Error",
          text2: serverMessage,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to join the Ajo contribution",
          position: "top",
        });
      }
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>CONFIRMATION</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>JOIN AJO CONTRIBUTION</Text>
        <Text style={styles.subtitle}>Enter Group Code Below To Join</Text>

        <Text style={styles.inputLabel}>ENTER AJO CONTRIBUTION GROUP CODE</Text>

        <TextInput
          style={styles.input}
          placeholder=""
          value={groupCode}
          onChangeText={setGroupCode}
        />

        {/* Join Button */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinContribution}
        >
          <Text style={styles.joinButtonText}>JOIN AJO CONTRIBUTION</Text>
        </TouchableOpacity>
      </View>
      <Toast />
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
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 40,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    marginTop: 100,
    alignItems: "center",
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#000",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#D3D3D3", // light grey background for input field
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 100,
  },
  joinButton: {
    backgroundColor: "#0C0CFF", // Blue background for the button
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    padding: 15,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Confirmation;
