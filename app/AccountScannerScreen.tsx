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
  FlatList,
  useWindowDimensions,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { COLORS } from "@/constants/Colors";
import { GOOGLE_VISION_API_KEY } from "@/utils";

interface BankAccount {
  bankName: string;
  accountNumber: string;
}

interface ScannedAccount extends BankAccount {
  id: string;
  selected: boolean;
}

const AccountScannerScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedAccounts, setScannedAccounts] = useState<ScannedAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<BankAccount[]>([]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editedBankName, setEditedBankName] = useState<string>("");
  const [editedAccountNumber, setEditedAccountNumber] = useState<string>(""); //

  const parseAccountsFromText = (text: string): ScannedAccount[] => {
    const accounts: ScannedAccount[] = [];

    const bankPatterns = [
      {
        regex: /gtb|guaranty trust|guaranty trust bank|gt bank|gtb nigeria/gi,
        name: "Guaranty Trust Bank",
      },
      {
        regex: /access bank|accessbank|accessbank nigeria/gi,
        name: "Access Bank",
      },
      {
        regex: /first bank|first city monument bank|fcmb|first city bank/gi,
        name: "First Bank / FCMB",
      },
      { regex: /zenith|zenith bank|zenithbank/gi, name: "Zenith Bank" },
      {
        regex: /stanbic|stanbic ibtc|stanbic ibtc bank|stanbic bank/gi,
        name: "Stanbic IBTC",
      },
      {
        regex: /uba|united bank|united bank for africa|uba bank/gi,
        name: "UBA",
      },
      { regex: /wema bank/gi, name: "Wema Bank" },
      { regex: /sterling bank/gi, name: "Sterling Bank" },
      { regex: /fidelity bank/gi, name: "Fidelity Bank" },
      {
        regex: /diamond bank|access diamond bank|diamondbank/gi,
        name: "Diamond Bank (Now Access Bank)",
      },
      {
        regex: /moniepoint|monie point|monie-point|moncepoint/gi,
        name: "Moniepoint",
      },
      { regex: /opay|o-pay|opay nigeria/gi, name: "OPay" },
      { regex: /paga|paga app|paga nigeria/gi, name: "Paga" },
      { regex: /flutterwave|flutterwave.com/gi, name: "Flutterwave" },
      { regex: /paystack|paystack.com/gi, name: "Paystack" },
      { regex: /interswitch|interswitch nigeria/gi, name: "Interswitch" },
      { regex: /kuda|kuda bank/gi, name: "Kuda Bank" },
      {
        regex: /carbon|paylater|carbon app/gi,
        name: "Carbon (formerly Paylater)",
      },
      { regex: /eco bank|ecobank/gi, name: "EcoBank" },
      { regex: /jaiz bank|jaizbank/gi, name: "Jaiz Bank" },
      { regex: /polaris bank|polarisbank/gi, name: "Polaris Bank" },
      {
        regex: /union bank|union bank of nigeria/gi,
        name: "Union Bank of Nigeria",
      },
      { regex: /skye bank|skyebank/gi, name: "Skye Bank (Now Polaris)" },
      { regex: /globus bank/gi, name: "Globus Bank" },
      {
        regex: /first national bank|fnb|first national bank nigeria/gi,
        name: "First National Bank (FNB)",
      },
      {
        regex: /new development bank|brics bank/gi,
        name: "New Development Bank (BRICS)",
      },
      { regex: /bank of africa|bankofafrica/gi, name: "Bank of Africa" },
      { regex: /momo|momo money|momo by mtn/gi, name: "Momo (by MTN)" },
      { regex: /xpress money/gi, name: "Xpress Money" },
      { regex: /remita/gi, name: "Remita" },
      { regex: /finca microfinance/gi, name: "FINCA Microfinance" },
      { regex: /small world/gi, name: "Small World Financial Services" },
      { regex: /payoneer/gi, name: "Payoneer" },
      { regex: /worldpay/gi, name: "Worldpay" },
      { regex: /lendingtree/gi, name: "LendingTree" },
      {
        regex: /commercial bank of africa|cba/gi,
        name: "Commercial Bank of Africa (CBA)",
      },
      { regex: /absa group|absa bank/gi, name: "Absa Group" },
      { regex: /bank of china/gi, name: "Bank of China" },
      { regex: /bank of america/gi, name: "Bank of America" },
      { regex: /hsbc/gi, name: "HSBC" },
      {
        regex: /standard chartered|standard chartered bank/gi,
        name: "Standard Chartered",
      },
      { regex: /barclays/gi, name: "Barclays Bank" },
      { regex: /wells fargo/gi, name: "Wells Fargo" },
      {
        regex: /commercial bank of nigeria|cbn/gi,
        name: "Commercial Bank of Nigeria",
      },
      { regex: /china construction bank/gi, name: "China Construction Bank" },
      {
        regex: /nnpc|nigerian national petroleum corporation/gi,
        name: "NNPC - Nigerian National Petroleum Corporation",
      },
      { regex: /state bank of india|sbi/gi, name: "State Bank of India" },
      {
        regex: /central bank of nigeria|cbn/gi,
        name: "Central Bank of Nigeria (CBN)",
      },
      {
        regex: /nigerian export-import bank|nexim bank/gi,
        name: "Nigerian Export-Import Bank (NEXIM)",
      },
      { regex: /trust bank/gi, name: "Trust Bank" },
    ];

    const accountRegex = /\b\d{10}\b/g;
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const accountMatches = text.match(accountRegex) || [];
    if (accountMatches.length === 0) {
      return [];
    }

    let currentBank = "Unknown Bank";

    lines.forEach((line, index) => {
      for (const pattern of bankPatterns) {
        if (pattern.regex.test(line)) {
          currentBank = pattern.name;
          break;
        }
      }

      const match = line.match(accountRegex);
      if (match) {
        accounts.push({
          id: `${Date.now()}-${index}`,
          bankName: currentBank,
          accountNumber: match[0],
          selected: false,
        });
      }
    });

    return accounts;
  };

  const processImageWithOCR = async (imageUri: string) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise<string>((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(",")[1];

          try {
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

            if (data.error) {
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
            reject(err);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
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
    }
  };

  const extractText = async (imageUri: string) => {
    setLoading(true);
    try {
      const text = await processImageWithOCR(imageUri);

      const accounts = parseAccountsFromText(text);

      if (accounts.length === 0) {
        Alert.alert(
          "No Accounts Found",
          "Could not detect any account numbers in the image."
        );
        setSelectedImage(null);
        setLoading(false);
        return;
      }

      setScannedAccounts(accounts);
      setShowBottomSheet(true);
    } catch (error: any) {
      Alert.alert(
        "OCR Error",
        error.message || "Failed to extract text from image."
      );
      setSelectedImage(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setScannedAccounts((prevAccounts) =>
      prevAccounts.map((account) => {
        if (account.id === accountId) {
          const isNowSelected = !account.selected;

          if (isNowSelected) {
            setSelectedAccounts((prev) => [
              ...prev,
              {
                bankName: account.bankName,
                accountNumber: account.accountNumber,
              },
            ]);
          } else {
            setSelectedAccounts((prev) =>
              prev.filter((a) => a.accountNumber !== account.accountNumber)
            );
          }

          return { ...account, selected: !account.selected };
        }
        return account;
      })
    );
  };

  const handleConfirmSelection = () => {
    if (selectedAccounts.length === 0) {
      Alert.alert("No Selection", "Please select at least one account.");
      return;
    }

    setShowBottomSheet(false);

    if (selectedAccounts.length === 1) {
      router.push({
        pathname: "/SingleBankTransfer",
        params: {
          account: JSON.stringify(selectedAccounts[0]),
        },
      });
    } else {
      router.push({
        pathname: "/MultipleBankTransfer",
        params: {
          accounts: JSON.stringify(selectedAccounts),
        },
      });
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setScannedAccounts([]);
    setSelectedAccounts([]);
    setShowBottomSheet(false);
  };

  const handleEditChange = (field: string, value: string) => {
    if (field === "bankName") {
      setEditedBankName(value);
    } else if (field === "accountNumber") {
      setEditedAccountNumber(value);
    }
  };

  const handleSaveEdit = (accountId: string) => {
    setScannedAccounts((prevAccounts) =>
      prevAccounts.map((account) => {
        if (account.id === accountId) {
          return {
            ...account,
            bankName: editedBankName || account.bankName,
            accountNumber: editedAccountNumber || account.accountNumber,
          };
        }
        return account;
      })
    );
    setEditingAccountId(null);
  };

  const renderAccountItem = ({ item }: { item: ScannedAccount }) => (
    <TouchableOpacity
      style={[styles.accountItem, item.selected && styles.accountItemSelected]}
      onPress={() => toggleAccountSelection(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.accountContent}>
        <View style={styles.bankInfo}>
          {editingAccountId === item.id ? (
            <>
              <TextInput
                style={styles.inputField}
                value={editedBankName}
                onChangeText={(text) => handleEditChange("bankName", text)}
                placeholder="Bank Name"
              />
              <TextInput
                style={styles.inputField}
                value={editedAccountNumber}
                onChangeText={(text) => handleEditChange("accountNumber", text)}
                keyboardType="numeric"
                placeholder="Account Number"
              />
            </>
          ) : (
            <>
              <Text style={styles.bankName}>{item.bankName}</Text>
              <Text style={styles.accountNumber}>{item.accountNumber}</Text>
            </>
          )}
        </View>

        {editingAccountId === item.id ? (
          <TouchableOpacity
            onPress={() => handleSaveEdit(item.id)}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setEditingAccountId(item.id);
              setEditedBankName(item.bankName);
              setEditedAccountNumber(item.accountNumber);
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              <MaterialIcons name="edit" size={20} color="#333" />
            </Text>
          </TouchableOpacity>
        )}

        <View
          style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        >
          {item.selected && (
            <MaterialIcons name="check" size={18} color="#fff" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.swiftPayBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View style={styles.emptyState}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="bank"
                size={100}
                color={COLORS.swiftPayBlue}
              />
            </View>
            <Text style={styles.emptyTitle}>Scan Bank Documents</Text>
            <Text style={styles.emptyDescription}>
              Quickly extract account numbers from your bank documents using our
              smart scanner
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.mainButton, styles.cameraButton]}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <MaterialIcons name="camera-alt" size={28} color="#fff" />
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonTitle}>Take Photo</Text>
                  <Text style={styles.buttonSubtitle}>Use your camera</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mainButton, styles.galleryButton]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <MaterialIcons name="photo-library" size={28} color="#fff" />
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonTitle}>Pick from Gallery</Text>
                  <Text style={styles.buttonSubtitle}>
                    Choose existing image
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <View style={styles.infoBadge}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
                <Text style={styles.infoText}>
                  Detects account numbers automatically
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBadge}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
                <Text style={styles.infoText}>Identifies bank names</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBadge}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
                <Text style={styles.infoText}>Select multiple accounts</Text>
              </View>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color={COLORS.swiftPayBlue} />
            </View>
            <Text style={styles.loadingText}>
              Scanning image for account numbers...
            </Text>
            <Text style={styles.loadingSubtext}>
              This may take a few seconds
            </Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>
                  {scannedAccounts.length} account
                  {scannedAccounts.length !== 1 ? "s" : ""} found
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={resetScanner}
                activeOpacity={0.8}
              >
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Scan Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => setShowBottomSheet(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="visibility" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  Select ({scannedAccounts.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet for Account Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBottomSheet}
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.bottomSheetOverlay}>
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <View>
                  <Text style={styles.bottomSheetTitle}>Select Accounts</Text>
                  <Text style={styles.bottomSheetSubtitle}>
                    {selectedAccounts.length} of {scannedAccounts.length}{" "}
                    selected
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowBottomSheet(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={28}
                    color={COLORS.swiftPayBlue}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <FlatList
                  data={scannedAccounts}
                  renderItem={renderAccountItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={true}
                  style={styles.accountsList}
                  contentContainerStyle={styles.accountsListContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </ScrollView>

              <View style={styles.bottomSheetActions}>
                <TouchableOpacity
                  style={[styles.bottomSheetButton, styles.cancelButton]}
                  onPress={() => setShowBottomSheet(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.bottomSheetButton,
                    styles.confirmButton,
                    selectedAccounts.length === 0 &&
                      styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmSelection}
                  disabled={selectedAccounts.length === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>
                    Proceed ({selectedAccounts.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: Platform.OS === "ios" ? 0 : 35,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
    lineHeight: 23,
  },
  buttonGroup: {
    width: "100%",
    gap: 14,
    marginBottom: 40,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cameraButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  galleryButton: {
    backgroundColor: "#0066ff",
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  infoContainer: {
    width: "100%",
    gap: 16,
    paddingHorizontal: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.swiftPayBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    lineHeight: 20,
  },
  resultContainer: {
    alignItems: "center",
    gap: 24,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 340,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.swiftPayBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  imageBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 13,
    color: "#999",
  },
  actionButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButton: {
    backgroundColor: "#ff6b6b",
  },
  viewButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "100%",
    minHeight: "60%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -0.5,
  },
  bottomSheetSubtitle: {
    fontSize: 13,
    color: "#999",
    marginTop: 6,
    fontWeight: "500",
  },
  accountsList: {
    flex: 1,
  },
  accountsListContent: {
    padding: 16,
    gap: 12,
  },
  accountItem: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#fafafa",
  },
  accountItemSelected: {
    borderColor: COLORS.swiftPayBlue,
    backgroundColor: "#f0f7ff",
  },
  accountContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  accountNumber: {
    fontSize: 14,
    color: "#666",
    letterSpacing: 1.2,
    fontWeight: "500",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.swiftPayBlue,
    borderColor: COLORS.swiftPayBlue,
  },
  bottomSheetActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  bottomSheetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  confirmButton: {
    backgroundColor: COLORS.swiftPayBlue,
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  inputField: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  editButton: {
    backgroundColor: "#ff9800",
    padding: 5,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    padding: 8,
    marginLeft: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default AccountScannerScreen;
