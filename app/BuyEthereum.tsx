import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { BottomSheet } from "@rneui/themed";
import { SafeAreaProvider } from "react-native-safe-area-context";

const BuyBtc = () => {
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

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Buy USDT</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>1445 NGN</Text>
          </View>

          {/* Quantity, Payment Method, Network, Duration */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Quantity</Text>
            <Text style={styles.detailValue}>4.5673 USDT</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Payment Method</Text>
            <View style={styles.leftLine}>
              <Text style={styles.balanceName}>SwiftPay Balance</Text>
            </View>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Network</Text>
            <Text style={styles.detailValue}>(BEP20)</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Payment Duration</Text>
            <Text style={styles.detailValue}>15Min(s)</Text>
          </View>

          {/* Balance and Amount Section */}
          <View style={styles.balanceSection}>
            <View style={styles.row}>
              <Text style={styles.balanceLabel}>SwiftPay Balance</Text>
              <Text style={styles.balanceAmount}>
                {isBalanceHidden ? "$ ******" : "$ 2,345.98"}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleBalanceVisibility}>
              <AntDesign
                name={isBalanceHidden ? "eyeo" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.headline}>With SwiftPay Balance</Text>

          {/* Info Note */}
          <Text style={styles.note}>
            <AntDesign name="exclamationcircleo" /> Note: Ensure you input the
            right info, as we would not be held liable for any loss of asset.
          </Text>

          {/* Address Input */}
          <Text style={styles.paymentText}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#666"
          />

          {/* Payment Section */}
          <Text style={styles.paymentText}>Network</Text>
          <TextInput
            style={styles.input}
            placeholder="BSC (BEP20)"
            placeholderTextColor="#666"
          />

          <Text style={styles.paymentText}>Amount</Text>
          {/* Input with "NGN" and "All" Pressable */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.flexInput]}
              placeholder="Please enter any amount"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.currencyText}>NGN</Text>
            <Pressable onPress={() => console.log("All pressed")}>
              <Text style={styles.pressableText}>All</Text>
            </Pressable>
          </View>

          <View style={styles.estimate}>
            <Text style={styles.estTitle}>I will Receive</Text>
            <Text style={styles.est}>-- USDT</Text>
          </View>

          {/* Buy Button */}
          <TouchableOpacity style={styles.buyButton} onPress={handlePreview}>
            <Text style={styles.buyButtonText}>Buy</Text>
          </TouchableOpacity>

          {/* Note at the Bottom */}
          <Text style={styles.noteBottom}>
            The coin you Buy would be sent to your wallet Address above.
          </Text>
        </ScrollView>

        {/* Bottom Sheet for Preview */}
        <BottomSheet
          isVisible={isPreviewVisible}
          onBackdropPress={() => setIsPreviewVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Order Preview</Text>
              <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
                <AntDesign
                  name="closecircleo"
                  size={20}
                  color={"red"}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.amount}>120.87 USDT</Text>

            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Price:</Text>
              <Text style={styles.bottomSheetText}>1445 NGN</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Quantity:</Text>
              <Text style={styles.bottomSheetText}>4.5673 USDT</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Payment Method:</Text>
              <Text style={styles.bottomSheetText}>SwiftPay Balance</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Network:</Text>
              <Text style={styles.bottomSheetText}>BEP20</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.bottomSheetText}>Payment Duration:</Text>
              <Text style={styles.bottomSheetText}>15Min(s)</Text>
            </View>
            <TouchableOpacity style={styles.buyButton} onPress={handleContinue}>
              <Text style={styles.buyButtonText}>Continue</Text>
            </TouchableOpacity>
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
              source={require("../assets/icons/success.png")}
              style={styles.logo}
            />

            <Text style={styles.successBottomSheetHeader}>
              Your order has been completed
            </Text>
            <View style={styles.successBottomSheetContainer}>
              <Text style={styles.subText}>Buy USDT</Text>
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
                <Text style={styles.successBottomSheetText}>
                  Total Quantity
                </Text>
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
      </View>
    </SafeAreaProvider>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 30,
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
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: "#666",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00952A",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "medium",
    color: "#000",
  },
  balanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
  },
  row: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666",
  },
  balanceAmount: {
    fontSize: 24,
    color: "#000",
    fontWeight: "700",
  },
  note: {
    color: "#1400fb",
    fontSize: 15,
    marginBottom: 20,
  },
  input: {
    borderColor: "#EAEAEA",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#EAEAEA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  flexInput: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 5,
    fontSize: 16,
  },
  currencyText: {
    marginRight: 10,
    color: "#666",
    fontSize: 16,
  },
  pressableText: {
    color: "#1400FB",
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentText: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "500",
  },
  estimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  buyButton: {
    backgroundColor: "#1400FB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buyButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "medium",
  },
  noteBottom: {
    fontSize: 15,
    color: "#666",
    textAlign: "left",
    marginTop: 10,
  },
  est: {
    fontSize: 16,
    color: "#999",
    fontWeight: "700",
  },
  estTitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  leftLine: {
    borderLeftWidth: 3,
    borderLeftColor: "#1400fb",
    paddingHorizontal: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  balanceName: {
    color: "#666",
    fontWeight: "500",
    marginBottom: 5,
  },
  headline: {
    borderBottomWidth: 3,
    borderBottomColor: "#1400fb",
    borderRadius: 2,
    marginBottom: 20,
    width: 160,
    fontWeight: "500",
    fontSize: 16,
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
});

export default BuyBtc;
