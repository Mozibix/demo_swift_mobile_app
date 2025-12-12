import { StyleSheet, Text, View } from "react-native";
import React from "react";

const card2 = () => {
  return (
    <View style={styles.card}>
      <Text>card1</Text>
    </View>
  );
};

export default card2;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#AAA",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
