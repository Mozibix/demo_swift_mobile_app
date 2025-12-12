import { AntDesign, Feather } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import { showLogs } from "@/utils/logger";
import { formatBalance } from "@/utils";

interface TransactionDetails {
  amount: number;
  recipientName: string;
  recipientTag: string;
  senderName: string;
  description: string;
  reference: string;
  date: string;
  status: string;
  transactionType: string;
}

const Receipt: React.FC = () => {
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(
    null
  );
  const receiptRef = React.useRef<ViewShot>(null);

  useEffect(() => {
    loadTransactionDetails();
  }, []);

  const loadTransactionDetails = async () => {
    try {
      const details = await AsyncStorage.getItem("lastTransaction");
      if (details) {
        setTransaction(JSON.parse(details));
      }
    } catch (error) {
      console.error("Error loading transaction details:", error);
    }
  };

  // showLogs("transaction", transaction);

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #F5F7FA;
            }
            .receipt-container {
              background-color: #FFFFFF;
              border-radius: 16px;
              padding: 24px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 24px;
            }
            .logo {
              width: 100px;
              height: auto;
            }
            .receipt-title {
              color: #333;
              font-size: 14px;
              font-weight: 500;
            }
            .amount-container {
              text-align: center;
              margin-bottom: 24px;
              padding: 16px;
              background-color: #F0F8FF;
              border-radius: 12px;
            }
            .amount {
              font-size: 36px;
              color: #0000ff;
              font-weight: bold;
              margin: 8px 0;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              background-color: #E6F7EE;
              color: #00952A;
              border-radius: 100px;
              font-size: 14px;
              font-weight: 600;
              margin: 8px 0;
            }
            .date {
              font-size: 14px;
              color: #757575;
              margin: 8px 0;
            }
            .separator {
              border-top: 1px dashed #E0E0E0;
              margin: 20px 0;
            }
            .details-section {
              background-color: #F9FAFC;
              border-radius: 12px;
              padding: 16px;
            }
            .details-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #EEEEEE;
            }
            .details-row:last-child {
              border-bottom: none;
            }
            .details-label {
              font-size: 13px;
              color: #757575;
              max-width: 40%;
            }
            .details-value {
              font-size: 14px;
              color: #333333;
              font-weight: 500;
              text-align: right;
              max-width: 60%;
              word-wrap: break-word;
            }
            .reference {
              font-family: monospace;
              background-color: #F5F5F5;
              padding: 2px 4px;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 24px;
              color: #9E9E9E;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="https://swiftpaymfb.com/logo.png" alt="SwiftPay Logo" class="logo">
              <span class="receipt-title">TRANSACTION RECEIPT</span>
            </div>
            
            <div class="amount-container">
              <div class="amount">₦${transaction?.amount.toLocaleString()}</div>
              <div class="status-badge">${transaction?.status}</div>
              <div class="date">${new Date(
                transaction?.date || ""
              ).toLocaleString()}</div>
            </div>

            <div class="details-section">
              <div class="details-row">
                <span class="details-label">Transaction Type</span>
                <span class="details-value">Swiftpay Transfer</span>
              </div>

              <div class="details-row">
                <span class="details-label">Swiftpay Tag</span>
                <span class="details-value">@${transaction?.recipientTag}</span>
              </div>

              <div class="details-row">
                <span class="details-label">Recipient</span>
                <span class="details-value">${transaction?.recipientName}</span>
              </div>

              <div class="details-row">
                <span class="details-label">Sender</span>
                <span class="details-value">${transaction?.senderName}</span>
              </div>

              <div class="details-row">
                <span class="details-label">Remark</span>
                <span class="details-value">${transaction?.description}</span>
              </div>

              <div class="details-row">
                <span class="details-label">Reference</span>
                <span class="details-value reference">${
                  transaction?.reference
                }</span>
              </div>
            </div>
            
            <div class="footer">
              Thank you for using SwiftPay!
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Receipt PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF receipt");
    }
  };

  const shareAsImage = async () => {
    try {
      if (!receiptRef.current) {
        Alert.alert("Error", "Receipt is not available.");
        return;
      }
      if (receiptRef.current?.capture) {
        const uri = await receiptRef.current.capture();
        await Sharing.shareAsync(uri, {
          mimeType: "image/jpeg",
          dialogTitle: "Share Receipt Image",
          UTI: "public.jpeg", // iOS only
        });
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to share receipt as image");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {" "}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            // onPress={() => router.back()}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Share Receipt</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <ViewShot ref={receiptRef} options={{ format: "jpg", quality: 0.95 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.receiptContainer}>
              <View style={styles.headItems}>
                <Image
                  source={require("../assets/logos/swiftpaylogo.png")}
                  style={styles.logo}
                />
                <Text style={styles.label}>TRANSACTION RECEIPT</Text>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={styles.amount}>
                  ₦{formatBalance(transaction?.amount || 0)}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{transaction?.status}</Text>
                </View>
                <Text style={styles.date}>
                  {new Date(transaction?.date || "").toLocaleString()}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.detailsContainer}>
                <View style={styles.row}>
                  <Text style={styles.detailsLabel}>Transaction Type</Text>
                  <View style={styles.valueContainer}>
                    <Text style={styles.detailsValue} numberOfLines={2}>
                      {transaction?.transactionType}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowDivider} />

                <View style={styles.row}>
                  <Text style={styles.detailsLabel}>Swiftpay Tag</Text>
                  <Text style={styles.detailsValue}>
                    @{transaction?.recipientTag}
                  </Text>
                </View>

                <View style={styles.rowDivider} />

                <View style={styles.row}>
                  <Text style={styles.detailsLabel}>Recipient</Text>
                  <View style={styles.valueContainer}>
                    <Text style={styles.detailsValue} numberOfLines={2}>
                      {transaction?.recipientName}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowDivider} />

                <View style={styles.row}>
                  <Text style={styles.detailsLabel}>Sender</Text>
                  <View style={styles.valueContainer}>
                    <Text style={styles.detailsValue} numberOfLines={2}>
                      {transaction?.senderName}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowDivider} />

                <View style={styles.row}>
                  <Text style={styles.detailsLabel}>Remark</Text>
                  <View style={styles.valueContainer}>
                    <Text style={styles.detailsValue} numberOfLines={2}>
                      {transaction?.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowDivider} />

                <View style={styles.row}>
                  <Text style={styles.detailsLabel}>Reference</Text>
                  <Text style={styles.referenceValue}>
                    {transaction?.reference}
                  </Text>
                </View>
              </View>

              <Text style={styles.footerText}>
                Thank you for using SwiftPay!
              </Text>
            </View>
          </ScrollView>
        </ViewShot>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => setIsSuccessVisible(true)}
        >
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>
        <BottomSheet
          isVisible={isSuccessVisible}
          onBackdropPress={() => setIsSuccessVisible(false)}
          containerStyle={styles.bottomSheetContainer}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Image
                source={require("../assets/icons/receipt.png")}
                style={styles.shareIcon}
              />
              <Text style={styles.successBottomSheetHeader}>
                Share Receipt as
              </Text>
            </View>

            <View style={styles.shareBtnContainer}>
              <TouchableOpacity style={styles.shareBtn} onPress={generatePDF}>
                <Image
                  source={require("../assets/icons/pdf.png")}
                  style={styles.formatIcon}
                />
                <Text style={styles.shareBtnText}>PDF Document</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} onPress={shareAsImage}>
                <Image
                  source={require("../assets/icons/jpg.png")}
                  style={styles.formatIcon}
                />
                <Text style={styles.shareBtnText}>Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: Platform.OS === "android" ? 40 : 10,
    paddingHorizontal: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  backButton: {
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  receiptContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  headItems: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  label: {
    color: "#555",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  balanceContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0000ff",
    marginVertical: 8,
  },
  statusBadge: {
    backgroundColor: "#E6F7EE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginVertical: 6,
  },
  statusText: {
    color: "#00952A",
    fontWeight: "600",
    fontSize: 14,
  },
  date: {
    fontSize: 14,
    color: "#757575",
    marginTop: 6,
  },
  separator: {
    width: "100%",
    marginVertical: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#F9FAFC",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    width: "100%",
  },
  detailsLabel: {
    fontSize: 13,
    color: "#757575",
    flex: 1,
  },
  valueContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  detailsValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    textAlign: "right",
    flexWrap: "wrap",
  },
  referenceValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    textAlign: "right",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 12,
    marginTop: 20,
  },
  shareButton: {
    width: "90%",
    padding: 16,
    backgroundColor: "#0000ff",
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
    alignSelf: "center",
    shadowColor: "#0000ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
  bottomSheetContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheetContent: {
    padding: 24,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  shareIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 12,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
  },
  shareBtnContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  shareBtn: {
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: width * 0.4,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  formatIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 8,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 6,
  },
});

export default Receipt;
