import { StyleSheet, Text, View } from "react-native";
import React from "react";

const card3 = () => {
  return (
    <View style={styles.card}>
      <Text>card3</Text>
    </View>
  );
};

export default card3;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0000ff",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
