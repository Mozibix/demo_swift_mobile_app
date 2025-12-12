import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const NoNetworkScreen = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe(); // Unsubscribe from network updates on component unmount
    };
  }, []);

  const handleRetry = () => {
    // Manually check network status
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
      <Image source={require("../assets/images/1.png")} style={styles.image} />
      <Text style={styles.text}>Please check your internet and try again:</Text>
      <View style={styles.list}>
        <Text>• Cellular data or Wi-Fi is on</Text>
        <Text>• Your device is connected to the internet</Text>
        <Text>• Your SwiftPay App is given network access</Text>
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
    textAlign: "center",
    marginVertical: 10,
  },
  list: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#3B71F3",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default NoNetworkScreen;
