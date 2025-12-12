import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const CreditCard: React.FC = () => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [quantity, setQuantity] = useState(2); // Initial quantity set to 2

  const navigation = useNavigation();

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const increaseQuantity = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prevQuantity) => (prevQuantity > 1 ? prevQuantity - 1 : 1)); // Prevents quantity from going below 1
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Credit Card</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.balance}>₦ 4,890.00</Text>
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>
          2 sets of Amazon US Gift Card worth N9790.00 would be credited to your
          Swift pay Account
        </Text>
      </View>

      <Text style={styles.label}>Card number</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="1234 - 364 - 3687 - 7865"
          style={styles.inputQuantity}
        />
      </View>

      <View style={styles.rowContainer}>
        <View>
          <Text style={styles.label}>Expiry date</Text>
          <TextInput placeholder="MM/YY" style={styles.inputField} />
        </View>

        <View>
          <Text style={styles.label}>CVV</Text>
          <TextInput placeholder="077" style={styles.inputField} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/PaymentVerification")}
      >
        <Text style={styles.buttonText}>Proceed</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  backButtonText: {
    fontSize: 20,
    color: "#000",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4B4B4B",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  amountBox: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0035FF",
  },
  minAmountText: {
    fontSize: 12,
    color: "#0000ff",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 2,
    paddingHorizontal: 10,
    padding: 8,
    borderColor: "#eee",
    borderRadius: 10,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  inputGroup: {
    flex: 1,
  },
  inputQuantity: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  inputQuantity2: {
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    width: "100%",
    left: -10,
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
  controlButton: {},
  controlButtonText: {
    fontSize: 25,
    color: "#555",
  },
  balanceBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
  },
  balanceText: {
    fontSize: 16,
    color: "#4B4B4B",
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  button: {
    backgroundColor: "#0035FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  balanceContainer: {
    backgroundColor: "#E5F6FF",
    paddingHorizontal: 10,
    padding: 3,
    borderRadius: 15,
  },
  balance: {
    color: "#000",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  balanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#E0EAFF",
    paddingVertical: 15,
    marginBottom: 40,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#555",
  },
  note: {
    color: "#1400fb",
    fontSize: 15,
    marginBottom: 20,
  },
  row2: {
    flexDirection: "column",
  },
  inputField: {
    borderWidth: 2,
    padding: 10,
    width: 155,
    borderColor: "#eee",
    borderRadius: 10,
  },
});

export default CreditCard;
