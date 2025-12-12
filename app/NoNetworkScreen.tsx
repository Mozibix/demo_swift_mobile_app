import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNavigation } from "@react-navigation/native";

const NoNetworkScreen = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const navigation = useNavigation();

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      if (state.isConnected) {
        navigation.goBack(); // Or navigation.navigate('Home')
      }
    });

    return () => {
      unsubscribe(); // Unsubscribe from network updates on component unmount
    };
  }, []);

  const handleRetry = () => {
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
    });
  };

  // If the app is connected to the network, don't display the screen
  if (isConnected) {
    return null;
  }

  // Display the no network connection screen when there's no internet
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/mock.png")}
        style={styles.image}
      />
      <Text style={styles.text}>Please check your internet and try again:</Text>
      <View style={styles.list}>
        <Text style={styles.listText}>• Cellular data or Wi-Fi is on</Text>
        <Text style={styles.listText}>
          • Your device is connected to the internet
        </Text>
        <Text style={styles.listText}>
          • Your SwiftPay App is given network access
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  text: {
    fontSize: 16,
    textAlign: "left",
    marginVertical: 10,
    fontWeight: "500",
    color: "#666",
  },
  list: {
    marginVertical: 10,
    textAlign: "left",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#3B71F3",
    padding: 15,
    borderRadius: 30,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  listText: {
    textAlign: "left",
    marginBottom: 10,
    color: "#666",
  },
});

export default NoNetworkScreen;
