import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { formatDate } from "@/utils/formatters";
import { showLogs } from "@/utils/logger";
import { formatAmount } from "@/utils";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";

const GroupDetailsScreen = () => {
  const { displayLoader, hideLoader } = useAuth();

  const { data } = useLocalSearchParams();
  const parsedData = data ? JSON.parse(data as string) : {};
  // showLogs("parsedData", parsedData);

  const handleJoinSavings = async (user_response: "accept" | "decline") => {
    try {
      displayLoader();
      const response = await apiService.responseToInvite({
        group_savings_id: parsedData.id,
        response: user_response,
      });

      showLogs("response", response);

      if (response.status === "success") {
        if (user_response === "accept") {
          showSuccessToast({
            title: "Group joined!",
            desc: `You have successfully joined ${parsedData.name}`,
          });
        } else {
          showSuccessToast({
            title: "Success",
            desc: "You have successfully responded to this invitation",
          });
        }

        router.replace("/GroupDashboard");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "An error occurred",
          position: "top",
        });
      }
    } catch (error: any) {
      showLogs("error", error.response);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        showErrorToast({
          title: "Something went wrong",
          desc: serverMessage,
        });
      } else {
        showErrorToast({
          title: "Something went wrong",
          desc: "Failed to respond to invititation",
        });
      }
    } finally {
      hideLoader();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>GROUP DETAILS</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={{}}>
            <View>
              <Text style={styles.label}>NAME</Text>
              <Text style={styles.value}>{parsedData?.name || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.description}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <Text style={styles.value}>{parsedData?.description || "N/A"}</Text>
          </View>

          <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>START DATE</Text>
            <Text style={styles.value}>
              {formatDate(parsedData.created_at) || "N/A"}
            </Text>
          </View>

          <View style={{}}>
            {parsedData?.type == "flexible" ? (
              <View style={styles.left}>
                <Text style={styles.label}>GROUP TARGET</Text>
                <Text style={styles.value}>
                  {parsedData?.target_amount || "N/A"}
                </Text>
              </View>
            ) : (
              <View style={styles.left}>
                <Text style={styles.label}>MEMBER GROUP TARGET</Text>
                <Text style={styles.value}>
                  ₦{formatAmount(parsedData?.member_target_amount) || "N/A"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row gap-3">
          <Button
            text="JOIN GROUP"
            onPress={() => handleJoinSavings("accept")}
            classNames="w-[48%]"
          />
          <Button
            text="DECLINE"
            outlined
            onPress={() => handleJoinSavings("decline")}
            classNames="w-[48%]"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: "#1400FB",
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#e2e8fd",
    padding: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#444",
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    textTransform: "uppercase",
  },
  proceedButton: {
    backgroundColor: "#0C0CFF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 40,
    marginHorizontal: 10,
    marginTop: 20,
    justifyContent: "center",
  },
  description: {
    marginVertical: 10,
  },
  left: {
    alignItems: "flex-start",
  },
  right: {
    alignItems: "flex-end",
  },
  row2: {
    marginBottom: 40,
  },
});

export default GroupDetailsScreen;
