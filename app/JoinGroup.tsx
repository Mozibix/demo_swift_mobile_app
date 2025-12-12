import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Keyboard,
  SafeAreaView,
} from "react-native";
import LoadingComp from "@/components/Loading";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Toast from "react-native-toast-message";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import Button from "@/components/ui/Button";
import { infoToast, showErrorToast } from "@/components/ui/Toast";
import { AntDesign } from "@expo/vector-icons";
import { IS_ANDROID_DEVICE } from "@/constants";

const JoinGroup = () => {
  const [groupCode, setGroupCode] = useState("");
  const [Loading, setLoading] = useState(false);
  const { displayLoader, hideLoader, user } = useAuth();

  async function handleGroupInvitation() {
    try {
      displayLoader();
      const response = await apiService.groupSavingsInvite(groupCode);
      const group_members = response.data.group_savings.members;
      const isAlreadyAMember = group_members.some(
        (member) => member.id === user?.id
      );

      if (isAlreadyAMember) {
        return infoToast({
          title: "Already a member",
          desc: "You are already a member of this group savings",
        });
      }

      router.push(
        `/JoinGroupsavingDetails?data=${JSON.stringify(
          response.data.group_savings
        )}`
      );
    } catch (error) {
      showErrorToast({
        title: "Something went wrong",
        desc: "Please confirm the invite code is correct and try again",
      });
    } finally {
      hideLoader();
    }
  }

  async function intigrateJoingroup() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/group-savings/invite/${groupCode}`,
        method: "get",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      router.push(
        `/JoinGroupsavingDetails?data=${JSON.stringify(
          intigrate.data.data.group_savings
        )}`
      );
    } catch (error: any) {
      console.log(error, error?.response?.data);

      Toast.show({
        type: "error",
        text1: "Failed to get Group",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => Keyboard.dismiss()}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Join Group Savings</Text>
          <View className="mr-6" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>JOIN GROUP SAVINGS</Text>
          <Text style={styles.subtitle}>Enter Group Code Below To Join</Text>

          <Text style={styles.inputLabel}>ENTER GROUP CODE</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            value={groupCode}
            onChangeText={setGroupCode}
          />

          <Button
            text="JOIN GROUP SAVINGS"
            disabled={!groupCode}
            onPress={handleGroupInvitation}
            classNames="w-full"
          />
        </View>

        <Toast />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#1400FB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: IS_ANDROID_DEVICE ? 50 : 10,
    gap: 10,
    paddingBottom: 20,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 25,
    marginTop: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#000",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 10,
    width: "100%",
  },
  joinButton: {
    backgroundColor: "#0C0CFF",
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    padding: 15,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default JoinGroup;
