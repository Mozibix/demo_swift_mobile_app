import React, { useState, useEffect } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheet } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import walletIcon from "../assets/ajo.png";
import airtimeIcon from "../assets/icons/amazon.png";
import dataIcon from "../assets/icons/amazon.png";
import cableIcon from "../assets/icons/amazon.png";
import electricityIcon from "../assets/icons/amazon.png";
import transferIcon from "../assets/icons/amazon.png";
import holdingsIcon from "../assets/icons/amazon.png";
import investmentIcon from "../assets/icons/amazon.png";
import bdcIcon from "../assets/icons/amazon.png";
import cryptoIcon from "../assets/icons/crypto.png";
import giftcardIcon from "../assets/icons/gift.png";
import bankIcon from "../assets/icons/bank.png";
import swiftpayIcon from "../assets/icons/swift.png";
import savingsIcon from "../assets/icons/swift.png";
import groupIcon from "../assets/icons/gold-badge.png";
import ajoIcon from "../assets/ajo.png";
import internationalIcon from "../assets/icons/cancel-icon.png";
import { showLogs } from "@/utils/logger";
import { formatAmount, formatSource } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { COLORS } from "@/constants/Colors";
import { useGlobals } from "@/context/GlobalContext";

interface TransactionResponse {
  success: boolean;
  sources: string[];
  transactions: {
    current_page: number;
    data: Transaction[];
    first_page_url: string;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
  };
}

interface Transaction {
  category: string;
  id: string;
  type: string;
  amount: string;
  date: string;
  rate: string;
  status: string;
  message?: string;
  created_at?: string;
  source?: string;
  reference?: string;
}

// Add this helper function after the Transaction interface
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const Transactions: React.FC = () => {
  const { source }: any = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>(
    source ? source : "All",
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const API_BASE_URL = "https://swiftpaymfb.com/api/transaction-history";
  const [currenturl, setCurrenturl] = useState(
    "https://swiftpaymfb.com/api/transaction-history",
  );
  const [ApiUrl, setApiUrl] = useState(
    "https://swiftpaymfb.com/api/transaction-history",
  );
  const { displayLoader, hideLoader } = useAuth();
  const { isCryptoEnabled, isHoldingsEnabled, isInvestmentsEnabled } =
    useGlobals();

  const [filterOptions, setFilterOptions] = useState<string[]>(["All"]);

  const fetchTransactions = async (Loadmore = false, currenturl: string) => {
    setIsLoading(true);
    displayLoader();
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (ApiUrl == null) return;
      setCurrenturl(currenturl ? currenturl : `${ApiUrl}`);

      console.log(selectedFilter);

      const response = await axios.get(currenturl ? currenturl : `${ApiUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        params: {
          ...(selectedFilter && selectedFilter != "All"
            ? { source: selectedFilter }
            : null),
          ...(startDate
            ? { start_date: startDate?.toISOString()?.slice(0, 10) }
            : null),
          ...(endDate
            ? { end_date: endDate?.toISOString()?.slice(0, 10) }
            : null),
        },
      });
      // console.log(response?.data?.data?.closed_ajo_contributions);
      // showLogs("sources", response.data.data.sources);
      let filtered = response.data.data.sources;

      if (!isCryptoEnabled) {
        filtered = filtered.filter(
          (s: string) => !s.toLowerCase().includes("crypto"),
        );
      }

      if (!isHoldingsEnabled) {
        filtered = filtered.filter(
          (s: string) => !s.toLowerCase().includes("holdings"),
        );
      }

      if (!isInvestmentsEnabled) {
        filtered = filtered.filter(
          (s: string) => !s.toLowerCase().includes("investments"),
        );
      }

      setFilterOptions(filtered);

      setFilterOptions(filtered);
      setTransactions(
        Loadmore
          ? [...transactions, ...response.data?.data?.transactions.data]
          : response.data?.data?.transactions.data,
      );
      setApiUrl(response?.data?.data?.transactions?.next_page_url);

      // if (page === 1) {
      //   setTransactions(response.data?.data?.closed_ajo_contributions);
      // } else {
      //   setTransactions((prev) => [
      //     ...prev,
      //     ...response.data?.data?.closed_ajo_contributions,
      //   ]);
      // }

      // setHasMore(!response.data.transactions.next_page_url);
      // setCurrentPage(page);
      setError(null);
    } catch (err) {
      setError("Failed to fetch transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    console.log("ok");
    ApiUrl == null ? setApiUrl(API_BASE_URL) : null;
    fetchTransactions(false, API_BASE_URL);
  }, [selectedFilter, startDate, endDate]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      // fetchTransactions(currentPage + 1);
    }
  };

  // Add this helper function
  const normalizeSource = (source: string | undefined): string => {
    if (!source) return "";
    return source
      .toLowerCase()
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const clearFilters = () => {
    setApiUrl(API_BASE_URL);
    setSelectedFilter("All");
    setStartDate(null);
    setEndDate(null);
  };

  const handlePreview = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPreviewVisible(true);
  };

  const getIconSource = (source: string | undefined) => {
    switch (source?.toLowerCase()) {
      case "wallet_funded":
        return walletIcon;
      case "airtime":
        return airtimeIcon;
      case "data":
        return dataIcon;
      case "cable":
        return cableIcon;
      case "electricity":
        return electricityIcon;
      case "foreign_to_local_transfer":
      case "local_to_foreign_transfer":
        return transferIcon;
      case "holdings":
        return holdingsIcon;
      case "investments":
        return investmentIcon;
      case "bureau_de_change":
        return bdcIcon;
      case "crypto":
        return cryptoIcon;
      case "gift_card":
        return giftcardIcon;
      case "bank_transfer":
        return bankIcon;
      case "swiftpay_transfer":
        return swiftpayIcon;
      case "save_with_interest":
        return savingsIcon;
      case "group_savings":
        return groupIcon;
      case "ajo_savings":
      case "ajo_contribution":
        return ajoIcon;
      case "international_transfer":
        return internationalIcon;
      default:
        return walletIcon;
    }
  };

  const renderTransaction = ({
    item,
    index,
  }: {
    item: Transaction;
    index: number;
  }) => {
    const getAmountColor = (type: string) => {
      const isDebit =
        type.toLowerCase().includes("debit") ||
        type.toLowerCase().includes("send") ||
        type.toLowerCase().includes("buy");
      return isDebit ? "#E53935" : "#4CAF50";
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(50 * index)}
        exiting={FadeOutDown.delay(50 * index)}
      >
        <TouchableOpacity
          activeOpacity={0.6}
          style={styles.transactionContainer}
          onPress={() => {
            router.push({
              pathname: "/TransactionReceipt",
              params: {
                currentTransaction: JSON.stringify(item),
                type: "",
                fromHistory: "true",
              },
            });
          }}
        >
          <View style={styles.transactionInfo}>
            {/* <Image source={getIconSource(item.source)} style={styles.icons} /> */}
            {item.type === "credit" ? (
              <View className="bg-green-200 p-2 rounded-full">
                <AntDesign name="arrowdown" size={24} color="#15803d" />
              </View>
            ) : item.type === "debit" ? (
              <View className="bg-[#ffc9c9] p-2 rounded-full">
                <AntDesign name="arrowup" size={24} color="#e7000b" />
              </View>
            ) : (
              <View className="bg-purple-200 p-2 rounded-full">
                <AntDesign name="arrowdown" size={24} color="#e7000b" />
              </View>
            )}
            <View style={styles.transactionTextContainer}>
              <Text
                style={styles.transactionType}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.message}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(item.date || item.created_at || "")}
              </Text>
            </View>
          </View>
          <View style={styles.transactionDetails}>
            <Text
              style={[
                styles.transactionAmount,
                { color: getAmountColor(item.type) },
              ]}
            >
              ₦{formatAmount(+item.amount)}
            </Text>
            <View className="flex-end">
              <Badge status={item.status} />
            </View>
            {/* <View
            style={[
              styles.statusContainer,
              {
                backgroundColor:
                  item.status === "successful"
                    ? "#E3F2FD" // Light blue
                    : item.status === "Pending"
                    ? "#BBDEFB" // Medium light blue
                    : "#E1F5FE", // Very light blue
              },
            ]}
          >
            <Text
              style={[styles.transactionStatus, styles[`status${item.status}`]]}
            >
              {item.status}
            </Text>

          </View> */}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterVisible(true)}
        >
          <Text style={styles.filterButtonText}>{selectedFilter}</Text>
          <AntDesign name="down" size={12} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.filterButtonText}>
            {startDate ? formatDate(startDate.toISOString()) : "Start Date"}
          </Text>
          <AntDesign name="calendar" size={12} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.filterButtonText}>
            {endDate ? formatDate(endDate.toISOString()) : "End Date"}
          </Text>
          <AntDesign name="calendar" size={12} color="black" />
        </TouchableOpacity>
      </View>

      {(selectedFilter !== "All" || startDate || endDate) && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={clearFilters}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Transactions</Text>
        <View style={styles.placeholder} />
      </View>

      {renderFilterSection()}

      {/* {isLoading && <ActivityIndicator size="large" color="#0000ff" />} */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!error && (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                setApiUrl(currenturl);
                fetchTransactions(false, currenturl);
              }}
            />
          }
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image
                source={require("../assets/payments/6.png")}
                style={{ width: 200, height: 200, resizeMode: "contain" }}
              />
              <Text style={styles.emptyText}>No transactions made yet</Text>
            </View>
          )}
        />
      )}

      {isLoading == false && ApiUrl && transactions.length > 0 ? (
        <Pressable
          style={{ alignItems: "center", paddingTop: 10 }}
          onPress={() => fetchTransactions(true, ApiUrl)}
        >
          <Text
            style={{
              color: COLORS.swiftPayBlue,
              fontSize: 17,
              fontWeight: 500,
            }}
          >
            Load more
          </Text>
        </Pressable>
      ) : null}

      {/* Transaction Details BottomSheet */}
      <BottomSheet
        isVisible={isPreviewVisible}
        onBackdropPress={() => setIsPreviewVisible(false)}
      >
        {selectedTransaction && (
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.bottomSheetTitle}>Transaction Details</Text>
                <Text style={styles.bottomSheetSubTitle}>
                  Here is a detailed breakdown of this transaction
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
                <AntDesign
                  name="closecircleo"
                  size={20}
                  color={"red"}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentDetailsContainer}>
              <View style={styles.row}>
                <Text style={styles.value}>{selectedTransaction.type}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>
                  {formatDate(
                    selectedTransaction.date ||
                      selectedTransaction.created_at ||
                      "",
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Transaction Type</Text>
                <Text style={styles.value}>{selectedTransaction.type}</Text>
              </View>

              {selectedTransaction.rate && (
                <View style={styles.row}>
                  <Text style={styles.label}>Rate</Text>
                  <Text style={styles.value}>{selectedTransaction.rate}</Text>
                </View>
              )}

              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <Text
                  style={[
                    styles.value,
                    selectedTransaction.status === "successful"
                      ? styles.statusCompleted
                      : selectedTransaction.status === "Pending"
                        ? styles.statusPending
                        : styles.statusRejected,
                  ]}
                >
                  {selectedTransaction.status}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.value}>{selectedTransaction.amount}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Reference</Text>
                <Text style={styles.value}>
                  {selectedTransaction.reference}
                </Text>
              </View>
            </View>

            {selectedTransaction.status === "Rejected" && (
              <>
                <Text style={styles.reject}>Reason for Rejection</Text>
                <Text style={styles.warning}>
                  Invalid: The image attached does not correspond with the
                  selected trade.
                </Text>
              </>
            )}

            <Text style={styles.report}>Report an Issue</Text>
          </View>
        )}
      </BottomSheet>

      {/* Filter Options BottomSheet */}
      <BottomSheet
        isVisible={isFilterVisible}
        onBackdropPress={() => setIsFilterVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.bottomSheetTitle}>Select Filter</Text>
              <Text style={styles.bottomSheetSubTitle}>
                Choose a transaction type to filter by
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
              <AntDesign name="closecircleo" size={20} color="red" />
            </TouchableOpacity>
          </View>

          {/* <FlatList
            data={filterOptions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  selectedFilter === item && styles.selectedFilterItem,
                ]}
                onPress={() => {
                  setSelectedFilter(item);
                  setIsFilterVisible(false);
                }}
              >
                <View
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={[
                      styles.filterItemText,
                      selectedFilter === item && styles.selectedFilterItemText,
                    ]}
                  >
                    {formatSource(item)}
                  </Text>
                </View>

                {selectedFilter === item && (
                  <AntDesign name="check" size={16} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            style={styles.filterList}
            showsVerticalScrollIndicator={true}
          /> */}

          <ScrollView
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8, // Adjust spacing between pills
              padding: 16,
            }}
          >
            {filterOptions.map((item) => {
              const isSelected = selectedFilter === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={{
                    backgroundColor: isSelected ? "#e0edff" : "#f3f4f6",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setSelectedFilter(item);
                    setTimeout(() => setIsFilterVisible(false), 500);
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? "#007AFF" : "#111827",
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {formatSource(item)}
                  </Text>
                  {isSelected && (
                    <AntDesign
                      name="check"
                      size={14}
                      color="#007AFF"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 50,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#eeeeee",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: "500",
  },
  dropdown: {
    backgroundColor: "#fff",
    elevation: 2,
    marginBottom: 16,
    borderRadius: 5,
    padding: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedDropdownItem: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
    borderWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  selectedDropdownItemText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  filterList: {
    flexGrow: 1,
  },
  transactionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 16,
  },
  transactionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 3, // Give more space to the transaction info
  },
  transactionTextContainer: {
    flex: 1, // Take available space
    marginLeft: 7,
  },
  icons: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: "500",
    color: "#212529",
    marginBottom: 4,
    flexShrink: 1, // Allow text to shrink
  },
  transactionDate: {
    fontSize: 13,
    color: "#6c757d",
  },
  transactionDetails: {
    alignItems: "flex-end",
    flex: 2, // Give less space to the transaction details
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  statussuccessful: {
    color: "#00A278",
  },
  statusPending: {
    color: "#FF9800",
  },
  statusRejected: {
    color: "#E53935",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#777",
    flex: 1,
    textAlign: "left",
  },
  value: {
    fontSize: 14,
    color: "#000",
    flex: 1,
    textAlign: "right",
    fontWeight: "400",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // maxHeight: "80%", // Limit the height of bottom sheet
  },
  filterListContainer: {
    flexGrow: 1,
    maxHeight: 400, // Adjust this value as needed
  },
  // bottomSheetContent: {
  //   padding: 20,
  //   backgroundColor: "white",
  //   borderTopLeftRadius: 30,
  //   borderTopRightRadius: 30,
  // },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
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
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  bottomSheetSubTitle: {
    color: "#666",
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  },
  reject: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  warning: {
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  report: {
    textAlign: "center",
    fontSize: 16,
    color: "#0000ff",
    fontWeight: "500",
    textDecorationLine: "underline",
    marginTop: 16,
  },
  paymentDetailsContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: "#777",
    fontWeight: "600",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eeeeee",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  filterButtonText: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: "500",
  },
  clearFiltersButton: {
    alignSelf: "center",
    padding: 8,
  },
  clearFiltersText: {
    color: "#E53935",
    fontSize: 14,
    fontWeight: "500",
  },
  filterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedFilterItem: {
    backgroundColor: "#f8f9fa",
  },
  filterItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedFilterItemText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  statusCompleted: {},
});

export default Transactions;
