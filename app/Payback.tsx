import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";

const missedPayments = [
  { id: "1", date: "11/01/2024", amount: "- $100" },
  { id: "2", date: "11/02/2024", amount: "- $100" },
  { id: "3", date: "11/03/2024", amount: "- $100" },
  { id: "4", date: "11/04/2024", amount: "- $100" },
  { id: "5", date: "11/05/2024", amount: "- $100" },
];

const Payback = () => {
  const totalPayment = missedPayments.reduce(
    (sum, item) =>
      sum + parseInt(item.amount.replace("-", "").replace("$", "")),
    0
  );

  const renderPaymentItem = ({
    item,
  }: {
    item: { id: string; date: string; amount: string };
  }) => (
    <View style={styles.paymentItem}>
      <Text style={styles.paymentText}>Payment Due {item.date}</Text>
      <Text style={styles.paymentAmount}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Payback</Text>
      <FlatList
        data={missedPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={
          <View style={styles.totalPayment}>
            <Text style={styles.totalText}>Total Payment</Text>
            <Text style={styles.totalAmount}>+ ${totalPayment}</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.payNowButton}>
        <Text style={styles.payNowText}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Payback;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    flex: 1,
  },
  card: {},
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentText: {
    fontSize: 16,
    color: "#000",
  },
  paymentAmount: {
    fontSize: 16,
    color: "red",
  },
  totalPayment: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
  },
  payNowButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  payNowText: {
    fontSize: 16,
    color: "#fff",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
});
