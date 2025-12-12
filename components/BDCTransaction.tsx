import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { showLogs } from "@/utils/logger";
import * as Clipboard from "expo-clipboard";
import { showErrorToast, showSuccessToast } from "./ui/Toast";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatDateAgo, formatDateAgoAlt } from "@/utils";

export type Transaction = {
  id: number;
  order_number: string;
  user_id: number;
  currency_name: string;
  currency_code: string;
  amount: number;
  naira_amount: number;
  status: "pending" | "completed" | "failed" | string;
  status_message: string | null;
  created_at: string;
  updated_at: string;
  data: {
    "Account Name": string;
    "Bank Name": string;
    "Account Number": string;
    "Swift Code": string;
    Date?: string;
    "Transaction time"?: string;
    "Transaction Screenshot"?: string;
  } & Record<string, string>;
};

export default function BDCTransaction({
  transaction,
  type,
}: {
  transaction: Transaction;
  type: "Buy" | "Sell";
}) {
  const [showPopup, setShowPopup] = useState(false);
  // showLogs("transaction", transaction);

  const getStatusStyle = (status: string) => {
    const baseStyle = {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    };

    switch (status.toLowerCase()) {
      case "pending":
        return {
          ...baseStyle,
          backgroundColor: "#FFF9E5",
          color: "#997A00",
        };
      case "failed":
        return {
          ...baseStyle,
          backgroundColor: "#FFE5E5",
          color: "#CC0000",
        };
      case "completed":
        return {
          ...baseStyle,
          backgroundColor: "#def7ec",
          color: "#03543f",
        };
      default:
        return baseStyle;
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60),
    );
    const diffInWeeks = Math.floor(diffInHours / (24 * 7));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInWeeks < 5) {
      return `${diffInWeeks} weeks ago`;
    } else {
      return transactionDate.toLocaleDateString();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  function handleCopy() {
    try {
      Clipboard.setStringAsync(transaction.order_number);
      showSuccessToast({ title: "Order number copied!" });
    } catch (error) {
      showErrorToast({
        title: "Could not copy order number, please try again",
      });
    }
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={styles.transactionCard}
    >
      <Modal
        visible={showPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPopup(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPopup(false)}
        >
          <View style={styles.popupContainer}>
            <Text className="font-semibold text-[17px]">
              Rejection Message:
            </Text>
            <Text style={styles.popupText}>
              {transaction.status_message || "No message"}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.transactionHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.transactionType}>
            {type} {transaction.currency_code}
          </Text>
          <Text style={styles.timeStamp}>
            {formatDateAgoAlt(transaction.created_at)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowPopup(true)}>
            {transaction.status === "failed" && (
              <MaterialIcons
                name="chat"
                size={20}
                color="#666"
                style={styles.chatIcon}
              />
            )}
          </TouchableOpacity>
          <Text style={[styles.status, getStatusStyle(transaction.status)]}>
            {transaction.status}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(transaction.amount)} {transaction.currency_code}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price in NGN</Text>
          <Text style={styles.priceValue}>₦ {transaction.naira_amount}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order No.</Text>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>{transaction.order_number}</Text>
            <TouchableOpacity onPress={handleCopy}>
              <FontAwesome6 name="copy" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  transactionType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008A16",
  },
  transactionDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
    fontWeight: "500",
  },
  transactionDetail: {
    fontSize: 14,
    color: "#888",
    marginBottom: 3,
    fontWeight: "500",
  },
  statusCompleted: {
    color: "#00c31f",
    fontWeight: "600",
    paddingHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  statusInProgress: {
    color: "#f2c600",
    fontWeight: "600",
    paddingHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  statusCancelled: {
    color: "#ff3b30",
    fontWeight: "600",
    paddingHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  statusDefault: {},
  flex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  value: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
    fontWeight: "700",
  },
  amount: {
    fontWeight: "900",
    fontSize: 20,
  },
  transactionHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 8,
    paddingBottom: 8,
  },
  message: {
    left: 55,
  },
  dot: {
    backgroundColor: "#00c31f",
    height: 10,
    width: 10,
    borderRadius: 100,
  },
  closedot: {
    backgroundColor: "#666",
    height: 10,
    width: 10,
    borderRadius: 100,
  },
  currencyDetails: {
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  limitText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
  headerLeft: {
    flex: 1,
  },
  timeStamp: {
    fontSize: 14,
    color: "#666666",
  },
  chatIcon: {
    marginRight: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  priceValue: {
    fontSize: 16,
    color: "#000000",
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontSize: 14,
    color: "#666666",
  },
});
