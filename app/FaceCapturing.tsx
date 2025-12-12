import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

const FaceCapturing = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenCamera = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required!");
      return;
    }

    // Open the camera for taking a selfie
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for a selfie
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      // If the user did not cancel and there are assets (image data)
      setPhotoUri(result.assets[0].uri); // Access the URI of the captured image
    }
  };

  const handleRetakePhoto = () => {
    setPhotoUri(null);
  };

  const handleSubmitPhoto = () => {
    setModalVisible(true);
    // Add functionality to upload or process the photo
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>KYC Verification</Text>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressCircle, styles.activeStep]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={[styles.progressCircle, styles.activeStep]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressCircle}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Capture a Selfie</Text>
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions</Text>
        <Text style={styles.instructionsText}>
          1. Your head must be in the middle of the photograph.
        </Text>
        <Text style={styles.instructionsText}>
          2. No sunglasses, headwear, or face painting.
        </Text>
        <Text style={styles.instructionsText}>
          3. You must be facing forward with a neutral expression (no smiling).
        </Text>
        <Text style={styles.instructionsText}>
          4. Please make sure you are in a well-lit area.
        </Text>
      </View>
      {photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetakePhoto}
            >
              <AntDesign name="camera" color={"#0000ff"} size={20} />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitPhoto}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity style={styles.photoButton} onPress={handleOpenCamera}>
          <Ionicons name="camera-outline" size={20} color="#FFF" />
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </TouchableOpacity>
      )}

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

            <Text style={styles.modalTitle}>Verification Successful</Text>
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

export default FaceCapturing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  camera: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cameraButtonContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  captureButton: {
    backgroundColor: "#2F54EB",
    padding: 20,
    borderRadius: 50,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "#2F54EB",
  },
  stepNumber: {
    color: "#fff",
    fontWeight: "bold",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E0",
  },
  instructionsContainer: {
    backgroundColor: "#E8F4FF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 4,
  },
  photoButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F54EB",
    padding: 12,
    borderRadius: 8,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginVertical: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  retakeButton: {
    backgroundColor: "#E8F4FF",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  retakeButtonText: {
    color: "#2F54EB",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#2F54EB",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
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
});
