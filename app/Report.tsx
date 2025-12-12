import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  TextInput,
} from "react-native";
import {
  AntDesign,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons"; // For icons
import { router } from "expo-router";
import { BottomSheet } from "@rneui/themed";

const Report = () => {
  const [selectedTab, setSelectedTab] = useState(0); // 0: Issue Type, 1: Question Type, 2: Feedback
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false); // State for bottom sheet visibility
  const [isChecked, setChecked] = useState(false); // State for checkbox
  const [description, setDescription] = useState(""); // State for the description input

  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  // Dummy data for each tab content
  const issueTypes = [
    "Deposit",
    "Transfer to bank account",
    "Transfer to swiftpay account",
    "TV & Internet",
    "Data & Airtime",
    "Transfer to Multiple Accounts",
  ];
  const questionTypes = [
    "Successful but did not drop",
    "Failed but no refund",
    "Pending for a long time",
    "Failed transaction but debited",
    "Deposit but not reflecting",
    "Others",
  ];
  const feedbackTypes = ["Feedback 1", "Feedback 2", "Feedback 3"];

  const handleItemSelect = (item: string) => {
    if (item === "Others") {
      setBottomSheetVisible(true); // Show the bottom sheet if "Others" is selected
    } else if (selectedTab < 2) {
      setSelectedTab(selectedTab + 1); // Move to the next tab
    }
  };

  // Function to render list items and navigate to the next tab on selection
  const renderListItem = (
    item:
      | string
      | number
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | Iterable<React.ReactNode>
      | null
      | undefined
  ) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleItemSelect(item as string)}
    >
      <Text style={styles.listItemText}>{item}</Text>
      <FontAwesome name="chevron-right" size={16} color="#BDBDBD" />
    </TouchableOpacity>
  );

  const toggleCheckbox = () => setChecked(!isChecked); // Toggle checkbox state

  const handlePay = () => {
    setBottomSheetVisible(false); // Handle payment logic and close bottom sheet
  };

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    // Set OTP value at the current index
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to the next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      // Move to the previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleConfirmPayment = () => {
    setIsTransactionPinVisible(false); // Hide the transaction pin bottom sheet
    setIsSuccessVisible(true); // Show the success bottom sheet
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Report Issue</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {/* Tab Buttons */}
        <View
          style={[
            styles.tabButton,
            selectedTab === 0 && styles.tabButtonActive,
          ]}
        >
          <FontAwesome
            name="check-circle"
            size={16}
            color={selectedTab === 0 ? "#00C853" : "#BDBDBD"}
          />
          <Text style={styles.tabText}>Select Issue</Text>
          <Text style={styles.tabText}>Type</Text>
        </View>
        <View
          style={[
            styles.tabButton,
            selectedTab === 1 && styles.tabButtonActive,
          ]}
        >
          <FontAwesome
            name="check-circle"
            size={16}
            color={selectedTab === 1 ? "#00C853" : "#BDBDBD"}
          />
          <Text style={styles.tabText}>Select Question</Text>
          <Text style={styles.tabText}>Type</Text>
        </View>
        <View
          style={[
            styles.tabButton,
            selectedTab === 2 && styles.tabButtonActive,
          ]}
        >
          <FontAwesome
            name="check-circle"
            size={16}
            color={selectedTab === 2 ? "#00C853" : "#BDBDBD"}
          />
          <Text style={styles.tabText}>Feedback</Text>
        </View>
      </View>

      {/* Content for Each Tab */}
      <View style={styles.contentContainer}>
        {selectedTab === 0 && (
          <FlatList
            data={issueTypes}
            renderItem={({ item }) => renderListItem(item)}
            keyExtractor={(item) => item}
          />
        )}
        {selectedTab === 1 && (
          <FlatList
            data={questionTypes}
            renderItem={({ item }) => renderListItem(item)}
            keyExtractor={(item) => item}
          />
        )}
        {selectedTab === 2 && (
          // Custom content for the Feedback tab
          <View>
            <Text style={styles.label}>
              Transaction Number{" "}
              <MaterialCommunityIcons size={10} name="asterisk" color={"red"} />
            </Text>
            <TextInput placeholder="627565265OTJH0HF" style={styles.input} />

            <Text style={styles.label}>
              Upload Photo{" "}
              <MaterialCommunityIcons size={10} name="asterisk" color={"red"} />
            </Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.balanceContainer}>
                <Text style={styles.uploadText}>Click here to upload</Text>
              </TouchableOpacity>
              <TextInput style={styles.inputQuantity} />
            </View>
            <View style={styles.noteContainer}>
              <AntDesign
                name="exclamationcircleo"
                size={15}
                color={"#0000ff"}
              />
              <Text style={styles.note}>
                Note: not more than 3 photos. JPEG, PNG 5MB Max.
              </Text>
            </View>

            <Text style={styles.label}>
              Description{" "}
              <MaterialCommunityIcons size={10} name="asterisk" color={"red"} />{" "}
            </Text>
            <TextInput
              style={styles.description}
              placeholder="Provide your feedback here..."
              value={description}
              onChangeText={(text) => setDescription(text)}
              multiline={true}
            />
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleConfirmPayment}
            >
              <Text style={styles.nextButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        isVisible={isBottomSheetVisible}
        onBackdropPress={() => setBottomSheetVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Enter Other Reasons</Text>
          </View>
          <Text style={styles.reasonHeader}>Reasons</Text>

          <View style={styles.otpContainer}>
            <TextInput
              placeholder="This are my reasons that are..."
              style={styles.description}
            />
          </View>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              setBottomSheetVisible(false); // Hide the bottom sheet
              setSelectedTab(2); // Navigate to the next tab
            }}
          >
            <Text style={styles.nextButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

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
            Report Sent Successfully
          </Text>
          <Text style={styles.desc}>
            Your report has been submitted successfully and under review.
          </Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.dismissAll()}
          >
            <Text style={styles.nextButtonText}>Go back to home</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eee",
  },
  tabButton: {
    flexDirection: "column",
    alignItems: "center",
    padding: 10,
  },
  tabButtonActive: {
    borderRadius: 10,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#757575",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  listItemText: {
    fontSize: 16,
    color: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 40,
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
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    left: 96,
    marginBottom: 10,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
  },
  successBottomSheetText: {
    fontSize: 14,
    marginBottom: 20,
    alignItems: "center",
    fontWeight: "600",
  },
  successBottomSheetTextLabel: {
    fontSize: 14,
    marginBottom: 20,
    alignItems: "center",
    color: "#666",
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
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  successBottomSheetHeader: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 5,
  },
  reasonHeader: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
    marginBottom: 5,
  },
  successBottomSheetHeaderP: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  successBottomSheetContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  otpContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 15,
    alignSelf: "center",
  },
  otpInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#999", // Success green color for the border
    borderRadius: 8,
    textAlign: "left",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
    textAlignVertical: "top",
  },
  description: {
    height: 120, // Adjust height as needed
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: "left", // Align text to the left
    textAlignVertical: "top", // Align text to the top
    width: "100%",
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 10,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    paddingHorizontal: 10,
    padding: 8,
    borderColor: "#eee",
    borderRadius: 10,
  },
  inputQuantity: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 20,
    gap: 15,
    borderRadius: 15,
    padding: 8,
  },
  balanceContainer: {
    backgroundColor: "#E5F6FF",
    paddingHorizontal: 10,
    padding: 7,
    borderRadius: 15,
  },
  uploadText: {
    color: "#666",
    fontSize: 13,
  },
  note: {
    fontSize: 12,
    color: "#0000ff",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    alignItems: "center",
    marginBottom: 5,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
  },
});

export default Report;
