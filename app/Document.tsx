import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
// import CountryPicker, { CountryCode } from "react-native-country-picker-modal";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const Document = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>("Nigeria");
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  // const [countryCode, setCountryCode] = useState<CountryCode>("NG"); // Properly typed countryCode
  const [isPickerVisible, setPickerVisible] = useState(false); // Control visibility of picker

  const navigation = useNavigation();

  const documentTypes = [
    "National ID (Slip)",
    "National ID (NIN)",
    "Voters ID",
    "Virtual NIN",
    "Driver's License",
    "International Passport",
  ];

  const handleDocumentSelect = (document: string) => {
    setSelectedDocument(document);
  };

  const handleContinue = () => {
    // Handle navigation or validation here
    router.push("/KycLevelOne"); // Replace 'NextScreen' with actual screen
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
        <Text style={styles.headerText}>Document type</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Select Document type</Text>
        <Text style={styles.description}>
          If you can’t find your document type or country of issue, contact
          support.
        </Text>

        {/* Country Selector */}
        <Text style={styles.subLabel}>
          Select country where your ID document was issued.
        </Text>
        <TouchableOpacity
          style={styles.countrySelect}
          onPress={() => setPickerVisible(true)}
        >
          {/* <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCountryNameButton
            withAlphaFilter
            onSelect={(country) => {
              setCountryCode(country.cca2);
              // Check if country.name is a string
              if (typeof country.name === "string") {
                setSelectedCountry(country.name);
              }
            }}
            visible={isPickerVisible}
            onClose={() => setPickerVisible(false)}
          /> */}
        </TouchableOpacity>

        {/* Document Type Buttons */}
        <Text style={styles.subLabel}>
          Click any below to select document type
        </Text>
        {documentTypes.map((document, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.documentButton,
              selectedDocument === document && styles.selectedButton,
            ]}
            onPress={() => handleDocumentSelect(document)}
          >
            <Text style={styles.documentButtonText}>{document}</Text>
          </TouchableOpacity>
        ))}

        {/* Footer Text */}
        <Text style={styles.footerText}>
          On clicking continue, you will be prompted to use your camera, capture
          a selfie of yourself and to provide your govt. issued ID for account
          verification.
        </Text>
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedDocument && styles.disabledButton,
        ]}
        disabled={!selectedDocument}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  content: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  description: {
    fontSize: 15,
    color: "#808080",
    marginBottom: 20,
  },
  subLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
  },
  countrySelect: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  countryText: {
    fontSize: 16,
    marginLeft: 10,
  },
  documentButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#C7E3FF",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#F1F8FF",
  },
  selectedButton: {
    backgroundColor: "#E0E0E0",
  },
  documentButtonText: {
    fontSize: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#808080",
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: "#0000FF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#C0C0C0",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  },
});

export default Document;
