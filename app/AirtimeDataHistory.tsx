import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { AntDesign, Feather, Ionicons, Octicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const AirtimeDataHistory = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>AirtimeDataHistory</Text>
    </SafeAreaView>
  );
};

export default AirtimeDataHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
});
