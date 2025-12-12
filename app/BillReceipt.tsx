// BillReceipt.tsx
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const BillReceipt = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction Details</Text>
      </View>

      <View style={styles.receiptContainer}>
        <View style={styles.logoContainer}>
          {/* <Image 
            source={require('../assets/networks/mtn.png')}
            style={styles.networkLogo}
          /> */}
          <Text style={styles.networkName}>MTN</Text>
        </View>
        <Text style={styles.amount}>$0.00</Text>
        <Text style={styles.successText}>
          <AntDesign name="checkcircle" /> successful
        </Text>

        <View style={styles.transactionSummary}>
          <TransactionSummaryItem label="Amount" value="$0.00" />
          <TransactionSummaryItem label="Cashback Used" value="$0.00" />
          <TransactionSummaryItem label="Cashback Earned" value="$0.00" />
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <TransactionDetailItem label="Recipient Mobile" value="0907808080" />
        <TransactionDetailItem label="Transaction Type" value="Airtime" />
        <TransactionDetailItem label="Payment Method" value="Balance" />
        <TransactionDetailItem
          label="Transaction Number"
          value="3684024832376324"
        />
        <TransactionDetailItem
          label="Transaction Date"
          value="3/3/2023 23:00"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.buttonText}>Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TransactionSummaryItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const TransactionDetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 60,
  },
  receiptContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: -60,
    justifyContent: "center",
    top: -60,
    backgroundColor: "#fff",
    elevation: 5,
    width: 80,
    height: 80,
    borderRadius: 100,
  },
  networkLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 10,
  },
  successText: {
    fontSize: 14,
    color: "#28A745",
    marginBottom: 20,
  },
  transactionSummary: {
    width: "100%",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "700",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  detailsContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 40,
  },
  doneButton: {
    flex: 1,
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
});

export default BillReceipt;
