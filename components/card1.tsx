import { StyleSheet, Text, View } from "react-native";
import React from "react";

const card1 = () => {
  return (
    <View style={styles.card}>
      <Text>card1</Text>
    </View>
  );
};

export default card1;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0000ff",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
