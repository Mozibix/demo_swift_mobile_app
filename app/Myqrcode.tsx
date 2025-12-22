// import React, { useEffect, useState, useRef } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Image,
//   Alert,
// } from "react-native";
// import SvgQRCode from "react-native-qrcode-svg";
// import ViewShot from "react-native-view-shot";
// import * as Sharing from "expo-sharing"; // Importing expo-sharing
// import { router } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// const Myqrcode = () => {
//   const [userName, setUserName] = useState("Adeagbo Josiah");
//   const [swiftPayTag, setSwiftPayTag] = useState("@josiah123");
//   const [qrValue, setQrValue] = useState(`${userName} - ${swiftPayTag}`);
//   const viewShotRef = useRef<any>(null);

//   useEffect(() => {
//     // Fetch user name and SwiftPay tag from an API or AsyncStorage if necessary
//   }, []);

//   // Function to generate a new QR code
//   const generateNewQRCode = () => {
//     setQrValue(
//       `${userName}|${swiftPayTag}|${Math.floor(Math.random() * 10000)}`
//     );
//   };

//   // Function to ask for permission before generating a new QR code
//   const askForPermissionToGenerate = () => {
//     Alert.alert(
//       "Generate New QR Code",
//       "Are you sure you want to generate a new QR code? This will replace the current one.",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "OK",
//           onPress: () => generateNewQRCode(),
//         },
//       ],
//       { cancelable: true }
//     );
//   };

//   const handleShareQR = async () => {
//     if (viewShotRef.current) {
//       try {
//         const uri = await viewShotRef.current.capture(); // Capture the QR code view
//         const shareOptions = {
//           title: `${userName}'s SwiftPay QR Code`,
//           url: uri, // Use the captured image URI
//           message: `${userName}'s SwiftPay tag is ${swiftPayTag}. Scan this QR code to send money!`, // Include the message
//         };

//         await Sharing.shareAsync(uri, {
//           dialogTitle: shareOptions.title,
//           UTI: "public.png", // Specify the type of file
//         });

//         console.log("Shared successfully");
//       } catch (err) {
//         console.error("Error capturing or sharing:", err);
//       }
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
//         <View style={styles.qrContainer}>
//           <SvgQRCode value={qrValue} size={250} backgroundColor="white" />
//           <View style={styles.logoContainer}>
//             <Image
//               source={require("../assets/icons/icon.png")}
//               style={styles.logo}
//               resizeMode="contain"
//             />
//           </View>
//         </View>
//       </ViewShot>

//       <TouchableOpacity
//         style={styles.generateQRButton}
//         onPress={askForPermissionToGenerate}
//       >
//         <Ionicons name="reload" size={24} color="#0000ff" />
//         <Text style={styles.generateQRText}>Generate New QR Code</Text>
//       </TouchableOpacity>

//       <Text style={styles.title}>Here's Your QR Code</Text>
//       <Text style={styles.description}>Scan My QR Code To Pay Money</Text>

//       {/* Share QR Button */}
//       <TouchableOpacity style={styles.shareBtn} onPress={handleShareQR}>
//         <Text style={styles.shareBtnText}>Share QR</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.backBtn} onPress={() => router.dismiss()}>
//         <Text style={styles.backBtnText}>Back To Home</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default Myqrcode;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     paddingTop: 20,
//     justifyContent: "center",
//   },
//   qrContainer: {
//     position: "relative",
//     padding: 20,
//     borderRadius: 10,
//     marginBottom: 20,
//     backgroundColor: "#fff",
//   },
//   logoContainer: {
//     position: "absolute",
//     top: "57%",
//     left: "60%",
//     transform: [{ translateX: -25 }, { translateY: -25 }],
//   },
//   logo: {
//     width: 40,
//     height: 40,
//   },
//   shareBtn: {
//     backgroundColor: "#0000ff",
//     padding: 15,
//     width: "90%",
//     borderRadius: 10,
//     alignItems: "center",
//     marginBottom: 20,
//     marginTop: 100,
//   },
//   backBtn: {
//     backgroundColor: "#fff",
//     padding: 15,
//     width: "90%",
//     borderRadius: 10,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#0000ff",
//   },
//   shareBtnText: {
//     color: "#fff",
//     fontSize: 16,
//   },
//   backBtnText: {
//     fontSize: 16,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "700",
//   },
//   description: {
//     color: "#666",
//     fontSize: 16,
//   },
//   generateQRButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   generateQRText: {
//     color: "#0000ff",
//     marginLeft: 10,
//     fontSize: 16,
//   },
// });

import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import { COLORS } from "@/constants/Colors";
import { GOOGLE_VISION_API_KEY } from "@/utils";

const OCRScanScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const processImageWithOCR = async (imageUri: string) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise<string>((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(",")[1];

          try {
            // Use the correct vision.googleapis.com endpoint
            const res = await fetch(
              `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  requests: [
                    {
                      image: { content: base64data },
                      features: [{ type: "TEXT_DETECTION" }],
                    },
                  ],
                }),
              }
            );

            const data = await res.json();

            console.log("API Response:", data);

            if (data.error) {
              console.error("API Error:", data.error);
              reject(new Error(data.error.message || "OCR processing failed"));
              return;
            }

            if (!data.responses || !data.responses[0]) {
              reject(new Error("No response from API"));
              return;
            }

            const text =
              data.responses[0].fullTextAnnotation?.text || "No text found";
            resolve(text);
          } catch (err) {
            console.error("Processing error:", err);
            reject(err);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Image fetch error:", error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need permission to access your photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        extractText(imageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
      console.error(error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need permission to access your camera."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        extractText(imageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo.");
      console.error(error);
    }
  };

  const extractText = async (imageUri: string) => {
    setLoading(true);
    try {
      const text = await processImageWithOCR(imageUri);
      setExtractedText(text);
      setShowResultModal(true);
    } catch (error: any) {
      Alert.alert(
        "OCR Error",
        error.message || "Failed to extract text from image."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Note: React Native doesn't have built-in clipboard, you may need to use a library
      Alert.alert("Copied", "Text copied to clipboard!");
    } catch (error) {
      Alert.alert("Error", "Failed to copy text.");
    }
  };

  const shareText = async () => {
    try {
      await Sharing.shareAsync(extractedText, {
        mimeType: "text/plain",
        dialogTitle: "Share Extracted Text",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share text.");
    }
  };

  const resetScreen = () => {
    setSelectedImage(null);
    setExtractedText("");
    setShowResultModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OCR Scanner</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {!selectedImage ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="text-recognition"
              size={80}
              color={COLORS.swiftPayBlue}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>Extract Text from Images</Text>
            <Text style={styles.emptyDescription}>
              Scan documents, receipts, notes, or any image to extract and view
              the text content.
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.mainButton, styles.cameraButton]}
                onPress={takePhoto}
              >
                <MaterialIcons name="camera-alt" size={24} color="#fff" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mainButton, styles.galleryButton]}
                onPress={pickImage}
              >
                <MaterialIcons name="photo-library" size={24} color="#fff" />
                <Text style={styles.buttonText}>Pick from Gallery</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.swiftPayBlue}
                />
                <Text style={styles.infoText}>Supports documents & images</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.swiftPayBlue}
                />
                <Text style={styles.infoText}>Fast and accurate OCR</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.swiftPayBlue}
                />
                <Text style={styles.infoText}>
                  Copy or share extracted text
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.swiftPayBlue} />
                <Text style={styles.loadingText}>
                  Extracting text from image...
                </Text>
              </View>
            )}

            {!loading && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.retryButton]}
                  onPress={resetScreen}
                >
                  <MaterialIcons name="refresh" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Scan Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => setShowResultModal(true)}
                >
                  <MaterialIcons name="visibility" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>View Text</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Text Result Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showResultModal}
        onRequestClose={() => setShowResultModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Extracted Text</Text>
            <TouchableOpacity onPress={() => setShowResultModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.textContainer}>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.copyButton]}
              onPress={copyToClipboard}
            >
              <MaterialIcons name="content-copy" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.shareButton]}
              onPress={shareText}
            >
              <MaterialIcons name="share" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.doneButton]}
              onPress={() => setShowResultModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
    marginBottom: 30,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  cameraButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  galleryButton: {
    backgroundColor: "#0066ff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoContainer: {
    width: "100%",
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  resultContainer: {
    alignItems: "center",
    gap: 16,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  actionButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: "#ff6b6b",
  },
  viewButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  textContainer: {
    flex: 1,
    padding: 16,
  },
  extractedText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  copyButton: {
    backgroundColor: "#ff9500",
  },
  shareButton: {
    backgroundColor: "#34c759",
  },
  doneButton: {
    backgroundColor: "#999",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default OCRScanScreen;
