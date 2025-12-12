import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
const API_BASE_URL = "https://swiftpaymfb.com/visit-live-chat?user_hash_id=";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const CustomerCare = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  let userHashId: any;

  React.useEffect(() => {
    const GEtUserDetails = async () => {
      try {
        const UserDetails = await AsyncStorage.getItem("UserDetails");
        const parsedUserDetails = UserDetails ? JSON.parse(UserDetails) : null;
        userHashId = parsedUserDetails?.hash_id;
        console.log(userHashId);
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: error,
          text2: "Please login again",
          position: "top",
        });
      }
    };
    GEtUserDetails();
    if (userHashId) {
      handleSupport();
    }
  }, []);

  const handleSupport = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync("userToken");

      const response = await axios.post(`${API_BASE_URL}${userHashId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: serverMessage,
          text2: "Failed to fetch contribution details",
          position: "top",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Care Support</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logos/swiftpaylogo.png")}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>SwiftPay Bot</Text>

      <View style={styles.parentContainer}>
        <TouchableOpacity style={styles.activeButton}>
          <Text style={styles.activeButtonText}>SwiftPay Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.Button}>
          <Text>Ajo Contribution</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.Button}>
          <Text>Unfreeze Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.Button}>
          <Text>Error sending to SwiftPay Account</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.Button}>
            <Text>Ajo Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.Button}>
            <Text>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.Button}>
          <Text>How to make multiple transfers</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
};

export default CustomerCare;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 80,
    color: "#000",
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    alignSelf: "center",
  },
  logoContainer: {
    borderWidth: 1,
    width: 100,
    height: 100,
    alignSelf: "center",
    borderRadius: 100,
    borderColor: "#cde5f3",
    marginBottom: 20,
  },
  title: {
    alignSelf: "center",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 50,
  },
  parentContainer: {
    alignItems: "flex-end",
  },
  activeButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  activeButtonText: {
    color: "#fff",
  },
  Button: {
    backgroundColor: "#E3EAEE",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
