import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import { Image } from "expo-image";
import {
  _TSFixMe,
  formatAmount,
  formatDateShort,
  getErrorMessage,
} from "@/utils";
import Button from "@/components/ui/Button";
import { ajoContributionApi, api, apiService } from "@/services/api";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { CommonActions } from "@react-navigation/native";

const GroupDetailsScreen = () => {
  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [isLoading, setIsLoading] = React.useState(false);
  const { user, displayLoader, hideLoader } = useAuth();
  const navigation = useNavigation();

  const { data } = useLocalSearchParams();
  const parsedData = data ? JSON.parse(data as string) : {};
  // showLogs("Parsed Data:", parsedData?.ajo_contribution);

  async function handleInvitationResponse() {
    try {
      console.log({ id: parsedData.ajo_contribution.id });
      displayLoader();
      const response = await ajoContributionApi.joinAjoGroup(
        parsedData.ajo_contribution.id
      );

      showSuccessToast({
        title: "Successful!",
        desc: "You have joined this Ajo Contirbution Group",
      });
      router.push({
        pathname: "/AjoDetails",
        params: {
          id: parsedData.ajo_contribution?.id,
        },
      });
    } catch (error: _TSFixMe) {
      showLogs("error", error);
      const firstError = getErrorMessage(error);
      showErrorToast({
        title: "Something went wrong",
        desc: error?.data?.message || firstError,
      });
    } finally {
      hideLoader();
    }
  }
  const handleJoinContribution = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
          position: "top",
        });
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/ajo-contributions/join?invite_code`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "You have successfully joined the Ajo contribution",
          position: "top",
        });
        const Data = response?.data?.data;
        router.push({
          pathname: "/AjoDetails",
          params: {
            id: parsedData.ajo_contribution?.id,
          },
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "An error occurred",
          position: "top",
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: "Error",
          text2: serverMessage,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to join the Ajo contribution",
          position: "top",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>GROUP DETAILS</Text>
      </View>

      <ScrollView className="mx-5" contentContainerStyle={{ marginTop: 50 }}>
        {/* Group Details Card */}
        <View style={styles.content}>
          <Text className="font-bold text-[18px]">
            Hello, {user?.first_name}
          </Text>
          <Text className="mb-5 mt-1 text-[15px]">
            You have been invited to join this Ajo Contribution with the
            following details
          </Text>
          <View style={styles.card}>
            <Image
              source={{ uri: parsedData.ajo_contribution.cover_photo_url }}
              style={{
                height: 80,
                width: 80,
                borderRadius: 50,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <View>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>
                {parsedData.ajo_contribution?.name || "N/A"} (
                {`${parsedData.ajo_contribution?.no_of_members} ${
                  parsedData.ajo_contribution?.no_of_members === 1
                    ? "Member"
                    : "Members"
                }`}
                )
              </Text>
            </View>

            <View>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>
                {parsedData.ajo_contribution?.description || "N/A"}
              </Text>
            </View>

            <View>
              <Text style={styles.label}>Start Date</Text>
              <Text style={styles.value}>
                {formatDateShort(parsedData.ajo_contribution?.start_date) ||
                  "N/A"}
              </Text>
            </View>

            <View>
              <Text style={styles.label}>Contribution Amount</Text>
              <Text style={styles.value}>
                ₦{formatAmount(parsedData.ajo_contribution?.amount) || "N/A"}
              </Text>
            </View>
          </View>

          <Button text="Proceed" onPress={handleInvitationResponse} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/(tabs)")}
            className="flex-row justify-center items-center gap-4 mt-4"
          >
            <Text className="text-[17px] font-medium text-[#e02424]">
              Decline Invite
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#0C0CFF",
    paddingVertical: 20,
    alignItems: "center",
    // marginTop: 40,
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
    color: "#374151",
  },
  value: {
    fontSize: 17,
    fontWeight: "500",
    color: "#000",
    marginBottom: 15,
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
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 40,
    justifyContent: "center",
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
