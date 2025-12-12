import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Animated,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Overlay } from "react-native-elements";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingComp from "@/components/Loading";
import Toast from "react-native-toast-message";
import { profileBadges, shortenText } from "@/utils";
import { useAuth, UserLevel } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import { showErrorToast } from "@/components/ui/Toast";
import * as WebBroswer from "expo-web-browser";

interface AccountLevel {
  min: number;
  max: number | null;
}

interface AccountLevels {
  [key: string]: AccountLevel;
}

interface AccountLevelsResponse {
  levels: AccountLevels;
  current_level: string;
}

const MyAccount = () => {
  const [pin, setpin] = useState<string>("");
  const [Loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [ProfilePicDetail, setProfilePicDetail] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [accountLevels, setAccountLevels] =
    useState<AccountLevelsResponse | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { displayLoader, hideLoader, verifyPin, getUserProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    displayLoader();
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get("https://swiftpaymfb.com/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setUserProfile(response.data.data);
        setProfileImage(response.data.data.profile_photo);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      }
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN to continue");
      return;
    }
    displayLoader();
    const isValid = await verifyPin(pin);
    if (!isValid) {
      setDeleteModalVisible(false);
      hideLoader();
      showErrorToast({
        title: "Invalid PIN",
        desc: "You entered an invalid pin, please try again",
      });
      return;
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      const response = await axios.post(
        "https://swiftpaymfb.com/api/user/delete-account",
        { pin: pin },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showLogs("response", response);

      if (response.status === 200) {
        await SecureStore.deleteItemAsync("userToken");
        await AsyncStorage.clear();
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      let Data = result.assets[0];

      await updateProfilePhoto({
        uri: Data.uri,
        name: Data.uri.split("/")[Data.uri.split("/").length - 1],
        type:
          Data.type + "/" + Data.uri.split(".")[Data.uri.split(".").length - 1],
      });
    }
  };

  async function updateProfilePhoto(imageData: any) {
    try {
      setLoading(true);
      let newform = new FormData();

      newform.append("photo", imageData);

      const token = await SecureStore.getItemAsync("userToken");

      await axios({
        url: "https://swiftpaymfb.com/api/user/update-profile-photo",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        data: newform,
      });
      getUserProfile();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.response?.data?.message || "An error occurred",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  }

  const _handlePressLiveChat = async () => {
    const userDetailsString = await AsyncStorage.getItem("UserDetails");
    const hashID = userDetailsString
      ? JSON.parse(userDetailsString).hash_id
      : null;
    const url = `https://swiftpaymfb.com/visit-live-chat?user_hash_id=${hashID}`;
    await WebBroswer.openBrowserAsync(url);
  };

  return (
    <View style={styles.container}>
      <LoadingComp visible={Loading} />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>

      <View style={{ paddingBottom: 10 }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.user} />
              ) : (
                <Image
                  source={require("../assets/logos/lo.jpg")}
                  style={styles.user}
                />
              )}
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.profileName}>
              {`${userProfile?.first_name ?? "N/A"} ${
                userProfile?.last_name ?? "N/A"
              }` || "N/A"}
            </Text>
            <Text style={styles.profileEmail}>
              {userProfile?.email || "N/A"}
            </Text>
            <TouchableOpacity
              style={styles.badge}
              onPress={() => router.push("/StatusInformation")}
            >
              <Image
                source={profileBadges[userProfile?.level as UserLevel]}
                style={styles.icon}
              />
              <Text style={styles.medalText}>
                {userProfile?.level
                  ? `${
                      userProfile?.level[0].toUpperCase() +
                      userProfile?.level.slice(1)
                    } Badge`
                  : "N/A"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Personal Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>FIRST NAME</Text>
            <Text style={styles.detailValue}>
              {shortenText(userProfile?.first_name) || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>LAST NAME</Text>
            <Text style={styles.detailValue}>
              {userProfile?.last_name || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>OTHER NAMEs</Text>
            <Text style={styles.detailValue}>
              {userProfile?.kyc?.other_names || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EMAIL</Text>
            <View style={styles.editableRow}>
              <Text style={styles.detailValue}>
                {shortenText(userProfile?.email) || "N/A"}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ADDRESS</Text>
            <View style={styles.editableRow}>
              <Text style={styles.detailValue}>
                {userProfile?.kyc?.address || "N/A"}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>DATE OF BIRTH</Text>
            <Text style={styles.detailValue}>
              {userProfile?.kyc?.date_of_birth
                ? new Date(userProfile?.kyc?.date_of_birth).toDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PHONE NUMBER</Text>
            <Text style={styles.detailValue}>
              {userProfile?.phone || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ACCOUNT STATUS</Text>
            <TouchableOpacity
              style={styles.flex}
              disabled={userProfile?.level ? false : true}
              onPress={() =>
                router.push(`/StatusInformation?status=${userProfile?.level}`)
              }
            >
              <Image
                source={profileBadges[userProfile?.level as UserLevel]}
                style={styles.icon}
              />
              <Text style={styles.detailValue}>
                {userProfile?.level
                  ? `${
                      userProfile?.level[0].toUpperCase() +
                      userProfile?.level.slice(1)
                    } Badge`
                  : "N/A"}
                {/* {accountLevels?.current_level
                  ? `${userProfile?.level} Badge`
                  : "Loading..."} */}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={_handlePressLiveChat}>
            <Text className="text-center text-[16px] text-swiftPayBlue font-semibold mt-4">
              Contact Support to Edit
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>SwiftPay Tag</Text>
        <View style={styles.swiftPayContainer}>
          <View style={styles.swiftPayRow}>
            <FontAwesome name="at" size={24} color="black" />
            <Text style={styles.swiftPayTag}>
              {userProfile?.username || "N/A"}
            </Text>
            <TouchableOpacity
              disabled={userProfile ? false : true}
              onPress={() =>
                router.push(`/ChangeSwiftpayTag?tag=${userProfile?.username}`)
              }
            >
              <AntDesign
                name="edit"
                size={20}
                color="black"
                style={styles.editIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setDeleteModalVisible(true)}
        >
          <AntDesign name="closecircle" size={24} color="white" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Delete Account</Text>
            <Text style={modalStyles.modalMessage}>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </Text>

            <Text style={modalStyles.modalMessage}>Enter your PIN</Text>
            <TextInput
              keyboardType="phone-pad"
              style={modalStyles.input}
              value={pin}
              onChangeText={(text) => {
                setpin(text);
                setError("");
              }}
            />
            {error && (
              <Text className="text-danger font-medium text-[16px] text-center mt-2">
                {error}
              </Text>
            )}

            <View style={modalStyles.modalButtons}>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setError("");
                }}
              >
                <Text style={modalStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.modalButton, { backgroundColor: "red" }]}
                onPress={handleDeleteAccount}
              >
                <Text style={modalStyles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  backButton: {
    backgroundColor: "#0000FF",
    padding: 8,
    borderRadius: 15,
    alignSelf: "flex-start",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 20,
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "#0000FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  profileInitial: {
    fontSize: 25,
    color: "white",
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    maxWidth: 250,
  },
  profileEmail: {
    fontSize: 14,
    color: "#999",
    padding: 3,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginVertical: 20,
  },
  detailsTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
  },
  detailRow: {
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  editableRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editIcon: {
    marginLeft: 10,
  },
  swiftPayContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  swiftPayRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  swiftPayTag: {
    fontSize: 16,
    marginLeft: 10,
  },
  deleteButton: {
    flexDirection: "row",
    backgroundColor: "red",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  deleteText: {
    color: "white",
    marginLeft: 10,
    fontSize: 16,
  },
  label: {
    fontWeight: "700",
    color: "#666",
    fontSize: 15,
    marginBottom: 10,
  },
  badge: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  medalContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  medalText: {
    fontSize: 14,
    fontWeight: "500",
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
  modalOverlay: {
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 15,
    width: "90%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "95%",
    justifyContent: "space-between",
  },
  modalBadgeHeader: {
    alignItems: "center",
  },
  modalBadgeIcon: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  modalBadgeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSubText: {
    fontSize: 14,
    marginTop: 10,
  },
  progress: {
    width: "50%", // This is just an example; dynamically set it based on progress.
    backgroundColor: "#0000ff",
    height: "100%",
    borderRadius: 5,
  },
  progressRemaining: {
    fontSize: 12,
    color: "#000",
    alignSelf: "flex-end",
    textAlign: "left",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#0000FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  user: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: "#0000FF",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  mock: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
  },
  popUpmodalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  popUpmodalItems: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    flex: 1,
  },
  card: {
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginBottom: 15,
  },
  transactionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  amount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  progressContainer: {
    width: "70%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 10,
  },
  iconBadge: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  progressBar: {
    height: 5,
    width: "70%",
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "50%",
    backgroundColor: "#4caf50",
    borderRadius: 5,
  },
  remaining: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
  },
});

export default MyAccount;
