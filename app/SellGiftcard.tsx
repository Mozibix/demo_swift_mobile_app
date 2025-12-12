import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

type ExchangeProps = {
  navigation: {
    goBack: () => void;
  };
};

const transactions = [
  {
    id: 1,
    type: "Sell USDT",
    date: "2024-03-24 10:34:23",
    amount: "234,776.00 NGN",
    price: "1467.98 NGN",
    quantity: "20.000 USDT",
    orderNo: "123456789834567",
    status: "Completed",
    route: "/Bureau" as Href, // Ensure correct type
  },
  {
    id: 2,
    type: "Sell BTC",
    date: "2024-03-24 10:34:23",
    amount: "234,776.00 NGN",
    price: "1467.98 NGN",
    quantity: "20.000 BTC",
    orderNo: "123456789834567",
    status: "In Progress",
  },
  {
    id: 3,
    type: "Sell ETH",
    date: "2024-03-24 10:34:23",
    amount: "234,776.00 NGN",
    price: "1467.98 NGN",
    quantity: "20.000 ETH",
    orderNo: "123456789834567",
    status: "Cancelled",
  },
  // other transactions...
];

const SellGiftcard: React.FC<ExchangeProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"Sell" | "History">("Sell");
  const [activeStatus, setActiveStatus] = useState<
    "All" | "In Progress" | "Completed" | "Cancelled"
  >("All");
  const [giftCardAmount, setGiftCardAmount] = useState<string>("");
  const [selectedCardType, setSelectedCardType] = useState<string>("");
  const [selectedCardIcon, setSelectedCardIcon] = useState<any>(null); // Store the selected card's icon
  const [selectedCardCategoryIcon, setSelectedCardCategoryIcon] =
    useState<any>(null); // Store the selected card's icon
  const [selectedCardCategory, setSelectedCardCategory] = useState<string>("");
  const [isCardTypeModalVisible, setCardTypeModalVisible] = useState(false);
  const [isCardCategoryModalVisible, setCardCategoryModalVisible] =
    useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const pickImages = async () => {
    // Request permissions if necessary
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages([...images, ...selectedUris]);
    }
  };

  const [description, setDescription] = useState("");

  const cardTypeOptions = [
    {
      label: "Apple/iTunes Gift Card",
      value: "apple",
      icon: require("../assets/icons/apple.png"),
    },
    {
      label: "Amazon Gift Card",
      value: "amazon",
      icon: require("../assets/icons/amazon.png"),
    },
    {
      label: "Google Play Gift Card",
      value: "google",
      icon: require("../assets/icons/apple.png"),
    },
  ];

  const cardCategoryOptions = [
    {
      label: "Belgium Apple Tunes/iTunes Physical",
      value: "Belgium Apple Tunes/iTunes Physical",
      icon: require("../assets/icons/amazon.png"),
    },
    {
      label: "Belgium Apple Tunes/iTunes Physical",
      value: "Belgium Apple Tunes/iTunes Virtual",
      icon: require("../assets/icons/amazon.png"),
    },
  ];

  const validateAmount = (amount: string) => {
    if (parseFloat(amount) >= 20) {
      setGiftCardAmount(amount);
      setAmountError(null); // Clear the error if the amount is valid
    } else {
      setGiftCardAmount(amount);
      setAmountError("Amount must be at least $20"); // Show error if amount is less than $20
    }
  };

  const filteredTransactions = transactions.filter((transaction) =>
    activeStatus === "All" ? true : transaction.status === activeStatus
  );

  const navigateToSellScreen = (cryptoDetails: {
    name: string;
    price: string;
    quantity: string;
    limits: string;
  }) => {
    router.push({
      pathname: "/SellBtc",
      params: cryptoDetails,
    });
  };

  const handleOptionPress = (cryptoData: {
    name: any;
    price: any;
    quantity: any;
    limits: any;
  }) => {
    router.push({
      pathname: "/SellBtc", // Adjust the route as per your screen file name
      params: {
        cryptoName: cryptoData.name,
        price: cryptoData.price,
        quantity: cryptoData.quantity,
        limits: cryptoData.limits,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Sell Gift Card</Text>
        <View style={styles.placeholder} />
      </View>
      <Text style={styles.desc}>
        Kindly provide correct details of the card
      </Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Text style={styles.filterText}>Filter by:</Text>
        <TouchableOpacity
          style={
            activeTab === "Sell" ? styles.activeTabButton : styles.tabButton
          }
          onPress={() => setActiveTab("Sell")}
        >
          <Text
            style={activeTab === "Sell" ? styles.activeTabText : styles.tabText}
          >
            Physical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={
            activeTab === "History" ? styles.activeTabButton : styles.tabButton
          }
          onPress={() => setActiveTab("History")}
        >
          <Text
            style={
              activeTab === "History" ? styles.activeTabText : styles.tabText
            }
          >
            E-code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === "Sell" ? (
        // Existing Sell tab content
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Select Card Type</Text>
          <TouchableOpacity
            style={styles.dropdownContainer}
            onPress={() => setCardTypeModalVisible(true)}
          >
            <View style={styles.dropdownItems}>
              {selectedCardIcon && (
                <Image source={selectedCardIcon} style={styles.icon} />
              )}
              <Text>
                {selectedCardType ? selectedCardType : "Select Card Type"}
              </Text>
            </View>
            <AntDesign name="down" size={20} />
          </TouchableOpacity>

          <Text style={styles.label}>Select Card Category</Text>
          <TouchableOpacity
            style={styles.dropdownContainer}
            onPress={() => setCardCategoryModalVisible(true)}
          >
            <View style={styles.dropdownItems}>
              {selectedCardCategoryIcon && (
                <Image source={selectedCardCategoryIcon} style={styles.icon} />
              )}
              <Text>
                {selectedCardCategory
                  ? selectedCardCategory
                  : "Select Card Category"}
              </Text>
            </View>
            <AntDesign name="down" size={20} />
          </TouchableOpacity>

          <Text style={styles.label}>Gift Card Amount</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="$ Enter amount"
              style={styles.inputQuantity}
              onChangeText={(amount) => validateAmount(amount)}
              keyboardType="numeric"
              value={giftCardAmount}
            />

            <TouchableOpacity style={styles.balanceContainer}>
              <Text style={styles.balance}>
                <Text style={{ color: "#1400FB", fontWeight: "400" }}>
                  Rate:
                </Text>{" "}
                ₦ 4,890.00
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 10 }}>
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.balanceContainer2}>
            <Text style={styles.balance2}>N 24,580.00</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Comment</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Optional Comments: E.G, E-code"
            multiline={true}
            numberOfLines={4} // Adjust the height of the TextInput
            value={description}
            onChangeText={(text) => setDescription(text)}
          />

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.imagePreviewContainer}>
              {images.map((imgUri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: imgUri }} style={styles.previewicon} />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <AntDesign name="closecircle" size={20} color="#ff0000" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={pickImages}>
              <View style={styles.dropdownItems}>
                <Image
                  source={require("../assets/icons/gallery.png")}
                  style={styles.icon}
                />
                {/* Conditionally hide text if images exist */}
                {images.length === 0 && (
                  <Text style={styles.label}>Upload Gift Card Image(s)</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.proceedButton,
              !giftCardAmount && styles.disabledButton,
            ]}
            disabled={!giftCardAmount}
            onPress={() => router.push("/TradeSummary")}
          >
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // Existing History tab content
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status Filter Tabs */}
          <View style={styles.subCrypto}>
            {["All", "In Progress", "Completed", "Cancelled"].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() =>
                  setActiveStatus(
                    status as "All" | "In Progress" | "Completed" | "Cancelled"
                  )
                }
              >
                <Text
                  style={
                    activeStatus === status
                      ? styles.activeCryptoText
                      : styles.cryptoText
                  }
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filtered History Content */}
          <View style={styles.historyContainer}>
            {filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeaderContainer}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionType}>
                      {transaction.type}
                    </Text>
                    <MaterialIcons
                      name="chat"
                      size={20}
                      color={"#666"}
                      style={styles.message}
                    />
                    <Text style={getStatusStyle(transaction.status)}>
                      {transaction.status}
                    </Text>
                  </View>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.transactionDetail}>Amount</Text>
                  <Text style={styles.amount}>{transaction.amount}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.transactionDetail}>Price</Text>
                  <Text style={styles.value}>{transaction.price}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.transactionDetail}>Total Quantity</Text>
                  <Text style={styles.value}>{transaction.quantity}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.transactionDetail}>Order No</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Text style={styles.value}>{transaction.orderNo}</Text>
                    <TouchableOpacity>
                      <AntDesign name="copy1" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Modal visible={isCardTypeModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {cardTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCardType(option.label);
                  setSelectedCardIcon(option.icon); // Set selected icon
                  setCardTypeModalVisible(false);
                }}
              >
                <Image source={option.icon} style={styles.icon} />
                <Text>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCardTypeModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Card Category Selection */}
      <Modal
        visible={isCardCategoryModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {cardCategoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCardCategory(option.label);
                  setSelectedCardCategoryIcon(option.icon); // Set selected icon
                  setCardCategoryModalVisible(false);
                }}
              >
                <Image source={option.icon} style={styles.icon} />
                <Text>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCardCategoryModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Completed":
      return styles.statusCompleted;
    case "In Progress":
      return styles.statusInProgress;
    case "Cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
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
    width: 50, // Same width as the backButton to keep alignment
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, // Allow text to take remaining space and center
  },
  listContainer: {
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    width: 35,
    height: 35,
    resizeMode: "contain",
    borderRadius: 100,
  },
  textContainer: {
    flexDirection: "row",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  CardContainer: {
    backgroundColor: "#D3EDFC",
    marginBottom: 20,
    borderRadius: 10,
  },
  assetsName: {
    paddingHorizontal: 10,
  },
  price: {
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 10,
  },
  quantity: {
    color: "#666",
    marginBottom: 5,
  },
  limit: {
    color: "#666",
    marginBottom: 10,
  },
  balanceName: {
    color: "#111",
    fontWeight: "500",
    marginBottom: 5,
  },
  desc: {
    color: "#111",
    fontWeight: "500",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 5,
  },
  closed: {
    backgroundColor: "#ddd",
    paddingHorizontal: 10,
    borderRadius: 10,
    fontWeight: "600",
    paddingVertical: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  closedLabel: {
    backgroundColor: "#ddd",
    paddingHorizontal: 10,
    borderRadius: 10,
    color: "#888",
    fontWeight: "600",
    paddingVertical: 5,
  },
  leftLine: {
    borderLeftWidth: 3,
    borderLeftColor: "#1400fb",
    paddingHorizontal: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#DAEFFF",
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: "500",
  },
  tabText: {
    color: "#555",
    fontSize: 18,
    fontWeight: "500",
  },
  tabButton: {
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 15,
  },
  subCrypto: {
    flexDirection: "row",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  activeCryptoText: {
    fontWeight: "700",
    marginBottom: 20,
    fontSize: 16,
  },
  cryptoText: {
    fontWeight: "700",
    marginBottom: 20,
    color: "#d7d7d7",
  },
  cryptohead: {
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },
  historyContainer: {
    flex: 1,
  },
  historyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 50,
  },
  CardContainer2: {
    marginBottom: 20,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBlockColor: "#eee",
  },
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
  dropdownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  dropdownItems: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    padding: 5,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  comment: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    padding: 5,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  inputQuantity: {
    flex: 1,
    fontSize: 16,
    color: "#666",
    padding: 10,
  },
  inputComment: {
    flex: 1,
    fontSize: 16,
    color: "#666",
    padding: 5,
    paddingVertical: 10,
  },
  balanceContainer: {
    backgroundColor: "#E5F6FF",
    paddingHorizontal: 10,
    padding: 10,
    borderRadius: 20,
  },
  balanceContainer2: {
    backgroundColor: "#E5F6FF",
    paddingHorizontal: 8,
    padding: 10,
    borderRadius: 20,
    width: 140,
    alignItems: "center",
    marginBottom: 20,
  },
  balance: {
    color: "#0000ff",
    fontSize: 16,
    fontWeight: "600",
  },
  balance2: {
    color: "#0000ff",
    fontSize: 18,
    fontWeight: "700",
  },
  proceedButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 20,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#727272",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "80%",
    padding: 20,
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "blue",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
  },
  filterText: {
    color: "#666",
    fontSize: 16,
  },
  imageContainer: {
    alignItems: "center", // Align the image to the center of the container
    justifyContent: "center", // Center it vertically
    marginRight: 10,
  },
  previewicon: {
    width: 35, // Adjust size as needed
    height: 35, // Adjust size as needed
    borderRadius: 100, // Half of the width/height to make it circular
    resizeMode: "cover", // To ensure the image covers the circular area
  },
  textArea: {
    height: 100, // You can adjust this as needed
    justifyContent: "flex-start", // Align text to the top
    textAlignVertical: "top", // Ensures the text starts from the top
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    borderColor: "#ddd",
  },
  imageUploadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
    marginBottom: 10,
  },
  removeIcon: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 10,
  },
});

export default SellGiftcard;
