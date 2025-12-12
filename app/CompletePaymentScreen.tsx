import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BottomSheet } from "@rneui/themed";
import * as ImagePicker from "expo-image-picker";

const CompletePaymentScreen: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(20); // Start with 20 minutes
  const [seconds, setSeconds] = useState<number>(34); // Start with 34 seconds

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const handlePreview = () => {
    setIsPreviewVisible(true); // Show the preview bottom sheet
  };

  const handleContinue = () => {
    setIsPreviewVisible(false); // Hide the preview bottom sheet
    setIsSuccessVisible(true); // Show the success bottom sheet
  };

  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    // Set up a timer that runs every second
    const timer = setInterval(() => {
      if (seconds > 0) {
        setSeconds((prevSeconds) => prevSeconds - 1);
      } else if (minutes > 0) {
        setMinutes((prevMinutes) => prevMinutes - 1);
        setSeconds(59);
      }
    }, 1000);

    // Clear the timer when the component is unmounted or minutes and seconds reach zero
    return () => clearInterval(timer);
  }, [minutes, seconds]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Complete Payment</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Timer */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Complete Payment Within:</Text>
          <View style={styles.timer}>
            <Text style={styles.timerBox}>
              {String(minutes).padStart(2, "0")}
            </Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.timerBox}>
              {String(seconds).padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.dotContainer}>
            <View style={styles.dot}></View>
            <Text style={styles.instructionText}>
              Please transfer Asset to the address below or scan the QR code to
              make payment.
            </Text>
          </View>

          <View style={styles.dotContainer}>
            <View style={styles.dot}></View>
            <Text style={styles.instructionText}>
              After you transfer, please ensure you fill in the transaction info
              for your payment to help us confirm your order.
            </Text>
          </View>

          <View style={styles.dotContainer}>
            <View style={styles.dot}></View>
            <Text style={styles.instructionText}>
              Note: This order will be automatically cancelled if the button is
              not clicked by the deadline.
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetailsContainer}>
          <Text style={styles.headTitle}>Sell BTC</Text>
          <DetailRow
            label="Price"
            value="1,234,457.897 NGN"
            valueStyle={styles.paymentValue}
          />
          <DetailRow label="Amount" value="0.9 BTC" />
          <DetailRow label="Amount to pay (USDT)" value="$4,678" />
          <DetailRow label="Asset Quantity" value="0.895967456 BTC" />
          <DetailRow label="Transaction Fee" value="$2.76" />
          <View style={styles.orderNo}>
            <Text>Order No.</Text>
            <View style={{ flexDirection: "row", gap: 5 }}>
              <Text>1234567890123456</Text>
              <AntDesign name="copy1" size={15} />
            </View>
          </View>
          <DetailRow label="Order Time" value="2024-09-06 12:34:45" />
        </View>

        {/* Transaction Details Inputs */}
        <View style={styles.transactionDetailsContainer}>
          <Text style={styles.label}> Transaction Information</Text>
          <View style={styles.TransactionDetails}>
            <View style={styles.flex}>
              <Text style={styles.trnlabel}>Account Name</Text>
              <Text style={styles.trnValue}>SwiftPay Ent.</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.trnlabel}>Bank Name</Text>
              <Text style={styles.trnValue}>Chase Bank</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.trnlabel}>Account Number</Text>
              <Text style={styles.trnValue}>095674788</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Transaction Details</Text>

          <InputField
            label="Account Name"
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder=""
          />
          <InputField
            label="Account Numbetr"
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder=""
          />
          <InputField
            label="Bank Name"
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder=""
          />
          <InputField
            label="Date & Time"
            value={dateTime}
            onChangeText={setDateTime}
            placeholder="2024-03-26"
          />
          <Text style={styles.uploadLabel}>
            Screenshot of successful transfer
          </Text>

          <View style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Image</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Text style={styles.uploadBtnText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.uploadFormat}>
            <Text style={styles.uploadFormatText}>Max size: 10MB</Text>
            <Text style={styles.uploadFormatText}>Format: JPEG, PNG</Text>
          </View>
        </View>

        <View style={styles.imageContainer}>
          {image && <Image source={{ uri: image }} style={styles.image} />}
        </View>

        {/* Sell Button */}
      </ScrollView>
      <TouchableOpacity style={styles.sellButton} onPress={handlePreview}>
        <Text style={styles.sellButtonText}>Sell</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      {/* Bottom Sheet for Preview */}
      <BottomSheet
        isVisible={isPreviewVisible}
        onBackdropPress={() => setIsPreviewVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <TouchableOpacity onPress={() => setIsSuccessVisible(false)}>
            <AntDesign
              name="closecircleo"
              size={20}
              color={"red"}
              style={styles.icon}
            />
          </TouchableOpacity>
          <Image
            source={require("../assets/icons/success.png")}
            style={styles.logo}
          />

          <Text style={styles.successBottomSheetHeaderP}>
            Your order has been completed
          </Text>
          <View style={styles.successBottomSheetContainer}>
            <Text style={styles.subText}>Sell USDT</Text>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Amount</Text>
              <Text style={styles.successBottomSheetTextgreen}>
                34,869.97 NGN
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Price</Text>
              <Text style={styles.successBottomSheetText}>1568.00 NGN</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Total Quantity</Text>
              <Text style={styles.successBottomSheetText}>12.0000 USDT</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>
                Transaction fees
              </Text>
              <Text style={styles.successBottomSheetText}>$1.76</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Order No.</Text>
              <Text style={styles.successBottomSheetText}>
                12345678908765 <AntDesign name="copy1" />
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Order time</Text>
              <Text style={styles.successBottomSheetText}>
                2024-03-26 17:23:45 <AntDesign name="copy1" />
              </Text>
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Bottom Sheet for Success */}
      <BottomSheet
        isVisible={isSuccessVisible}
        onBackdropPress={() => setIsSuccessVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <TouchableOpacity onPress={() => setIsSuccessVisible(false)}>
            <AntDesign
              name="closecircleo"
              size={20}
              color={"red"}
              style={styles.icon}
            />
          </TouchableOpacity>
          <Image
            source={require("../assets/icons/cancel-icon.png")}
            style={styles.logo}
          />

          <Text style={styles.successBottomSheetHeader}>
            Your order has been cancelled
          </Text>
          <Text style={styles.reason}>Reason: Delayed Transaction</Text>
          <View style={styles.successBottomSheetContainer}>
            <Text style={styles.subText}>Sell USDT</Text>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Amount</Text>
              <Text style={styles.successBottomSheetTextgreen}>
                34,869.97 NGN
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Price</Text>
              <Text style={styles.successBottomSheetText}>1568.00 NGN</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Total Quantity</Text>
              <Text style={styles.successBottomSheetText}>12.0000 USDT</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>
                Transaction fees
              </Text>
              <Text style={styles.successBottomSheetText}>$1.76</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Order No.</Text>
              <Text style={styles.successBottomSheetText}>
                12345678908765 <AntDesign name="copy1" />
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.successBottomSheetText}>Order time</Text>
              <Text style={styles.successBottomSheetText}>
                2024-03-26 17:23:45
              </Text>
            </View>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  valueStyle?: any;
  isQrCode?: boolean;
}> = ({ label, value, valueStyle, isQrCode }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <View style={styles.detailValueContainer}>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
      {isQrCode && <Ionicons name="qr-code" size={24} color="#000" />}
    </View>
  </View>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}> = ({ label, value, onChangeText, placeholder }) => (
  <View style={styles.inputFieldContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#999"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 10,
    backgroundColor: "#fff",
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
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    gap: 10,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  timerBox: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#0000ff",
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    paddingHorizontal: 10,
  },
  colon: {
    fontSize: 18,
    fontWeight: "bold",
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  paymentDetailsContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FDFDFD",
  },
  headTitle: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: "#000",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00952A",
  },
  transactionDetailsContainer: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
  },
  inputFieldContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: "#000",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  uploadLabel: {
    fontSize: 14,
    color: "#000",
    marginBottom: 5,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 5,
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#888",
  },
  uploadBtn: {
    backgroundColor: "#B4BBC3",
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  uploadBtnText: {
    color: "#fff",
  },
  uploadFormatText: {
    fontSize: 13,
    color: "#4B40C3",
    marginBottom: 5,
    fontWeight: "400",
  },
  sellButton: {
    backgroundColor: "#0000ff",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  sellButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  dotContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
  },
  dot: {
    backgroundColor: "#666",
    width: 7,
    height: 7,
    borderRadius: 50,
    top: -10,
  },
  orderNo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletContainer: {
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    padding: 15,
    borderRadius: 10,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  addressContainer: {
    flexDirection: "row",
    gap: 5,
  },
  label: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 5,
  },
  address: {
    color: "#777",
    fontSize: 16,
  },
  uploadFormat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "500",
    left: 100,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
  },
  successBottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  successBottomSheetTextgreen: {
    fontSize: 16,
    marginBottom: 10,
    alignItems: "center",
    color: "#00952A",
    fontWeight: "700",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  icon: {
    alignSelf: "flex-end",
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  successBottomSheetHeaderP: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  successBottomSheetContainer: {
    borderWidth: 1,
    padding: 10,
    borderColor: "#ddd",
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
  },
  subText: {
    fontWeight: "700",
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  reason: {
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  image: {
    width: "100%", // Full width of the container
    height: 40, // Fixed height
    resizeMode: "cover", // Or 'contain', depending on your preference
    borderRadius: 5,
    marginTop: -20,
  },
  imageContainer: {
    alignItems: "center",
    width: "100%", // Ensure the container is full width
    height: 20,
    marginBottom: "5%",
  },
  cancelText: {
    textAlign: "center",
    fontSize: 16,
    color: "#0000ff",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 20,
  },
  TransactionDetails: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#DFF1FC",
  },
  trnlabel: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  trnValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
});

export default CompletePaymentScreen;
