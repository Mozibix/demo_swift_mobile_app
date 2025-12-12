import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { BottomSheet } from "@rneui/themed";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { COLORS } from "@/constants/Colors";

interface PinEntryBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  isProcessing: boolean;
}

const PinEntryBottomSheet: React.FC<PinEntryBottomSheetProps> = ({
  isVisible,
  onClose,
  onConfirm,
  isProcessing,
}) => {
  const [otp, setOtp] = React.useState(["", "", "", ""]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (isVisible) {
      setOtp(["", "", "", ""]);
      setActiveIndex(0); // Reset to first input when opened
    }
  }, [isVisible]);

  const handleKeypadPress = (key: string) => {
    if (key === "←") {
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        const lastFilledIndex = newOtp.findIndex((digit) => digit === "");
        const indexToClear =
          lastFilledIndex === -1 ? newOtp.length - 1 : lastFilledIndex - 1;
        if (indexToClear >= 0) {
          newOtp[indexToClear] = "";
          setActiveIndex(indexToClear);
        }
        return newOtp;
      });
    } else if (otp.join("").length < 4) {
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        const firstEmptyIndex = newOtp.findIndex((digit) => digit === "");
        if (firstEmptyIndex !== -1) {
          newOtp[firstEmptyIndex] = key;
          const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
          setActiveIndex(nextEmptyIndex !== -1 ? nextEmptyIndex : 3);
        }
        return newOtp;
      });
    }
  };

  React.useEffect(() => {
    if (otp.join("").length === 4) {
      const pin = otp.join("");
      onConfirm(pin);
    }
  }, [otp]);

  const handleBiometricAuthentication = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Toast.show({
          type: "error",
          text1: "Biometric Authentication",
          text2: "Biometric authentication is not available on this device.",
          position: "top",
        });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to complete payment",
        fallbackLabel: "Enter PIN",
      });

      if (result.success) {
        const biometricPin = "1234";
        onConfirm(biometricPin);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: "Biometric authentication failed. Please try again.",
          position: "top",
        });
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred during biometric authentication.",
        position: "top",
      });
    }
  };

  return (
    <BottomSheet isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.bottomSheetContent}>
        <Text style={styles.successBottomSheetHeader}>Enter Payment Pin</Text>

        {/* <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpInput}>
              <Text style={styles.otpText}>{digit}</Text>
            </View>
          ))}
        </View> */}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpInput,
                index === activeIndex ? styles.activeOtpInput : null,
              ]}
            >
              <Text style={styles.otpText}>{digit}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: 150,
            alignSelf: "center",
            alignContent: "center",
            marginBottom: 25,
          }}
        >
          <Text style={styles.desc}>Forgot Payment Pin?</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: "#f0f0f0" }}>
          <View>
            <Text
              style={{
                paddingVertical: 10,
                textAlign: "center",
                color: "#888",
                fontSize: 15,
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={20}
                color={COLORS.swiftPayBlue}
              />{" "}
              Swiftpay Secure Numeric Keypad
            </Text>
          </View>
          <View style={styles.keypadContainer}>
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "fingerprint",
              "0",
              "←",
            ].map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.keypadButton}
                onPress={() =>
                  key === "fingerprint"
                    ? handleBiometricAuthentication()
                    : handleKeypadPress(key)
                }
              >
                {key === "fingerprint" ? (
                  <MaterialIcons name="fingerprint" size={20} color="#000" />
                ) : (
                  <Text style={styles.keypadButtonText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <Toast />
    </BottomSheet>
  );
};

export default PinEntryBottomSheet;

const styles = StyleSheet.create({
  bottomSheetContent: {
    paddingTop: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 5,
    paddingTop: 10,
    textAlign: "center",
    alignSelf: "center",
    color: "#0000ff",
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 35,
    marginTop: 10,
  },
  desc: {
    textAlign: "center",
    color: "#0000ff",
    fontWeight: "600",
    fontSize: 14,
  },
  otpContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 15,
    alignSelf: "center",
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  activeOtpInput: {
    borderColor: "#0000ff",
    borderWidth: 2,
  },
  otpText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  keypadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  keypadButton: {
    paddingHorizontal: 44,
    height: 50,
    margin: 3,
    borderRadius: 5,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  keypadButtonText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  biometricButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 10,
  },
  biometricButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
});

// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   TextInput,
// } from "react-native";
// import * as LocalAuthentication from "expo-local-authentication";
// import { BottomSheet } from "@rneui/themed";

// interface PinEntryBottomSheetProps {
//   isVisible: boolean;
//   onClose: () => void;
//   onConfirm: (pin: string) => void;
//   isProcessing: boolean;
// }

// const PinEntryBottomSheet: React.FC<PinEntryBottomSheetProps> = ({
//   isVisible,
//   onClose,
//   onConfirm,
//   isProcessing,
// }) => {
//   const [otp, setOtp] = React.useState(["", "", "", ""]);

//   const handleKeypadPress = (key: string) => {
//     if (key === "←") {
//       const newOtp = [...otp];
//       const lastFilledIndex = newOtp.findIndex((digit) => digit === "");
//       const indexToClear =
//         lastFilledIndex === -1 ? newOtp.length - 1 : lastFilledIndex - 1;
//       if (indexToClear >= 0) {
//         newOtp[indexToClear] = "";
//         setOtp(newOtp);
//       }
//     } else if (otp.join("").length < 4) {
//       const newOtp = [...otp];
//       const firstEmptyIndex = newOtp.findIndex((digit) => digit === "");
//       if (firstEmptyIndex !== -1) {
//         newOtp[firstEmptyIndex] = key;
//         setOtp(newOtp);
//       }
//     }
//   };

//   const handleConfirm = () => {
//     const pin = otp.join("");
//     if (pin.length === 4) {
//       onConfirm(pin);
//     }
//   };

//   const handleBiometricAuthentication = async () => {
//     try {
//       // For Expo
//       const hasHardware = await LocalAuthentication.hasHardwareAsync();
//       const isEnrolled = await LocalAuthentication.isEnrolledAsync();

//       if (!hasHardware || !isEnrolled) {
//         Alert.alert("Biometric Authentication", "Biometric authentication is not available on this device.");
//         return;
//       }

//       const result = await LocalAuthentication.authenticateAsync({
//         promptMessage: "Authenticate to complete payment",
//         fallbackLabel: "Enter PIN",
//       });

//       if (result.success) {
//         Alert.alert("Success", "Biometric authentication successful!");
//         activeTab === "Airtime" ? processPurchase() : processDataPurchase();
//       } else {
//         Alert.alert("Failed", "Biometric authentication failed. Please try again.");
//       }

//       // For Bare React Native (react-native-fingerprint-scanner)
//       // FingerprintScanner.authenticate({
//       //   description: "Authenticate to complete payment",
//       // })
//       //   .then(() => {
//       //     Alert.alert("Success", "Biometric authentication successful!");
//       //     activeTab === "Airtime" ? processPurchase() : processDataPurchase();
//       //   })
//       //   .catch((error) => {
//       //     Alert.alert("Failed", error.message || "Biometric authentication failed.");
//       //   });
//     } catch (error) {
//       console.error("Biometric authentication error:", error);
//       Alert.alert("Error", "An error occurred during biometric authentication.");
//     }
//   };

//   return (
//     <BottomSheet isVisible={isVisible} onBackdropPress={onClose}>
//       <View style={styles.bottomSheetContent}>
//     <View style={styles.bottomSheetHeader}>
//       <Text style={styles.bottomSheetTitle}>Complete Payment</Text>
//     </View>
//     <Text style={styles.successBottomSheetHeader}>Enter Pin</Text>
//     <Text style={styles.desc}>Enter pin or use biometric to complete the transaction</Text>

//     {/* OTP Display */}
//     <View style={styles.otpContainer}>
//       {otp.map((digit, index) => (
//         <View key={index} style={styles.otpInput}>
//           <Text style={styles.otpText}>{digit}</Text>
//         </View>
//       ))}
//     </View>

//     {/* Custom Keypad */}
//     <View style={styles.keypadContainer}>
//       {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "←"].map((key) => (
//         <TouchableOpacity
//           key={key}
//           style={styles.keypadButton}
//           onPress={() => handleKeypadPress(key)}
//         >
//           <Text style={styles.keypadButtonText}>{key}</Text>
//         </TouchableOpacity>
//       ))}
//     </View>

//     {/* Confirm Button */}
//     <TouchableOpacity
//       style={styles.nextButton}
//       onPress={
//         activeTab === "Airtime" ? processPurchase : processDataPurchase
//       }
//       disabled={isProcessingPaymentMutation}
//     >
//       <Text style={styles.nextButtonText}>
//         {isProcessingPaymentMutation ? "Processing..." : "Confirm Payment"}
//       </Text>
//     </TouchableOpacity>

//     {/* Biometric Button */}
//     <TouchableOpacity
//       style={styles.biometricButton}
//       onPress={handleBiometricAuthentication}
//     >
//       <AntDesign name="fingerprint" size={24} color="#fff" />
//       <Text style={styles.biometricButtonText}>Use Fingerprint</Text>
//     </TouchableOpacity>
//   </View>
//     </BottomSheet>
//   );
// };

// export default PinEntryBottomSheet;

// const styles = StyleSheet.create({
//   bottomSheetContent: {
//     padding: 20,
//     backgroundColor: "white",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   bottomSheetHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 10,
//   },
//   bottomSheetTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     marginBottom: 5,
//     paddingTop: 10,
//     textAlign: "center",
//     alignSelf: "center",
//     color: "#0000ff",
//   },
//   successBottomSheetHeader: {
//     fontSize: 18,
//     fontWeight: "700",
//     textAlign: "center",
//     marginBottom: 5,
//   },
//   desc: {
//     textAlign: "center",
//     color: "#888",
//     fontSize: 14,
//     marginBottom: 20,
//   },
//   otpContainer: {
//     flexDirection: "row",
//     marginBottom: 30,
//     gap: 15,
//     alignSelf: "center",
//   },
//   otpInput: {
//     width: 50,
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#999",
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   otpText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#000",
//   },
//   keypadContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//     gap: 3,
//     marginVertical: 20,
//     backgroundColor: "#f0f0f0",
//   },
//   keypadButton: {
//     paddingHorizontal: 44,
//     height: 50,
//     margin: 3,
//     borderRadius: 5,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 1,
//   },
//   keypadButtonText: {
//     fontSize: 22,
//     fontWeight: "600",
//     color: "#000",
//   },
//   nextButton: {
//     backgroundColor: "#0000ff",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 20,
//   },
//   nextButtonText: {
//     color: "#fff",
//     fontSize: 18,
//   },
//   biometricButton: {
//     backgroundColor: "#0000ff",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 20,
//     gap: 10,
//   },
//   biometricButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "500",
//   },
// });
