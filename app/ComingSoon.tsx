import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Button } from "react-native-paper";
import { router } from "expo-router";

const ComingSoon = () => {
  return (
    <View style={styles.container}>
      <Image source={require("../assets/coming.png")} style={styles.image} />
      <Text style={styles.description}>
        Sorry... this feature is unavailable.
      </Text>
      <Text style={styles.description}>
        Keep watch on our next update. We'll be releasing it soon.
      </Text>
    </View>
  );
};

export default ComingSoon;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
