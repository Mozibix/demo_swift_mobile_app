import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { router } from "expo-router";

const ScrollCards = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card1}>
        <Text style={styles.text}>Account Balance</Text>
      </View>
      <View style={styles.card1}>
        <Text style={styles.text}>Account Balance</Text>
      </View>
      <View style={styles.card1}>
        <Text style={styles.text}>Account Balance</Text>
      </View>
      <TouchableOpacity onPress={() => router.back()}>
        <Text>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ScrollCards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    flexDirection: "column",
  },
  card1: {
    backgroundColor: "#0000ff",
    padding: 10,
    width: 330,
    alignItems: "center",
    height: 200,
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "center",
    borderRadius: 30,
  },
  text: {
    color: "#fff",
  },
});
