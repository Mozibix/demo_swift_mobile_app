import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { CheckBox } from "react-native-elements"; // or any checkbox component you prefer
import { router } from "expo-router";

const KycLevelTwo = () => {
  const [sameAsPresent, setSameAsPresent] = useState(false); // For "Same as present address" checkbox

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
          information
        </Text>

        {/* Input Fields */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>NID Number</Text>
          <TextInput
            style={styles.input}
            placeholder="NID Number"
            value="1234567890123"
            editable={false}
          />

          <Text style={styles.label}>Applicant's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Applicant's Name"
            value="Mashrafe Bin Mortaza"
            editable={false}
          />

          <Text style={styles.label}>Applicant's Father's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Applicant's Father's Name"
            value="Rahim Uddin"
            editable={false}
          />

          <Text style={styles.label}>Applicant's Mother's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Applicant's Mother's Name"
            value="Lipi Begum"
            editable={false}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="Date of Birth"
            value="02/02/1980"
            editable={false}
          />

          <Text style={styles.label}>Present Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Present Address"
            value="Boalia, Adda, Barura, Cumilla"
            editable={false}
          />

          <Text style={styles.label}>Permanent Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Permanent Address"
            value="Boalia, Adda, Barura, Cumilla"
            editable={false}
          />

          {/* Checkbox */}
          <CheckBox
            title="Same as present address"
            checked={sameAsPresent}
            onPress={() => setSameAsPresent(!sameAsPresent)}
            containerStyle={styles.checkbox}
            checkedColor="#0000ff"
          />
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomPagination}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.navigationButton}>BACK</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>2/3</Text>
          <TouchableOpacity onPress={() => router.push("/KycLevelThree")}>
            <Text style={styles.nextButton}>NEXT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    color: "#007438",
    fontWeight: "500",
  },
  inputWrapper: {
    marginVertical: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#d9d9d9",
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "#000",
  },
  checkbox: {
    backgroundColor: "transparent",
    borderWidth: 0,
    marginLeft: 0,
    paddingLeft: 0,
    marginBottom: 20,
  },
  bottomPagination: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    justifyContent: "space-between",
  },
  navigationButton: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  nextButton: {
    fontSize: 16,
    color: "#0000ff",
    fontWeight: "500",
  },
  pageIndicator: {
    fontSize: 16,
    color: "#666",
  },
  label: {
    color: "#888",
  },
});

export default KycLevelTwo;
