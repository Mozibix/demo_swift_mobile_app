import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { AntDesign } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import { useLocalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import KAScrollView from "@/components/ui/KAScrollView";
import { showLogs } from "@/utils/logger";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";
import { _TSFixMe, getErrorMessage, getFileInfo } from "@/utils";
import { showErrorToast } from "@/components/ui/Toast";

const EditAjoContribution = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageHasChanged, setImageHasChanged] = useState(false);
  const { displayLoader, hideLoader } = useAuth();
  const [ajoType, setAjoType] = useState<"personal" | "business" | undefined>(
    undefined
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const params = useLocalSearchParams();
  const API_BASE_URL = "https://swiftpaymfb.com/api";

  const [formData, setFormData] = useState({
    name: "",
    members: "",
    image: null as string | null,
  });

  useEffect(() => {
    if (params.formdata) {
      try {
        const parsedData = JSON.parse(params.formdata as string);
        // showLogs("parsedData", parsedData);
        setFormData({
          name: parsedData.name || "",
          members: parsedData.no_of_members.toString() || "",
          image: parsedData.cover_photo_url || null,
        });
        setAjoType(parsedData.type);

        if (parsedData.cover_photo_url) {
          setImage(parsedData.cover_photo_url);
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Failed to parse form data",
          text2: "Opps something went wrong",
          position: "top",
        });
      }
    }
  }, [params.formdata]);

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      handleInputChange("start_date", selectedDate);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Contribution name is required";
    if (!formData.members.trim())
      errors.members = "Number of members is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permission to upload images"
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        handleInputChange("image", result.assets[0].uri);
        setImageHasChanged(true);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to pick image",
        text2: "",
        position: "top",
      });
    }
  };

  let id: string | undefined;

  const handleEditContribution = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fix the errors in the form",
        position: "top",
      });
      return;
    }

    try {
      setIsLoading(false);
      displayLoader();
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please log in again",
          position: "top",
        });
        return;
      }

      console.log("imageHasChanged", imageHasChanged);

      const formDataObj = new FormData();
      formDataObj.append("ajo_contribution_id", params.id as string);
      formDataObj.append("name", formData.name);
      formDataObj.append("no_of_members", formData.members);
      const { fileUri, fileName, mimeType } = await getFileInfo(image);

      showLogs("mainimage", image);
      console.log("image", {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });

      if (imageHasChanged) {
        formDataObj.append("cover_image", {
          uri: fileUri,
          name: fileName,
          type: mimeType,
        } as _TSFixMe);
      } else {
        // formDataObj.append("cover_image", {
        //   uri: formData.image,
        //   name: fileName,
        //   type: mimeType,
        // } as _TSFixMe);
      }

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/update`,
        formDataObj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status === "success") {
        setIsSuccessVisible(true);
        Toast.show({
          type: "success",
          text1: response?.data?.message,
          text2: "successful",
          position: "top",
        });

        id = response?.data?.data?.id;
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: response.data.message || "Failed to update contribution",
          position: "top",
        });
      }
    } catch (error: _TSFixMe) {
      showLogs("thrown Error:", error);
      const firstError = getErrorMessage(error);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          firstError || error.response.data?.message || "An error occurred";
        Toast.show({
          type: "error",
          text1: "Failed to update contribution",
          text2: serverMessage || "Please try again",
          position: "top",
        });
      } else {
        console.log({ error: error.message });
        showErrorToast({
          title: "Update failed",
          desc: error || "Please try again",
        });
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const renderValidationError = (field: string) => {
    if (validationErrors[field]) {
      return <Text style={styles.errorText}>{validationErrors[field]}</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KAScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Ajo Contribution</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.label}>Contribution Name</Text>
          <TextInput
            style={[styles.input, validationErrors.name && styles.inputError]}
            placeholder="House Rent"
            value={formData.name}
            onChangeText={(text) => handleInputChange("name", text)}
            accessibilityLabel="Contribution name input"
          />
          {renderValidationError("name")}

          {/* Number of Members */}
          <Text style={styles.label}>
            Number of Members (
            {ajoType === "personal" ? "Including You" : "Excluding You"})
          </Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.members && styles.inputError,
            ]}
            placeholder="4"
            keyboardType="numeric"
            value={formData.members}
            onChangeText={(text) => handleInputChange("members", text)}
            accessibilityLabel="Number of members input"
          />
          {renderValidationError("members")}

          {/* Upload Image */}
          <Text style={styles.label}>Change Contribution Image</Text>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.uploadContainer}
            accessibilityLabel="Upload image button"
            accessibilityHint="Opens image picker"
          >
            <Text style={styles.uploadButton}>
              {image ? "Change Image" : "Upload Image"}
            </Text>
          </TouchableOpacity>
          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImage(null);
                  handleInputChange("image", "");
                }}
                accessibilityLabel="Remove image"
              >
                <AntDesign name="closecircle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}

          <Button
            text="Update Ajo"
            onPress={handleEditContribution}
            disabled={isLoading}
          />
        </ScrollView>

        {/* Success Bottom Sheet */}
        <BottomSheet
          isVisible={isSuccessVisible}
          onBackdropPress={() => setIsSuccessVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Image
              source={require("../assets/icons/success.png")}
              style={styles.logo}
            />
            <Text style={styles.successBottomSheetHeader}>
              Ajo Updated Successfully
            </Text>
            <Text style={styles.desc}>
              You have successfully updated your Ajo Contribution.
            </Text>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                setIsSuccessVisible(false);
                router.push({
                  pathname: "/AjoDetails",
                  params: {
                    id: params.id,
                  },
                });
              }}
              accessibilityLabel="Proceed button"
            >
              <Text style={styles.nextButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
        <Toast />
      </KAScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginVertical: 8,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  dateInput: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  createButton: {
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 40,
  },
  createButtonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageContainer: {
    position: "relative",
    marginVertical: 10,
    alignSelf: "flex-start",
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadContainer: {
    padding: 5,
    alignItems: "flex-start",
    marginVertical: 8,
  },
  uploadButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    overflow: "hidden",
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalOptionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOption: {
    fontSize: 16,
    textAlign: "center",
  },
  closeModalButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  closeModalText: {
    textAlign: "center",
    color: "#0000FF",
    fontWeight: "600",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 15,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  icon: {
    width: 25,
    height: 25,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },
});

export default EditAjoContribution;
