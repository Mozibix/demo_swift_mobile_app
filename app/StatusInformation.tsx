import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Loader from "@/components/Loader";
import LoadingComp from "@/components/Loading";
import Toast from "react-native-toast-message";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import { IS_ANDROID_DEVICE } from "@/constants";

const StatusInformation = () => {
  const { status } = useLocalSearchParams();
  const [accountLevels, setAccountLevels] = useState<any | null>(null);
  const [Loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAccountLevels = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      const response = await axios.get(
        "https://swiftpaymfb.com/api/account-levels",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setAccountLevels(response.data.data.levels);
      }
    } catch (error) {
      console.error("Error fetching account levels:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load account levels",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountLevels();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: IS_ANDROID_DEVICE ? 0 : 15,
        }}
      >
        <LoadingComp visible={Loading} />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={20} />
          </TouchableOpacity>

          <Text style={styles.title}>Status Information</Text>
        </View>

        {/* Status Badges */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badgeCard, styles.badge]}>
            <View
              style={[
                styles.badgeHeaders,
                {
                  backgroundColor:
                    user?.level === "green" ? "#0000ff" : "#e0e0e0",
                },
              ]}
            >
              <Image
                source={require("../assets/icons/green-badge.png")}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.badgeTitle,
                  { color: user?.level === "green" ? "#fff" : "000" },
                ]}
              >
                Green Badge
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.badgeInfo}>Minimum Daily Transaction</Text>
              <View>
                <Text style={styles.badgeRange}>
                  ₦
                  {formatCurrency(
                    accountLevels ? accountLevels?.green?.min : 0
                  )}{" "}
                  - ₦
                  {formatCurrency(
                    accountLevels ? accountLevels?.green?.max : 0
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.badgeCard, styles.badge]}>
            <View
              style={[
                styles.badgeHeaders,
                {
                  backgroundColor:
                    user?.level === "blue" ? "#0000ff" : "#e0e0e0",
                },
              ]}
            >
              <Image
                source={require("../assets/icons/blue-badge.png")}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.badgeTitle,
                  { color: user?.level === "blue" ? "#fff" : "000" },
                ]}
              >
                Blue Badge
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.badgeInfo}>Minimum Daily Transaction</Text>
              <View>
                <Text style={styles.badgeRange}>
                  ₦
                  {formatCurrency(accountLevels ? accountLevels?.blue?.min : 0)}{" "}
                  -
                </Text>
                <Text style={styles.badgeRange}>
                  ₦
                  {formatCurrency(
                    accountLevels ? accountLevels?.blue?.max : 1000
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.badgeCard, styles.badge]}>
            <View
              style={[
                styles.badgeHeaders,
                {
                  backgroundColor:
                    user?.level === "black" ? "#0000ff" : "#e0e0e0",
                },
              ]}
            >
              <Image
                source={require("../assets/icons/black-badge.png")}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.badgeTitle,
                  { color: user?.level === "black" ? "#fff" : "000" },
                ]}
              >
                Black Badge
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.badgeInfo}>Minimum Daily Transaction</Text>
              <View>
                <Text style={styles.badgeRange}>
                  ₦
                  {formatCurrency(
                    accountLevels ? accountLevels?.black?.min : 0
                  )}{" "}
                  -
                </Text>
                <Text style={styles.badgeRange}>
                  ₦
                  {formatCurrency(
                    accountLevels ? accountLevels?.black?.max : 0
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.badgeCard, styles.badge]}>
            <View
              style={[
                styles.badgeHeaders,
                {
                  backgroundColor:
                    user?.level === "gold" ? "#0000ff" : "#e0e0e0",
                },
              ]}
            >
              <Image
                source={require("../assets/icons/gold-badge.png")}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.badgeTitle,
                  { color: user?.level === "gold" ? "#fff" : "000" },
                ]}
              >
                Gold Badge
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.badgeInfo}>Minimum Daily Transaction</Text>
              <View>
                <Text style={styles.badgeRange}>
                  ₦
                  {formatCurrency(accountLevels ? accountLevels?.gold?.min : 0)}
                </Text>
                <Text style={styles.badgeRange}>& Above</Text>
              </View>
            </View>
          </View>
        </View>
        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: IS_ANDROID_DEVICE ? 40 : 0,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 30,
    padding: 6,
    backgroundColor: "#eee",
    borderRadius: 100,
  },
  backText: {
    fontSize: 18,
    color: "#000",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  badgeContainer: {
    marginTop: 20,
  },
  badgeCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  badgeInfo: {
    fontSize: 14,
    color: "#000",
  },
  badgeRange: {
    fontSize: 14,
    fontWeight: "500",
  },
  greenBadge: {
    backgroundColor: "#e0e0e0",
  },
  blueBadge: {
    backgroundColor: "#d0e8ff",
  },
  blackBadge: {
    backgroundColor: "#e0e0e0",
  },
  goldBadge: {
    backgroundColor: "#ffebc4",
  },
  icon: {
    width: 15,
    height: 15,
    resizeMode: "contain",
    marginRight: 5,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  flex1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  badgeHeaders: {
    backgroundColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  badge: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
  },
});

export default StatusInformation;
