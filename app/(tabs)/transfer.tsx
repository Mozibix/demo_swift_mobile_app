import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { showLogs } from "@/utils/logger";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import Button from "@/components/ui/Button";

const { width } = Dimensions.get("window");

const countries = [
  {
    name: "Nigeria",
    currency: "Naira",
    code: "NGN",
    flag: require("../../assets/flag/nigeria.png"),
  },
  {
    name: "United States",
    currency: "Dollar",
    code: "USD",
    flag: require("../../assets/flag/usa.png"),
  },
  {
    name: "United Kingdom",
    currency: "Pound",
    code: "GBP",
    flag: require("../../assets/flag/uk.png"),
  },
  {
    name: "Germany",
    currency: "Euro",
    code: "EUR",
    flag: require("../../assets/flag/germany.png"),
  },
  // Add more countries as needed
];

const transfer: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [selectedTransferType, setSelectedTransferType] = useState<
    string | null
  >(null);
  const [convertedBalance, setConvertedBalance] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [LoadingExchageRate, setLoadingExchageRate] = useState(true);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const { user } = useAuth();
  const [modalConvertVisible, setModalConvertVisible] = useState(false);
  const [amount, setAmount] = useState<any>("");
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<
    "from" | "to"
  >("from");
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{
    [key: string]: number | any;
  }>({});
  const [fromCurrency, setFromCurrency] = useState("SGD");
  const [toCurrency, setToCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState<number | undefined>();

  useEffect(() => {
    GetExchangeRates();
    if (selectedCountry.code === "NGN") {
      setConvertedBalance(user?.wallet_balance || 0);
      setExchangeRate(1);
    } else {
      axios
        .get(`https://api.exchangerate-api.com/v4/latest/NGN`)
        .then((response) => {
          const rate = response.data.rates[selectedCountry.code];
          setExchangeRate(rate);
          setConvertedBalance((user?.wallet_balance || 0) * rate);
        })
        .catch((error) => {
          console.error(error);
          setConvertedBalance(user?.wallet_balance || 0);
        });
    }
  }, [selectedCountry]);

  async function GetExchangeRates() {
    setLoadingExchageRate(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");

      let intigrate = await axios({
        url: "https://swiftpaymfb.com/api/currency-conversion",
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let data = intigrate.data.data;
      setExchangeRates(data);
      console.log(data);

      // setSelectedExchangeRate()
      setFromCurrency(Object.keys(data)[0]);
      setToCurrency(Object.keys(data)[1]);
    } catch (err) {
      console.log(err);

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Session expired. Please login again.");
        await SecureStore.deleteItemAsync("userToken");
        router.push("/login");
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setLoadingExchageRate(false);
    }
  }

  const handleConvert = () => {
    if (amount && exchangeRates[toCurrency]) {
      let rateDetail = exchangeRates[toCurrency];

      let converted =
        (amount * exchangeRates[fromCurrency].rate) / rateDetail.rate;

      setConvertedAmount(converted);
    }
  };

  const formatBalance = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useFocusEffect(
    useCallback(() => {
      const resetStates = () => {
        setIsSuccessVisible(false);
        setSelectedTransferType(null);
      };

      resetStates();

      return () => {
        setIsLoading(false);
        setError(null);
      };
    }, [])
  );

  const handleTransferTypeChange = (type: string) => {
    setSelectedTransferType(type);
    setIsSuccessVisible(false);
    // Add small delay before navigation to ensure modal closes properly
    setTimeout(() => {
      if (type === "SwiftPay") {
        router.push("/MultipleSwiftpayTransfer");
      } else if (type === "Bank") {
        router.push("/MultipleBankTransfer");
      }
    }, 300);
  };

  const renderCountryItem = ({ item }: { item: (typeof countries)[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setModalVisible(false);
      }}
    >
      <Image source={item.flag} style={styles.flag} />
      <Text style={styles.countryText}>
        {item.name} ({item.currency})
      </Text>
    </TouchableOpacity>
  );

  const renderCurrencyItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="py-3 border-b border-gray-200 px-5"
      onPress={() => {
        if (selectedCurrencyType === "from") {
          setFromCurrency(item);
        } else {
          setToCurrency(item);
        }
        setCurrencyModalVisible(false);
      }}
      style={{ flexDirection: "row", gap: 10 }}
    >
      <Image
        source={{ uri: exchangeRates[item]?.logo }}
        style={{ width: 20, height: 20, borderRadius: 50, borderWidth: 0.5 }}
        resizeMode="cover"
      />

      <Text className="text-base">{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("../../assets/images/background.png")}
      style={styles.container}
    >
      <View style={styles.headerTabs}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign
            name="arrowleft"
            size={25}
            style={styles.back}
            color={"#fff"}
          />
        </TouchableOpacity>
        <Text style={styles.title}> Transfer Balance</Text>
        <TouchableOpacity onPress={() => router.push("/Profile")}>
          <Image
            source={require("../../assets/icons/menu.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.balanceContainer}>
        <TouchableOpacity
          style={styles.currencyDropdown}
          onPress={() => setModalVisible(true)}
        >
          <Image source={selectedCountry.flag} style={styles.flag} />
          <Text>
            {selectedCountry.name} ({selectedCountry.currency})
          </Text>
          <AntDesign name="down" size={16} color="#666" />
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={styles.balanceText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
              >
                {balanceVisible
                  ? `${selectedCountry.code} ${formatBalance(convertedBalance)}`
                  : "**** **** **"}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={{ flexShrink: 0 }}
            onPress={() => setBalanceVisible(!balanceVisible)}
          >
            <AntDesign
              name={balanceVisible ? "eye" : "eyeo"}
              size={30}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.navIconsContainer}>
          <View style={styles.links}>
            <View style={styles.btn}>
              <TouchableOpacity
                style={styles.LinkButton}
                onPress={() => router.push("/Transfer")}
              >
                <MaterialCommunityIcons name="bank" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.btnText}>Account</Text>
            </View>

            <View style={styles.btn}>
              <TouchableOpacity
                style={styles.LinkButton}
                onPress={() => router.push("/AddMoney")}
                // onPress={() => {
                //   const transaction = {
                //     user_id: 7,
                //     accounts: "DUBEM WISDOM ELUE,DORBEN MFB(Dubem Elue)",
                //     type: "bank",
                //     total_amount: "2000",
                //     status: "successful",
                //     reference: "BKMTPL1748075803",
                //     source_link: null,
                //     updated_at: "2025-05-24T08:36:43.000000Z",
                //     created_at: "2025-05-24T08:36:43.000000Z",
                //     id: 29,
                //   };
                //   router.push({
                //     pathname: "/TransactionReceipt",
                //     params: {
                //       currentTransaction: JSON.stringify(transaction),
                //     },
                //   });
                // }}
              >
                <AntDesign name="plus" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.btnText}>Add</Text>
            </View>

            <View style={styles.btn}>
              <TouchableOpacity
                style={styles.LinkButton}
                onPress={() => router.push("/(tabs)/transfer")}
              >
                <SimpleLineIcons
                  name="arrow-down-circle"
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
              <Text style={styles.btnText}>Withdraw</Text>
            </View>

            <View style={styles.btn}>
              <TouchableOpacity
                style={styles.LinkButton}
                onPress={() => setModalConvertVisible(true)}
              >
                <MaterialIcons
                  name="currency-exchange"
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
              <Text style={styles.btnText}>Convert</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.transferOptions}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.optionButton}
          onPress={() => router.push("/TransferToSwiftpay")}
        >
          <Ionicons
            name="wallet-outline"
            size={24}
            color={"#fff"}
            style={styles.optionIcon}
          />
          <Text style={styles.optionButtonText}>SwiftPay Account Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.optionButton}
          onPress={() => router.push("/SingleBankTransfer")}
        >
          <MaterialCommunityIcons
            name="bank-outline"
            size={24}
            color={"#fff"}
            style={styles.optionIcon}
          />
          <Text style={styles.optionButtonText}>Single Bank Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.optionButton}
          onPress={() => setIsSuccessVisible(true)}
        >
          <Ionicons
            name="stats-chart-outline"
            size={20}
            color={"#fff"}
            style={styles.optionIcon}
          />
          <Text style={styles.optionButtonText}>Multiple Bank Transfer</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => {
            setModalVisible(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSuccessVisible}
        onRequestClose={() => setIsSuccessVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.successBottomSheetHeader}>
                Choose Transfer Type
              </Text>
              <TouchableOpacity onPress={() => setIsSuccessVisible(false)}>
                <AntDesign name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleTransferTypeChange("SwiftPay")}
              style={[
                styles.transferTypeOption,
                selectedTransferType === "SwiftPay" && styles.selectedOption,
              ]}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIconContainer}>
                  <Ionicons
                    name="wallet-outline"
                    size={24}
                    color={
                      selectedTransferType === "SwiftPay" ? "#fff" : "#0000ff"
                    }
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionTitle,
                      selectedTransferType === "SwiftPay" &&
                        styles.selectedOptionText,
                    ]}
                  >
                    Multiple SwiftPay Transfer
                  </Text>
                  <Text style={styles.optionDescription}>
                    Transfer to multiple SwiftPay accounts at once
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTransferTypeChange("Bank")}
              style={[
                styles.transferTypeOption,
                selectedTransferType === "Bank" && styles.selectedOption,
              ]}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons
                    name="bank-outline"
                    size={24}
                    color={selectedTransferType === "Bank" ? "#fff" : "#0000ff"}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionTitle,
                      selectedTransferType === "Bank" &&
                        styles.selectedOptionText,
                    ]}
                  >
                    Multiple Bank Transfer
                  </Text>
                  <Text style={styles.optionDescription}>
                    Transfer to multiple bank accounts at once
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalConvertVisible}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          {LoadingExchageRate == false ? (
            <View className="w-4/5 bg-white rounded-lg p-4">
              <Text className="font-bold mb-4 text-[19px]">
                Currency Converter
              </Text>
              <Text className="text-[17px] mb-1 font-medium">Amount</Text>
              <TextInput
                // className="border border-gray-300 p-2 rounded-lg mb-4"
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCurrencyType("from");
                    setCurrencyModalVisible(true);
                  }}
                  style={{ alignItems: "center", flexDirection: "row" }}
                >
                  <Image
                    source={{ uri: exchangeRates[fromCurrency]?.logo }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 50,
                      borderWidth: 0.5,
                    }}
                    resizeMode="cover"
                  />
                  <Text className="text-lg font-bold px-3 pr-1 py-2">
                    {fromCurrency}
                  </Text>
                  <AntDesign name="down" size={14} color="black" />
                </TouchableOpacity>
                <Text className="text-2xl">⇄</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCurrencyType("to");
                    setCurrencyModalVisible(true);
                  }}
                  style={{ alignItems: "center", flexDirection: "row" }}
                >
                  <Image
                    source={{ uri: exchangeRates[toCurrency]?.logo }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 50,
                      borderWidth: 0.5,
                    }}
                    resizeMode="cover"
                  />

                  <Text className="text-lg font-bold px-3 pr-1 py-2">
                    {toCurrency}
                  </Text>
                  <AntDesign name="down" size={14} color="black" />
                </TouchableOpacity>
              </View>
              <Text className="text-[16px] mb-1 font-medium">
                Converted Amount
              </Text>
              <TextInput
                // className="border border-gray-300 p-2 rounded-lg mb-4"
                style={styles.input}
                editable={false}
                value={
                  convertedAmount
                    ? `${toCurrency} ${
                        convertedAmount ? formatCurrency(convertedAmount) : 0.0
                      }`
                    : ""
                }
                placeholderTextColor="#000"
              />

              <Button text="Convert" onPress={handleConvert} />

              <Button
                text="Close"
                onPress={() => setModalConvertVisible(false)}
                outlined
              />
            </View>
          ) : (
            <ActivityIndicator size={"large"} />
          )}
        </View>
        <Modal
          transparent={true}
          animationType="slide"
          visible={currencyModalVisible}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-4/5 bg-white rounded-lg p-4 h-1/2">
              <Text className="text-lg font-bold mb-4">Select Currency</Text>
              <FlatList
                data={Object.keys(exchangeRates)}
                renderItem={renderCurrencyItem}
                keyExtractor={(item) => item}
              />
              <TouchableOpacity
                className="bg-red-500 p-3 rounded-lg items-center mt-4"
                onPress={() => setCurrencyModalVisible(false)}
              >
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00008b",
    resizeMode: "contain",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    left: -10,
  },
  header: {
    backgroundColor: "#00008b",
    paddingVertical: 20,
    alignItems: "center",
  },
  balanceText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    left: 14,
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  actionButtonText: {
    color: "#fff",
    marginHorizontal: 10,
  },
  headerTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: -10,
    padding: 20,
  },
  icon: {
    width: 25,
    height: 25,
  },
  back: {
    backgroundColor: "#367cff",
    padding: 5,
    borderRadius: 10,
    width: 40,
  },
  links: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    gap: 20,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
  },
  LinkbackButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  navIconsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: -10,
    alignItems: "center",
    alignSelf: "center",
  },
  btnText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  LinkButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  btn: {
    alignItems: "center",
  },
  balanceContainer: {
    padding: 20,
    margin: 10,
    alignItems: "center",
    marginBottom: -10,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    width: "100%",
  },
  countryText: {
    marginLeft: 10,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 12,
  },
  flag: {
    width: 20,
    height: 20,
  },
  currencyDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f5f5f5",
    padding: 5,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end", // Changed from center to flex-end
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "100%", // Changed from 80% to 100%
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D3D3D3",
    borderRadius: 2,
    marginBottom: 10,
  },
  countryList: {
    width: "100%",
  },
  transferOptions: {
    marginTop: 50,
    alignItems: "center",
    backgroundColor: "white",
    flex: 1,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 50,
  },
  optionButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    justifyContent: "flex-start",
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    textAlign: "center",
  },
  optionIcon: {
    marginRight: 10,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: "100%", // Add this to ensure full width
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
    marginBottom: 5,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  optionText: {
    fontWeight: "500",
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  transferTypeOption: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedOption: {
    backgroundColor: "#0000ff",
    borderColor: "#0000ff",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: "#666",
  },
  selectedOptionText: {
    color: "#fff",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default transfer;
