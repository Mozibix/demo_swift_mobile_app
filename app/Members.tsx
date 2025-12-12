import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import KAScrollView from "@/components/ui/KAScrollView";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { _TSFixMe, formatAmount, getErrorMessage } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  total_donations: string;
  pivot: {
    group_savings_id: number;
    user_id: number;
    role: "member" | "admin" | string;
    status: "active" | "pending" | string;
  };
}

const MembersScreen: React.FC = () => {
  const router = useRouter();
  const { data, myRole, type, targetAmount, group_id }: any =
    useLocalSearchParams();
  const [members, setMembers] = useState<Member[]>(JSON.parse(data));
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [reason, setReason] = useState("");
  const [currentMemberId, setCurrentMemberId] = useState(0);
  const { displayLoader, hideLoader, user } = useAuth();
  const currentMember = members?.find((member) => member.id === user?.id);
  const isAdmin = currentMember?.pivot?.role === "admin";
  // showLogs("currentMember", currentMember);

  async function makeUserAdmin(member_id: number) {
    try {
      displayLoader();
      const response = await apiService.makeMemberGroupAdmin({
        group_savings_id: group_id,
        user_id: member_id,
      });

      showLogs("response", response);

      if (response?.status === "success") {
        showSuccessToast({
          title: "Successful!",
          desc: response?.message,
        });

        router.back();
      }
    } catch (error: _TSFixMe) {
      showLogs("makeUserAdmin error", error);
      showErrorToast({
        title: "Operation failed",
        desc: error?.data?.message || "Please try again",
      });
    } finally {
      hideLoader();
    }
  }

  async function removeMember() {
    try {
      setShowReasonBox(false);
      displayLoader();
      showLogs("data", {
        group_savings_id: group_id,
        user_id: currentMemberId,
        reason,
      });
      const response = await apiService.removeMemberFromGroup({
        group_savings_id: group_id,
        user_id: currentMemberId,
        reason,
      });

      showLogs("removeMember response", response);
      setReason("");
      showSuccessToast({
        title: "Successful",
        desc: "Mmeber removed successfully",
      });
      router.back();
    } catch (error: _TSFixMe) {
      showLogs("removeMember error", error);
      const firstError = getErrorMessage(error);
      showErrorToast({
        title: "Operation failed",
        desc: firstError || error?.data?.message || "Please try again",
      });
    } finally {
      hideLoader();
    }
  }

  // showLogs("members", members);
  // showLogs("targetAmount", targetAmount);

  return (
    <SafeAreaView style={styles.container}>
      <View className="mx-5">
        <View className="flex-row items-center gap-3 mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.heading}>Members</Text>
        </View>
        <KAScrollView>
          <FlatList
            data={members}
            keyExtractor={(item) => `${item.id}`}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                // onPress={() =>
                //   router.push({
                //     pathname: "/MemberDetails",
                //     params: {
                //       myRole,
                //       member: JSON.stringify(item),
                //       type,
                //       targetAmount,
                //     },
                //   })
                // }
                style={styles.memberWrapper}
              >
                <View style={styles.memberItem}>
                  <Image
                    source={
                      item.profile_photo
                        ? { uri: item.profile_photo }
                        : require("../assets/user.png")
                    }
                    style={styles.profileImage}
                  />
                  <View style={styles.memberInfo}>
                    <View>
                      <Text style={styles.memberName}>{item.name}</Text>
                    </View>

                    <Badge status={item.pivot.status} />
                  </View>
                </View>

                <View>
                  {targetAmount && (
                    <View className="mb-4 mt-3">
                      <Text style={styles.memberName}>
                        Member Estimated Amount:
                      </Text>
                      <Text
                        style={styles.value}
                        className="text-greenText font-medium"
                      >
                        ₦{formatAmount(+targetAmount || 0)}
                      </Text>
                    </View>
                  )}

                  <View>
                    <Text style={styles.memberName}>Active Savings:</Text>
                    <Text
                      style={styles.value}
                      className="text-greenText font-medium"
                    >
                      ₦{formatAmount(parseInt(item.total_donations) ?? 0)}
                    </Text>
                  </View>
                </View>

                {isAdmin &&
                  item.pivot.user_id !== user?.id &&
                  item.pivot.status === "active" && (
                    <View className="flex-row gap-3">
                      {isAdmin && item.pivot.role !== "admin" && (
                        <Button
                          text="Make Admin"
                          onPress={() => makeUserAdmin(item.id)}
                          classNames="w-[48%] p-3"
                        />
                      )}

                      {isAdmin && (
                        <Button
                          outlined
                          softBg
                          text="Remove Member"
                          onPress={() => {
                            setShowReasonBox(true);
                            setCurrentMemberId(item.id);
                          }}
                          classNames="w-[48%] p-3"
                        />
                      )}
                    </View>
                  )}

                <Modal
                  visible={showReasonBox}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowReasonBox(false)}
                >
                  <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowReasonBox(false)}
                  >
                    <TouchableOpacity
                      style={styles.modalContent}
                      activeOpacity={1}
                      onPress={() => {}}
                    >
                      <Text style={{ fontWeight: "700", fontSize: 20 }}>
                        Remove Member
                      </Text>

                      <Text style={{ fontSize: 17, marginTop: 20 }}>
                        Reason to remove member
                      </Text>

                      <TextInput
                        style={styles.input}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        placeholder="Enter reason for removing member..."
                      />

                      <View className="flex-row items-start gap-2 mb-6 -mt-3">
                        <FontAwesome5
                          name="info-circle"
                          size={15}
                          color="#666"
                        />
                        <Text className="text-gray-200 max-w-[85%]">
                          At least 5 characters
                        </Text>
                      </View>

                      <Button
                        text="Proceed"
                        onPress={removeMember}
                        disabled={!reason || reason.length < 5}
                        classNames="mb-5 flex-row items-center justify-center gap-3"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              </View>
            )}
          />
        </KAScrollView>
      </View>
    </SafeAreaView>
  );
};

export default MembersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",

    color: "#000",
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
  memberWrapper: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: "#555",
    minWidth: "60%",
    maxWidth: "75%",
  },
  value: {
    fontSize: 19,
    minWidth: "70%",
    maxWidth: "85%",
  },
  roleLabel: {
    fontSize: 16,
    color: "#666",
  },
  activeLabel: {
    color: "green",
  },
  seeAll: {
    alignItems: "center",
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  seeAllText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "400",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // minHeight: 500,
  },

  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  successBottomSheetDesc: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    backgroundColor: "#f7f7f7",
    marginBottom: 20,
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 100,
  },

  modalOverlay: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
