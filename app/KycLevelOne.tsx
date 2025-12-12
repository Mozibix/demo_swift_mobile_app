import Button from "@/components/ui/Button";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { KYCApi } from "@/services/api";
import {
  _TSFixMe,
  getErrorMessage,
  getFileInfo,
  navigationWithReset,
} from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { router, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from "react";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { IS_ANDROID_DEVICE } from "@/constants";

const KycLevelOne = () => {
  const DocumentType = [
    { name: "National ID Slip", id: "national_id_slip" },
    { name: "National ID Card", id: "national_id_card" },
    { name: "Voters Card", id: "voters_card" },
    { name: "Driver License", id: "drivers_license" },
    { name: "International Passport", id: "international_passport" },
  ];

  const { displayLoader, hideLoader, user } = useAuth();
  const navigation = useNavigation();

  // showLogs("user", user);

  const [currentStep, setCurrentStep] = useState(1);
  const [frontImage, setFrontImage] = useState<_TSFixMe | null>(null);
  const [backImage, setBackImage] = useState<_TSFixMe | null>(null);
  const [faceImage, setFaceImage] = useState<_TSFixMe | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [KycsetdataModal, setKycsetdataModal] = useState(true);
  const [kycLivenessCheck, setKycLivenessCheck] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarEndVisible, setCalendarEndVisible] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [otherNames, setOtherNames] = useState(user?.kyc?.other_names ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.kyc?.date_of_birth
      ? formatDOB(user?.kyc?.date_of_birth as _TSFixMe)
      : "",
  );
  const [address, setAddress] = useState(user?.kyc?.address ?? "");
  const [occupation, setOccupation] = useState(user?.kyc?.occupation ?? "");
  const [bvn, setBvn] = useState("");
  const [gender, setGender] = useState<"male" | "female" | string>(
    user?.kyc?.gender ?? "",
  );
  const [gendermodal, setGendermodal] = useState(false);

  const [selectidModal, setSelectIdModal] = useState(false);
  const [IdType, setIdType] = useState(DocumentType[0]);
  const [idNumber, setIdNumber] = useState(user?.kyc?.document_number ?? "");

  //camera
  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [livenessImage, setlivenessImage] = useState<string | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  // if (!permission.granted) {
  //   return (
  //     <View style={[styles.container, styles.centered]}>
  //       <Image
  //         source={require("../assets/camera.svg")}
  //         style={{ height: 200, width: 200 }}
  //       />
  //       <Text style={styles.errorText} className="mt-5 max-w-[90%]">
  //         Camera access is required to upload photos.{" "}
  //         {!permission.canAskAgain &&
  //           "You can grant access to the camera in your SwiftPay app settings"}
  //       </Text>

  //       <Button
  //         text="Grant Permission"
  //         onPress={() => {
  //           if (permission.canAskAgain) {
  //             requestPermission();
  //           } else {
  //             Linking.openSettings();
  //           }
  //         }}
  //         classNames="w-[80%]"
  //       />

  //       <Button
  //         text="Go Back"
  //         onPress={() => router.back()}
  //         outlined
  //         softBg
  //         classNames="w-[80%]"
  //       />
  //     </View>
  //   );
  // }

  const onDateSelect = (day: { dateString: React.SetStateAction<string> }) => {
    setDateOfBirth(day.dateString);
    setCalendarEndVisible(false);
  };

  function formatDOB(date: Date) {
    const dateConverted = new Date(date);
    const year = dateConverted.getFullYear();
    const month = String(dateConverted.getMonth() + 1).padStart(2, "0");
    const day = String(dateConverted?.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function handleDateChange(selectedDate: Date | undefined) {
    if (selectedDate) {
      const formatted = formatDOB(selectedDate);

      setDateOfBirth(formatted);
      setTempDate(selectedDate);
      // setShowDatePicker(false);
    }
  }

  // Function to pick an image from the gallery
  const pickImageFromGallery = async (
    setImage: (imageUri: string | null) => void,
  ) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePictureWithCamera = async (setImage: (imageUri: any) => void) => {
    if (permission.canAskAgain) {
      requestPermission().then(async (result) => {
        if (result.granted) {
          try {
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });

            if (!result.canceled) {
              setImage(result.assets[0].uri);
            }
          } catch (error) {
            console.log("error", error);
          }
        }
      });
    } else {
      if (!permission.granted) {
        Alert.alert(
          "No Camera Access",
          "Permission to access camera is denied. Grant SwiftPay app access to camera in settings",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    }
  };

  // Function to show options to pick image from gallery or take picture
  const showImagePickerOptions = (
    setImage: (imageUri: string | null) => void,
  ) => {
    Alert.alert("Select Document", "Choose an option", [
      { text: "Take Photo", onPress: () => takePictureWithCamera(setImage) },
      {
        text: "Choose from Gallery",
        onPress: () => pickImageFromGallery(setImage),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // const handleNext = async () => {
  //   if (!frontImage || !backImage) {
  //     Alert.alert("Error", "Please upload both front and back images");
  //     return;
  //   }
  //   if (!IdType.id || !backImage) {
  //     Alert.alert("Error", "Please select an idType");
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const token = await SecureStore.getItemAsync("userToken");
  //     if (!token) throw new Error("No authentication token found");

  //     console.log("Submitting images:", { frontImage, backImage });
  //     const result = await submitKycStep1(
  //       frontImage,
  //       backImage,
  //       token,
  //       IdType.id,
  //       idNumber
  //     );
  //     console.log("Submission result:", result);

  //     // router.push("/KycLevelTwo");
  //     setKycLivenessCheck(true);
  //   } catch (error) {
  //     console.error("KYC submission error:", error);
  //     Alert.alert(
  //       "Error",
  //       error instanceof Error
  //         ? error.message
  //         : "Failed to submit images. Please try again."
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handlesubmitkycdetails = async () => {
  //   setIsLoading(true);
  //   try {
  //     const token = await SecureStore.getItemAsync("userToken");
  //     if (!token) throw new Error("No authentication token found");

  //     const result = await submitKycDetails1(
  //       {
  //         first_name: firstName,
  //         last_name: lastName,
  //         other_names: otherNames,
  //         date_of_birth: `${dateOfBirth}`.replace(
  //           /(\d{2})-(\d{2})-(\d{4})/,
  //           "$3-$2-$1"
  //         ),
  //         address,
  //         gender,
  //         occupation,
  //       },
  //       token
  //     );

  //     // router.push("/KycLevelTwo");
  //     setKycsetdataModal(false);
  //   } catch (error) {
  //     console.error("KYC submission error:", error);
  //     Alert.alert(
  //       "Error",
  //       error instanceof Error ? error.message : "Failed to submit kyc"
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  function handlePrevStep() {
    if (currentStep === 1) return;
    setCurrentStep((prevStep) => prevStep - 1);
  }

  async function submitKYCStepOneDetails() {
    if (bvn.length !== 11) {
      return showErrorToast({
        title: "BVN must be 11 digits",
      });
    }

    try {
      displayLoader();
      const response = await KYCApi.submitStepOne({
        first_name: firstName,
        last_name: lastName,
        other_names: otherNames,
        date_of_birth: dateOfBirth,
        address: address,
        occupation: occupation,
        gender,
        bvn,
      });

      return response.status === "success";
    } catch (error: any) {
      const firstError = getErrorMessage(error);
      showErrorToast({
        title: "Something went wrong",
        desc: firstError ?? error?.message ?? "Please try again later",
      });
      return false;
    } finally {
      hideLoader();
    }
  }

  async function submitKYCStepTwoDetails() {
    try {
      displayLoader();
      const formData = new FormData();
      const {
        fileUri: fileUriFront,
        fileName: fileNameFront,
        mimeType: mimeTypeFront,
      } = await getFileInfo(frontImage);

      const {
        fileUri: fileUriBack,
        fileName: fileNameBack,
        mimeType: mimeTypeBack,
      } = await getFileInfo(backImage);

      formData.append("document_type", IdType.id);
      formData.append("document_number", idNumber);
      formData.append("document_front_upload", {
        uri: fileUriFront,
        name: fileNameFront,
        type: mimeTypeFront,
      } as any);
      formData.append("document_back_upload", {
        uri: fileUriBack,
        name: fileNameBack,
        type: mimeTypeBack,
      } as any);

      const response = await KYCApi.submitStepTwo(formData);
      return response.status === "success";
    } catch (error: any) {
      const firstErrorMessage = getErrorMessage(error);
      showLogs("error", error);
      showErrorToast({
        title: "Something went wrong",
        desc: firstErrorMessage || error?.message || "Please try again later",
      });
      return false;
    } finally {
      hideLoader();
    }
  }

  async function submitKYCStepThreeDetails() {
    try {
      displayLoader();
      const formData = new FormData();
      const { fileUri, fileName, mimeType } = await getFileInfo(faceImage);
      formData.append("face_image", {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);
      const response = await KYCApi.submitStepThree(formData);

      return response.status === "success";
    } catch (error: any) {
      showErrorToast({
        title: "Something went wrong",
        desc: error?.message ?? "Please try again later",
      });
      return false;
    } finally {
      hideLoader();
    }
  }

  async function handleNextStep(setImage: any) {
    if (currentStep === 1) {
      if (
        !firstName ||
        !lastName ||
        !dateOfBirth ||
        !address ||
        !occupation ||
        !gender ||
        !bvn
      ) {
        return showErrorToast({
          title: "Missing fields detected",
          desc: "Please provide all required fields",
        });
      }
      const wasSuccessful = await submitKYCStepOneDetails();
      if (wasSuccessful) {
        setCurrentStep((prevStep) => prevStep + 1);
      }
      return;
    }

    if (currentStep === 2) {
      const wasSuccessful = await submitKYCStepTwoDetails();
      if (wasSuccessful) {
        setCurrentStep((prevStep) => prevStep + 1);
      }
      return;
    }

    if (currentStep === 3) {
      if (!faceImage) {
        return showErrorToast({
          title: "Photo required",
          desc: "Please take a photo to finsh your KYC process",
        });
      }
      const wasSuccessful = await submitKYCStepThreeDetails();
      if (wasSuccessful) {
        showSuccessToast({
          title: "Success!",
          desc: "KYC details submitted successfully and is pending approval",
        });
        navigationWithReset(navigation, "(tabs)");
      }
      return;
    }
  }

  function handleTakePhoto(setImage: any) {
    takePictureWithCamera(setImage);
  }

  const takeLivenessPicture = async () => {
    const photo: any = await ref.current?.takePictureAsync();
    setlivenessImage(photo?.uri);
  };

  const handleSubmitLiveness = async () => {
    if (!livenessImage) {
      Alert.alert("Error", "Please upload liveness");
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) throw new Error("No authentication token found");

      console.log("Submitting images:", { frontImage, backImage });
      // const result = await submitKycLiveness(livenessImage, token);
      // console.log("Submission result:", result);

      // router.push("/KycLevelTwo");

      Toast.show({
        type: "success",
        text1: "KYC Completed",
        text2: "Succesfully completed kyc",
        position: "bottom",
      });
      setKycLivenessCheck(false);
      router.back();
    } catch (error) {
      console.error("KYC submission error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to submit images. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showExitKYCAlert = () => {
    Alert.alert(
      "Exit KYC",
      "Are you sure you want to exit KYC?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Exit",
          onPress: () => {
            router.back();
          },
          style: "destructive",
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className="mx-3">
        <View
          style={styles.header}
          className={IS_ANDROID_DEVICE ? "mt-16" : ""}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={
              currentStep === 1 ? () => router.back() : () => showExitKYCAlert()
            }
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
          <View style={{ width: "100%", marginBottom: 10 }}>
            {currentStep === 1 && (
              <Animated.View entering={FadeInDown.delay(100)}>
                <View className="bg-white rounded-lg p-4">
                  <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter name"
                      autoComplete="name-given"
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={false}
                    />

                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter name"
                      autoComplete="name-family"
                      value={lastName}
                      onChangeText={setLastName}
                      editable={false}
                    />

                    <Text style={styles.inputLabel} className="mt-2">
                      Other Name (optional)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter other names"
                      autoComplete="name-middle"
                      value={otherNames}
                      onChangeText={setOtherNames}
                    />

                    <TouchableOpacity
                      onPress={() => {
                        setShowDatePicker(true);
                      }}
                      style={styles.datePickerField}
                      className="w-full"
                    >
                      <View className="flex-row justify-between items-center">
                        <Text style={styles.inputLabel}>Date of Birth</Text>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Text className="font-semibold text-[16px] text-swiftPayBlue mb-3 mt-2">
                            Select Date
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {dateOfBirth ? (
                        <TextInput
                          style={styles.input}
                          placeholder="Enter DOB"
                          autoComplete="name-middle"
                          value={dateOfBirth}
                          editable={false}
                        />
                      ) : (
                        <View style={styles.input}>
                          <Text className="text-[#d8d8d8] text-[17px]">
                            Click to select DOB
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {/*
                    <View
                      className="flex-row justify-between items-center"
                      style={{
                        marginTop: 2,
                        marginBottom: 10,
                        marginLeft: -10,
                      }}
                    >
                      {showDatePicker ? (
                        <DateTimePicker
                          value={new Date(1990, 0, 1)}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "default" : "calendar"
                          }
                          onChange={handleDateChange}
                        />
                      ) : (
                        <View />
                      )}

                      {dateOfBirth && !showDatePicker && (
                        <TouchableOpacity
                          activeOpacity={0.6}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Text className="text-[17px] text-right text-swiftPayBlue">
                            Change Date
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View> */}

                    <DateTimePickerModal
                      isVisible={showDatePicker}
                      mode="date"
                      onConfirm={(date) => {
                        handleDateChange(date);
                        setShowDatePicker(false);
                      }}
                      onCancel={() => setShowDatePicker(false)}
                      buttonTextColorIOS={"#000"}
                      textColor={"#000"}
                      customCancelButtonIOS={() => (
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                          className="bg-[#fca5a5] p-3 rounded-lg mb-2"
                        >
                          <Text className="text-[#991b1b] text-[23px] text-center">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      )}
                      pickerContainerStyleIOS={{
                        backgroundColor: "#fff",
                      }}
                    />

                    <Text style={styles.inputLabel}>Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your address"
                      autoComplete="address-line1"
                      value={address}
                      onChangeText={setAddress}
                    />

                    <Text style={styles.inputLabel}>Occupation</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter occupation"
                      value={occupation}
                      onChangeText={setOccupation}
                    />

                    <Pressable onPress={() => setGendermodal(true)}>
                      <Text style={styles.inputLabel}>Gender</Text>

                      <TextInput
                        style={styles.input}
                        placeholder="Click to select Gender"
                        value={gender}
                        editable={false}
                        pointerEvents="none"
                        className="relative"
                      />
                      <AntDesign
                        name="down"
                        size={14}
                        color="black"
                        className="absolute top-12 right-2"
                      />
                    </Pressable>

                    <Text style={styles.inputLabel}>BVN</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter you BVN Number"
                      value={bvn}
                      onChangeText={setBvn}
                      keyboardType="number-pad"
                    />

                    {/* <TouchableOpacity
                           className="bg-red-500 p-3 rounded-lg items-center"
                           onPress={() => setKycsetdataModal(false)}
                         >
                           <Text className="text-white font-bold">Close</Text>
                         </TouchableOpacity> */}
                  </KeyboardAwareScrollView>
                </View>
              </Animated.View>
            )}

            {currentStep === 2 && (
              <Animated.View entering={FadeInDown.delay(100)} className="mx-3">
                <Pressable onPress={() => setSelectIdModal(true)}>
                  <Text style={styles.inputLabel}>Document Type</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Click to select document type"
                    autoComplete="name-middle"
                    value={IdType.name}
                    editable={false}
                    pointerEvents="none"
                    className="relative"
                  />
                  <AntDesign
                    name="down"
                    size={14}
                    color="black"
                    className="absolute top-12 right-2"
                  />
                </Pressable>

                <Text style={styles.inputLabel}>ID Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Id number"
                  autoComplete="name-middle"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />

                <Text style={styles.label} className="mt-6">
                  {IdType.name}
                </Text>
                <Text style={styles.description}>
                  Scan the front side of {IdType.name}
                </Text>
                <Image
                  source={
                    frontImage
                      ? { uri: frontImage }
                      : require("../assets/cards/sample-card1.png")
                  }
                  style={styles.card}
                />
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.camera}
                  onPress={() => showImagePickerOptions(setFrontImage)}
                >
                  <AntDesign name="camerao" size={30} color={"#fff"} />
                </TouchableOpacity>

                <Text style={styles.description}>
                  Scan the back side of {IdType.name}
                </Text>
                <Image
                  source={
                    backImage
                      ? { uri: backImage }
                      : require("../assets/cards/sample-card2.png")
                  }
                  style={styles.card}
                />
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.camera}
                  onPress={() => showImagePickerOptions(setBackImage)}
                >
                  <AntDesign name="camerao" size={30} color={"#fff"} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {currentStep === 3 && (
              <Animated.View
                entering={FadeInDown.delay(100)}
                className="mb-5 mx-3"
              >
                <Text className="text-[18px] font-medium">
                  Capture a Selfie
                </Text>

                <View className="mt-4 bg-blue-100 p-4 rounded-lg">
                  <Text className="text-[20px] font-medium">Instructions</Text>
                  <View>
                    <Text className="text-[16px] mt-4 text-gray-600">
                      1. Your head must be in the middle of the photograph.
                    </Text>
                    <Text className="text-[16px] mt-2 text-gray-600">
                      2. No sunglasses, head wear or face painting.
                    </Text>
                    <Text className="text-[16px] mt-2 text-gray-600">
                      3. You must be facing forwards in your photo with a
                      neutral expression (no smiling).
                    </Text>
                    <Text className="text-[16px] mt-2 text-gray-600">
                      4. Please make sure you are in a well lit area.
                    </Text>
                  </View>
                </View>

                <Image
                  source={{ uri: faceImage }}
                  style={{
                    height: 200,
                    width: "100%",
                    borderRadius: 10,
                    marginTop: 20,
                  }}
                />

                <Button
                  asChild
                  onPress={() => handleTakePhoto(setFaceImage)}
                  classNames="flex-row items-center justify-center gap-2"
                >
                  <AntDesign name="camerao" size={24} color="white" />
                  <Text className="text-white text-[17px] text-center font-semibold">
                    {faceImage ? "Re-take Photo" : "Take Photo"}
                  </Text>
                </Button>
              </Animated.View>
            )}
          </View>

          <View className="flex-row justify-between items-center w-full pb-[140px] px-3">
            {currentStep !== 1 ? (
              <TouchableOpacity activeOpacity={0.7} onPress={handlePrevStep}>
                <Text className="text-[16px] font-medium">BACK</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            <Text className="text-[16px]">{currentStep} / 3</Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleNextStep}>
              <Text className="text-[16px] text-swiftPayBlue font-medium">
                {currentStep === 3 ? "FINISH" : "NEXT"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* submit kyc details modal  */}

        {/* submit kyc liveness check  */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={kycLivenessCheck}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-4/5 bg-white rounded-lg p-4">
              <Text className="text-lg font-bold mb-4">
                Upload LiveNess Check
              </Text>

              {livenessImage ? (
                <Image
                  source={{ uri: livenessImage }}
                  style={{ height: 300, borderRadius: 500, marginBottom: 20 }}
                />
              ) : (
                <CameraView
                  facing={facing}
                  ref={ref}
                  mode="picture"
                  style={{ height: 300, borderRadius: 500, marginBottom: 20 }}
                />
              )}

              {livenessImage ? (
                <>
                  <TouchableOpacity
                    className="bg-blue-600 p-3 rounded-lg items-center mb-2"
                    onPress={() => setlivenessImage(null)}
                  >
                    <Text className="text-white font-bold">Retake</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-blue-600 p-3 rounded-lg items-center mb-2"
                    onPress={handleSubmitLiveness}
                  >
                    <Text className="text-white font-bold">Upload</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  className="bg-blue-600 p-3 rounded-lg items-center mb-2"
                  onPress={takeLivenessPicture}
                >
                  <Text className="text-white font-bold">TakePhoto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
        {/* callender modal */}
        <Modal
          transparent={true}
          visible={calendarEndVisible}
          animationType="slide"
          onRequestClose={() => setCalendarEndVisible(false)}
        >
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarContent}>
              <Calendar
                maxDate={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 18),
                  )
                    .toISOString()
                    .split("T")[0]
                }
                initialDate={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 18),
                  )
                    .toISOString()
                    .split("T")[0]
                }
                hideExtraDays={true}
                onDayPress={onDateSelect}
                markedDates={{
                  [dateOfBirth]: {
                    selected: true,
                    marked: true,
                    selectedColor: "blue",
                  },
                }}
              />
              <TouchableOpacity
                onPress={() => setCalendarEndVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Genderoptions */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={gendermodal}
          onRequestClose={() => setGendermodal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setGendermodal(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  gender === "male" && styles.selectedOptionButton,
                ]}
                onPress={() => {
                  setGender("male");
                  setGendermodal(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === "male" && styles.selectedOptionText,
                  ]}
                >
                  male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  gender === "female" && styles.selectedOptionButton,
                ]}
                onPress={() => {
                  setGender("female");
                  setGendermodal(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === "female" && styles.selectedOptionText,
                  ]}
                >
                  female
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* select ID Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={selectidModal}
          onRequestClose={() => setSelectIdModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setSelectIdModal(false)}
          >
            <View style={styles.modalContent}>
              {DocumentType.map((i) => (
                <TouchableOpacity
                  key={i.id}
                  style={[
                    styles.optionButton,
                    IdType === i && styles.selectedOptionButton,
                  ]}
                  onPress={() => {
                    setIdType(i);
                    setSelectIdModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      IdType === i && styles.selectedOptionText,
                    ]}
                  >
                    {i.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingBottom: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 5,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#808080",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    borderRadius: 15,
    resizeMode: "cover",
    overflow: "hidden",
  },
  camera: {
    backgroundColor: "#0000ff",
    width: 50,
    padding: 10,
    borderRadius: 30,
    top: -55,
    left: 290,
    marginBottom: -40,
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
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 5,
    color: "#444",
  },
  datePickerField: {
    borderRadius: 8,
    justifyContent: "center",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  bottomPagination: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    justifyContent: "space-between",
    gap: 100,
  },
  nextButtonContainer: {
    padding: 10,
  },
  nextButton: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  pageText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
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
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },

  calendarModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#0000ff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 0,
    borderRadius: 20,
    alignItems: "center",
    width: 300,
  },
  optionButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  selectedOptionButton: {
    backgroundColor: "#f0f8ff",
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  optionText: {
    fontWeight: "500",
    fontSize: 16,
  },
});

export default KycLevelOne;
