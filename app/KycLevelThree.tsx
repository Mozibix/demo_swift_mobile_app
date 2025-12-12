import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { RadioButton } from "react-native-paper"; // Importing RadioButton from react-native-paper
import { router } from "expo-router";
import { submitKycStep3 } from "../services/kycService";
import * as SecureStore from "expo-secure-store";

const KycLevelThree = () => {
  const [gender, setGender] = useState<string>("Female");
  const [transactionPurpose, setTransactionPurpose] =
    useState<string>("Personal");
  const [occupation, setOccupation] = useState<string>("Service");
  const [profit, setProfit] = useState<string>("Yes");
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) throw new Error("No authentication token found");

      const data = {
        face_cam_photo: "", // Get from your face capture screen
        occupation,
        gender,
        profit,
      };
      await submitKycStep3(data, token);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to submit KYC details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* National ID Section */}
        <Text style={styles.title}>National ID</Text>
        <Text style={styles.subTitle}>
          Check your <Text style={styles.highlight}>National ID</Text>{" "}
          Information
        </Text>

        {/* Gender */}
        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.genderContainer}>
          <RadioButton.Group
            onValueChange={(value) => setGender(value)}
            value={gender}
          >
            <View style={styles.radioButtonRow}>
              <RadioButton value="Male" color="#0000ff" />
              <Text style={styles.radioLabel}>Male</Text>

              <RadioButton value="Female" color="#0000ff" />
              <Text style={styles.radioLabel}>Female</Text>

              <RadioButton value="Others" color="#0000ff" />
              <Text style={styles.radioLabel}>Others</Text>
            </View>
          </RadioButton.Group>
        </View>

        {/* Purpose of Transaction */}
        <Text style={styles.sectionLabel}>Purpose of Transaction</Text>
        <View style={styles.genderContainer}>
          <RadioButton.Group
            onValueChange={(value) => setTransactionPurpose(value)}
            value={transactionPurpose}
          >
            <View style={styles.radioButtonRow}>
              <RadioButton value="Personal" color="#0000ff" />
              <Text style={styles.radioLabel}>Personal</Text>

              <RadioButton value="Others" color="#0000ff" />
              <Text style={styles.radioLabel}>Others</Text>
            </View>
          </RadioButton.Group>
        </View>

        {/* Occupation */}
        <Text style={styles.sectionLabel}>Occupation</Text>
        <View style={styles.genderContainer}>
          <RadioButton.Group
            onValueChange={(value) => setOccupation(value)}
            value={occupation}
          >
            <View style={styles.radioButtonRow}>
              <RadioButton value="Service" color="#0000ff" />
              <Text style={styles.radioLabel}>Service</Text>

              <RadioButton value="Business" color="#0000ff" />
              <Text style={styles.radioLabel}>Business</Text>

              <RadioButton value="Housewife" color="#0000ff" />
              <Text style={styles.radioLabel}>Housewife</Text>
            </View>
            <View style={styles.radioButtonRow}>
              <RadioButton value="Student" color="#0000ff" />
              <Text style={styles.radioLabel}>Student</Text>

              <RadioButton value="Others" color="#0000ff" />
              <Text style={styles.radioLabel}>Others</Text>
            </View>
          </RadioButton.Group>
        </View>

        {/* Profit */}
        <Text style={styles.sectionLabel}>Profit</Text>
        <RadioButton.Group
          onValueChange={(value) => setProfit(value)}
          value={profit}
        >
          <View style={styles.radioButtonRow}>
            <RadioButton value="Yes" color="#0000ff" />
            <Text style={styles.radioLabel}>Yes</Text>

            <RadioButton value="No" color="#0000ff" />
            <Text style={styles.radioLabel}>No</Text>
          </View>
        </RadioButton.Group>

        {/* Bottom Navigation */}
        <View style={styles.bottomPagination}>
          <TouchableOpacity>
            <Text style={styles.navigationButton}>BACK</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>3/3</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isLoading}
            style={[
              styles.navigationButton,
              isLoading && styles.disabledButton,
            ]}
          >
            <Text style={styles.navigationButtonText}>
              {isLoading ? "Submitting..." : "Confirm"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={require("../assets/verified.png")}
              style={styles.mock}
            />

            <Text style={styles.modalTitle}>Verified Successful</Text>
            <Text style={styles.modalText}>Your account has been verified</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.modalButtonText}>Back To Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  placeholder: {
    width: 50,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
    color: "#0000ff",
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 5,
    textAlign: "left",
  },
  subTitle: {
    fontSize: 15,
    color: "#808080",
    marginBottom: 15,
    textAlign: "left",
  },
  highlight: {
    color: "#0000ff",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "400",
    marginVertical: 10,
    color: "#888",
  },
  radioButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioLabel: {
    marginRight: 20,
    fontSize: 16,
    color: "#000",
  },
  bottomPagination: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 150,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  navigationButton: {
    // View styles only
  },
  pageIndicator: {
    fontSize: 16,
    color: "#666",
  },
  genderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7d7d7",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    width: 300,
    paddingVertical: 80,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  modalButton: {
    backgroundColor: "#DCE6F6",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  modalButtonText: {
    color: "#0000ff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mock: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0000ff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  navigationButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
});

export default KycLevelThree;
