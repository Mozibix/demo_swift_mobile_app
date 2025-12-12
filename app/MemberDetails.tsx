import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, router } from "expo-router";
import ProgressBar from "@/components/ProgressBar";
import LoadingComp from "@/components/Loading";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Toast from "react-native-toast-message";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
  profile_image: string | null;
  username: string;
  name: string;
  profile_photo: string;
  total_donations: number;
  pivot: {
    group_savings_id: number;
    user_id: number;
    role: "member" | "admin" | string;
    status: "active" | "pending" | string;
  };
}

const MemberDetails: React.FC = () => {
  const { myRole, member, type, targetAmount } = useLocalSearchParams();
  const parsedMember: Member = member
    ? JSON.parse(member as string)
    : { id: "", name: "", role: "Member" };

  const [isAdminModalVisible, setAdminModalVisible] = useState(false);
  const [isRemoveModalVisible, setRemoveModalVisible] = useState(false);
  const [Loading, setLoading] = useState(false);

  const handleMakeAdmin = () => {
    Alert.alert("Success", `${parsedMember.name} has been made an admin.`);
    setAdminModalVisible(false);
  };

  const handleRemoveMember = () => {
    Alert.alert("Success", `${parsedMember.name} has been removed.`);
    setRemoveModalVisible(false);
  };

  async function RemoveMemberApi() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/group-savings/remove-member`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          group_savings_id: parsedMember.pivot.group_savings_id,
          user_id: parsedMember.pivot.user_id,
          reason: "His is not active in the group",
        }),
      });

      console.log(intigrate.data);

      router.back();
      router.back();
    } catch (error: any) {
      console.log(error, error?.response);

      Toast.show({
        type: "error",
        text1: "Failed to fetch data",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setRemoveModalVisible(false);
      setLoading(false);
    }
  }

  async function MakeAdminApi() {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      let intigrate = await axios({
        url: `https://swiftpaymfb.com/api/group-savings/make-member-admin`,
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          group_savings_id: parsedMember.pivot.group_savings_id,
          user_id: parsedMember.pivot.user_id,
        }),
      });

      console.log(intigrate.data);

      router.back();
      router.back();
    } catch (error: any) {
      console.log(error, error?.response);

      Toast.show({
        type: "error",
        text1: "Failed to fetch data",
        text2: error.response?.data?.message || "An error occurred",
        position: "top",
      });
    } finally {
      setRemoveModalVisible(false);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LoadingComp visible={Loading} />
      <View style={styles.detailsContainer}>
        <Text style={styles.memberName}>{parsedMember.name}</Text>
        <Image
          source={
            parsedMember.profile_photo
              ? { uri: parsedMember.profile_photo }
              : require("../assets/user.png")
          }
          style={styles.largeProfileImage}
        />
        <View style={styles.info}>
          {type == "flexible" && (
            <>
              <Text style={styles.label}>Member Estimated Amount</Text>
              <Text style={styles.amount}>{targetAmount}</Text>
            </>
          )}

          <Text style={styles.label}>Member Active Savings</Text>
          <Text style={styles.amount}>{parsedMember.total_donations}</Text>
          <Text style={styles.label}>RIS</Text>
          <ProgressBar
            progress={
              (Number(parsedMember?.total_donations) / Number(targetAmount)) * 1
            }
          />

          <Text style={styles.roleText}>{parsedMember.pivot.role}</Text>

          {myRole == "admin" && (
            <View style={styles.buttons}>
              {parsedMember.pivot.role != "admin" && (
                <TouchableOpacity
                  style={styles.makeAdminButton}
                  onPress={() => setAdminModalVisible(true)}
                >
                  <Text style={styles.buttonText}>Make Admin</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.removeButton,
                  parsedMember.pivot.role == "admin" ? { width: "100%" } : null,
                ]}
                onPress={() => setRemoveModalVisible(true)}
              >
                <Text style={styles.buttonText}>Remove Member</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Make Admin Modal */}
      <Modal
        visible={isAdminModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Make Admin</Text>
            <Text style={styles.modalText}>
              Are you sure you want to make {parsedMember.name} an admin?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAdminModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={MakeAdminApi}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        visible={isRemoveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Remove Member</Text>
            <Text style={styles.modalText}>
              Are you sure you want to remove {parsedMember.name} from the
              group?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRemoveModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={RemoveMemberApi}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Toast />
    </View>
  );
};

export default MemberDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  detailsContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginTop: 40,
    width: "100%",
  },
  largeProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 12,
  },
  memberName: {
    fontSize: 24,
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
  },
  info: {
    paddingHorizontal: 16,
    width: "100%",
  },
  amount: {
    fontSize: 20,
    color: "green",
  },
  roleText: {
    fontSize: 16,
    marginTop: 8,
    // color: '#fff',
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
  },
  makeAdminButton: {
    backgroundColor: "blue",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  removeButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "gray",
  },
  confirmButton: {
    backgroundColor: "blue",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  depo: {
    fontSize: 14,
    color: "green",
    marginTop: 4,
    marginBottom: 8,
  },
});
