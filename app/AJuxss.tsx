// import React, { useState, useEffect, useCallback, memo } from "react";
// import axios from "axios";
// import * as SecureStore from "expo-secure-store";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
// } from "react-native";
// import { AntDesign } from "@expo/vector-icons";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { BottomSheet } from "@rneui/themed";
// import { router } from "expo-router";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import NetInfo from "@react-native-community/netinfo";

// import walletIcon from "../assets/ajo.png";
// import airtimeIcon from "../assets/icons/amazon.png";
// import dataIcon from "../assets/icons/amazon.png";
// import cableIcon from "../assets/icons/amazon.png";
// import electricityIcon from "../assets/icons/amazon.png";
// import transferIcon from "../assets/icons/amazon.png";
// import holdingsIcon from "../assets/icons/amazon.png";
// import investmentIcon from "../assets/icons/amazon.png";
// import bdcIcon from "../assets/icons/amazon.png";
// import cryptoIcon from "../assets/icons/crypto.png";
// import giftcardIcon from "../assets/icons/gift.png";
// import bankIcon from "../assets/icons/bank.png";
// import swiftpayIcon from "../assets/icons/swift.png";
// import savingsIcon from "../assets/icons/swift.png";
// import groupIcon from "../assets/icons/gold-badge.png";
// import ajoIcon from "../assets/ajo.png";
// import internationalIcon from "../assets/icons/cancel-icon.png";

// interface TransactionResponse {
//   success: boolean;
//   sources: string[];
//   transactions: {
//     current_page: number;
//     data: Transaction[];
//     first_page_url: string;
//     last_page: number;
//     next_page_url: string | null;
//     prev_page_url: string | null;
//     total: number;
//   };
// }

// interface Transaction {
//   category: string;
//   id: string;
//   type: string;
//   amount: string;
//   date: string;
//   rate?: string;
//   status: "Rejected" | "Pending" | "successful";
//   message?: string;
//   created_at?: string;
//   source?: string;
//   reference?: string;
// }

// const formatDate = (dateString: string): string => {
//   try {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "Invalid date";

//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } catch (error) {
//     console.error("Date formatting error:", error);
//     return "Date formatting error";
//   }
// };

// const TransactionItem = memo(
//   ({
//     item,
//     onPress,
//   }: {
//     item: Transaction;
//     onPress: (item: Transaction) => void;
//   }) => {
//     // Helper function to format amount with plus/minus symbol
//     const formatAmount = (amount: string, type: string) => {
//       const isDebit =
//         type.toLowerCase().includes("debit") ||
//         type.toLowerCase().includes("send") ||
//         type.toLowerCase().includes("buy");
//       return isDebit ? `- ₦ ${amount}` : `+ ₦ ${amount}`;
//     };

//     // Helper to determine text color based on transaction type
//     const getAmountColor = (type: string) => {
//       const isDebit =
//         type.toLowerCase().includes("debit") ||
//         type.toLowerCase().includes("send") ||
//         type.toLowerCase().includes("buy");
//       return isDebit ? "#E53935" : "#4CAF50";
//     };

//     const getIconSource = (source: string | undefined) => {
//       switch (source?.toLowerCase()) {
//         case "wallet_funded":
//           return walletIcon;
//         case "airtime":
//           return airtimeIcon;
//         case "data":
//           return dataIcon;
//         case "cable":
//           return cableIcon;
//         case "electricity":
//           return electricityIcon;
//         case "foreign_to_local_transfer":
//         case "local_to_foreign_transfer":
//           return transferIcon;
//         case "holdings":
//           return holdingsIcon;
//         case "investments":
//           return investmentIcon;
//         case "bureau_de_change":
//           return bdcIcon;
//         case "crypto":
//           return cryptoIcon;
//         case "gift_card":
//           return giftcardIcon;
//         case "bank_transfer":
//           return bankIcon;
//         case "swiftpay_transfer":
//           return swiftpayIcon;
//         case "save_with_interest":
//           return savingsIcon;
//         case "group_savings":
//           return groupIcon;
//         case "ajo_savings":
//         case "ajo_contribution":
//           return ajoIcon;
//         case "international_transfer":
//           return internationalIcon;
//         default:
//           return walletIcon; // fallback icon
//       }
//     };

//     return (
//       <TouchableOpacity
//         style={styles.transactionContainer}
//         onPress={() => onPress(item)}
//       >
//         <View style={styles.transactionInfo}>
//           <Image source={getIconSource(item.source)} style={styles.icons} />
//           <View style={styles.transactionTextContainer}>
//             <Text
//               style={styles.transactionType}
//               numberOfLines={2}
//               ellipsizeMode="tail"
//             >
//               {item.message || `${item.type} Transaction`}
//             </Text>
//             <Text style={styles.transactionDate}>
//               {formatDate(item.date || item.created_at || "")}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.transactionDetails}>
//           <Text
//             style={[
//               styles.transactionAmount,
//               { color: getAmountColor(item.type) },
//             ]}
//           >
//             {formatAmount(item.amount, item.type)}
//           </Text>
//           <View
//             style={[
//               styles.statusContainer,
//               {
//                 backgroundColor:
//                   item.status === "successful"
//                     ? "#E3F2FD" // Light blue
//                     : item.status === "Pending"
//                     ? "#BBDEFB" // Medium light blue
//                     : "#E1F5FE", // Very light blue
//               },
//             ]}
//           >
//             <Text
//               style={[styles.transactionStatus, styles[`status${item.status}`]]}
//             >
//               {item.status}
//             </Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   }
// );

// const Transactions: React.FC = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [isPreviewVisible, setIsPreviewVisible] = useState(false);
//   const [isFilterVisible, setIsFilterVisible] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState<string>("All");
//   const [selectedTransaction, setSelectedTransaction] =
//     useState<Transaction | null>(null);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [showStartDatePicker, setShowStartDatePicker] = useState(false);
//   const [showEndDatePicker, setShowEndDatePicker] = useState(false);
//   const [filterOptions, setFilterOptions] = useState<string[]>(["All"]);
//   const [isConnected, setIsConnected] = useState<boolean | null>(true);
//   const API_BASE_URL = "https://swiftpaymfb.com/api";

//   // Check network connectivity
//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener((state) => {
//       setIsConnected(state.isConnected);
//       if (!state.isConnected && !isLoading) {
//         setError("No internet connection. Please check your network settings.");
//       } else if (
//         state.isConnected &&
//         error === "No internet connection. Please check your network settings."
//       ) {
//         setError(null);
//       }
//     });

//     return () => unsubscribe();
//   }, [isLoading, error]);

//   // Helper function to normalize source names
//   const normalizeSource = useCallback((source: string | undefined): string => {
//     if (!source) return "";
//     return source
//       .toLowerCase()
//       .replace(/_/g, " ")
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//   }, []);

//   const fetchTransactions = useCallback(
//     async (page: number = 1, refresh: boolean = false) => {
//       if (!isConnected) {
//         setError("No internet connection. Please check your network settings.");
//         setIsLoading(false);
//         setIsRefreshing(false);
//         setIsLoadingMore(false);
//         return;
//       }

//       try {
//         const token = await SecureStore.getItemAsync("userToken");
//         if (!token) {
//           throw new Error("No authentication token found");
//         }

//         const response = await axios.get<TransactionResponse>(
//           `${API_BASE_URL}/ajo-contributions/history?page=${page}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         // Extract unique sources for filter options
//         const sources = response.data.transactions?.data
//           .map((t) => t.source)
//           .filter(Boolean)
//           .map(normalizeSource);

//         const uniqueSources = [...new Set(sources)];
//         setFilterOptions((prev) => {
//           if (page === 1) {
//             return ["All", ...uniqueSources];
//           }
//           return [...prev.filter((s) => s !== "All"), ...uniqueSources]
//             .filter((value, index, self) => self.indexOf(value) === index)
//             .sort();
//         });

//         if (page === 1 || refresh) {
//           setTransactions(response.data.transactions.data);
//         } else {
//           setTransactions((prev) => [
//             ...prev,
//             ...response.data.transactions.data,
//           ]);
//         }

//         setHasMore(!!response.data.transactions.next_page_url);
//         setCurrentPage(page);
//         setError(null);
//       } catch (err: any) {
//         const errorMessage =
//           err.response?.data?.message || "Failed to fetch transactions";
//         setError(errorMessage);
//         console.error("Error fetching transactions:", err);
//       } finally {
//         setIsLoading(false);
//         setIsRefreshing(false);
//         setIsLoadingMore(false);
//       }
//     },
//     [isConnected, normalizeSource]
//   );

//   useEffect(() => {
//     fetchTransactions();
//   }, [fetchTransactions]);

//   const loadMore = useCallback(() => {
//     if (hasMore && !isLoading && !isLoadingMore) {
//       setIsLoadingMore(true);
//       fetchTransactions(currentPage + 1);
//     }
//   }, [hasMore, isLoading, isLoadingMore, currentPage, fetchTransactions]);

//   const onRefresh = useCallback(() => {
//     setIsRefreshing(true);
//     fetchTransactions(1, true);
//   }, [fetchTransactions]);

//   // Filter transactions based on selected criteria
//   const filteredTransactions = useCallback(() => {
//     return transactions.filter((transaction) => {
//       let matchesSource = true;
//       if (selectedFilter !== "All") {
//         const normalizedTransactionSource = normalizeSource(transaction.source);
//         matchesSource = normalizedTransactionSource === selectedFilter;
//       }

//       let matchesDate = true;
//       if (startDate && endDate) {
//         const transactionDate = new Date(
//           transaction.date || transaction.created_at || ""
//         );
//         matchesDate =
//           transactionDate >= startDate && transactionDate <= endDate;
//       }

//       return matchesSource && matchesDate;
//     });
//   }, [transactions, selectedFilter, startDate, endDate, normalizeSource])();

//   const clearFilters = useCallback(() => {
//     setSelectedFilter("All");
//     setStartDate(null);
//     setEndDate(null);
//   }, []);

//   const handlePreview = useCallback((transaction: Transaction) => {
//     setSelectedTransaction(transaction);
//     setIsPreviewVisible(true);
//   }, []);

//   const handleStartDateChange = useCallback(
//     (event: any, date?: Date) => {
//       setShowStartDatePicker(false);
//       if (date) {
//         setStartDate(date);
//         // If end date exists and is before the new start date, adjust it
//         if (endDate && date > endDate) {
//           Alert.alert(
//             "Invalid Date Range",
//             "Start date cannot be after end date. End date has been adjusted.",
//             [{ text: "OK" }]
//           );
//           // Set end date to start date + 1 day
//           const newEndDate = new Date(date);
//           newEndDate.setDate(date.getDate() + 1);
//           setEndDate(newEndDate);
//         }
//       }
//     },
//     [endDate]
//   );

//   const handleEndDateChange = useCallback(
//     (event: any, date?: Date) => {
//       setShowEndDatePicker(false);
//       if (date) {
//         // If start date exists and is after the new end date, show alert
//         if (startDate && startDate > date) {
//           Alert.alert(
//             "Invalid Date Range",
//             "End date cannot be before start date. Please select a valid end date.",
//             [{ text: "OK" }]
//           );
//         } else {
//           setEndDate(date);
//         }
//       }
//     },
//     [startDate]
//   );

//   const renderFilterSection = () => (
//     <View style={styles.filterSection}>
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={styles.filterButton}
//           onPress={() => setIsFilterVisible(true)}
//         >
//           <Text style={styles.filterButtonText}>{selectedFilter}</Text>
//           <AntDesign name="down" size={12} color="black" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.filterButton}
//           onPress={() => setShowStartDatePicker(true)}
//         >
//           <Text style={styles.filterButtonText}>
//             {startDate ? formatDate(startDate.toISOString()) : "Start Date"}
//           </Text>
//           <AntDesign name="calendar" size={12} color="black" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.filterButton}
//           onPress={() => setShowEndDatePicker(true)}
//         >
//           <Text style={styles.filterButtonText}>
//             {endDate ? formatDate(endDate.toISOString()) : "End Date"}
//           </Text>
//           <AntDesign name="calendar" size={12} color="black" />
//         </TouchableOpacity>
//       </View>

//       {(selectedFilter !== "All" || startDate || endDate) && (
//         <TouchableOpacity
//           style={styles.clearFiltersButton}
//           onPress={clearFilters}
//         >
//           <Text style={styles.clearFiltersText}>Clear Filters</Text>
//         </TouchableOpacity>
//       )}

//       {showStartDatePicker && (
//         <DateTimePicker
//           value={startDate || new Date()}
//           mode="date"
//           onChange={handleStartDateChange}
//           maximumDate={new Date()} // Cannot select future dates
//         />
//       )}

//       {showEndDatePicker && (
//         <DateTimePicker
//           value={endDate || new Date()}
//           mode="date"
//           onChange={handleEndDateChange}
//           maximumDate={new Date()} // Cannot select future dates
//           minimumDate={startDate || undefined} // Cannot select date before start date
//         />
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.push("/(tabs)")}
//         >
//           <AntDesign name="arrowleft" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>Ajo Transactions</Text>
//         <View style={styles.placeholder} />
//       </View>

//       {renderFilterSection()}

//       {isLoading && !isRefreshing && (
//         <View style={styles.emptyContainer}>
//           <ActivityIndicator size="large" color="#0000ff" />
//           <Text style={{ marginTop: 10, color: "#777" }}>
//             Loading transactions...
//           </Text>
//         </View>
//       )}

//       {error && !isLoading && (
//         <View style={styles.emptyContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity
//             style={styles.button}
//             onPress={() => {
//               setIsLoading(true);
//               setError(null);
//               fetchTransactions(1, true);
//             }}
//           >
//             <Text style={styles.buttonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {!isLoading && !error && (
//         <FlatList
//           data={filteredTransactions}
//           renderItem={({ item }) => (
//             <TransactionItem item={item} onPress={handlePreview} />
//           )}
//           keyExtractor={(item) => item.id}
//           showsVerticalScrollIndicator={false}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.5}
//           refreshControl={
//             <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
//           }
//           ListEmptyComponent={() => (
//             <View style={styles.emptyContainer}>
//               <Text style={styles.emptyText}>No transactions found</Text>
//               {selectedFilter !== "All" || startDate || endDate ? (
//                 <Text style={{ fontSize: 14, color: "#777", marginTop: 8 }}>
//                   Try clearing your filters to see more results
//                 </Text>
//               ) : null}
//             </View>
//           )}
//           ListFooterComponent={() =>
//             isLoadingMore ? (
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   padding: 16,
//                 }}
//               >
//                 <ActivityIndicator size="small" color="#0000ff" />
//                 <Text style={{ marginLeft: 8, color: "#777" }}>
//                   Loading more...
//                 </Text>
//               </View>
//             ) : null
//           }
//         />
//       )}

//       {/* Transaction Details BottomSheet */}
//       <BottomSheet
//         isVisible={isPreviewVisible}
//         onBackdropPress={() => setIsPreviewVisible(false)}
//       >
//         {selectedTransaction && (
//           <View style={styles.bottomSheetContent}>
//             <View style={styles.bottomSheetHeader}>
//               <View style={styles.titleContainer}>
//                 <Text style={styles.bottomSheetTitle}>Transaction Details</Text>
//                 <Text style={styles.bottomSheetSubTitle}>
//                   Here is a detailed breakdown of this transaction
//                 </Text>
//               </View>
//               <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
//                 <AntDesign
//                   name="closecircleo"
//                   size={20}
//                   color={"red"}
//                   style={styles.icon}
//                 />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.paymentDetailsContainer}>
//               <View style={styles.row}>
//                 <Text style={styles.value}>
//                   {selectedTransaction.message || selectedTransaction.type}
//                 </Text>
//               </View>

//               <View style={styles.row}>
//                 <Text style={styles.label}>Date</Text>
//                 <Text style={styles.value}>
//                   {formatDate(
//                     selectedTransaction.date ||
//                       selectedTransaction.created_at ||
//                       ""
//                   )}
//                 </Text>
//               </View>

//               <View style={styles.row}>
//                 <Text style={styles.label}>Transaction Type</Text>
//                 <Text style={styles.value}>
//                   {normalizeSource(selectedTransaction.source) ||
//                     selectedTransaction.type}
//                 </Text>
//               </View>

//               {selectedTransaction.rate && (
//                 <View style={styles.row}>
//                   <Text style={styles.label}>Rate</Text>
//                   <Text style={styles.value}>{selectedTransaction.rate}</Text>
//                 </View>
//               )}

//               <View style={styles.row}>
//                 <Text style={styles.label}>Status</Text>
//                 <Text
//                   style={[
//                     styles.value,
//                     selectedTransaction.status === "successful"
//                       ? styles.statussuccessful
//                       : selectedTransaction.status === "Pending"
//                       ? styles.statusPending
//                       : styles.statusRejected,
//                   ]}
//                 >
//                   {selectedTransaction.status}
//                 </Text>
//               </View>

//               <View style={styles.row}>
//                 <Text style={styles.label}>Amount</Text>
//                 <Text style={styles.value}>₦ {selectedTransaction.amount}</Text>
//               </View>

//               <View style={styles.row}>
//                 <Text style={styles.label}>Reference</Text>
//                 <Text style={styles.value}>
//                   {selectedTransaction.reference ||
//                     selectedTransaction.id ||
//                     "N/A"}
//                 </Text>
//               </View>
//             </View>

//             {selectedTransaction.status === "Rejected" && (
//               <>
//                 <Text style={styles.reject}>Reason for Rejection</Text>
//                 <Text style={styles.warning}>
//                   {selectedTransaction.message ||
//                     "Invalid transaction. Please contact support for more details."}
//                 </Text>
//               </>
//             )}

//             <TouchableOpacity
//               onPress={() => {
//                 setIsPreviewVisible(false);
//                 // Here you can navigate to a report issue screen or show another modal
//                 Alert.alert(
//                   "Report Issue",
//                   "Do you want to report an issue with this transaction?",
//                   [
//                     { text: "Cancel", style: "cancel" },
//                     {
//                       text: "Report",
//                       onPress: () => router.push("/report-issue"),
//                     },
//                   ]
//                 );
//               }}
//             >
//               <Text style={styles.report}>Report an Issue</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </BottomSheet>

//       {/* Filter Options BottomSheet */}
//       <BottomSheet
//         isVisible={isFilterVisible}
//         onBackdropPress={() => setIsFilterVisible(false)}
//       >
//         <View style={styles.bottomSheetContent}>
//           <View style={styles.bottomSheetHeader}>
//             <View style={styles.titleContainer}>
//               <Text style={styles.bottomSheetTitle}>Select Filter</Text>
//               <Text style={styles.bottomSheetSubTitle}>
//                 Choose a transaction type to filter by
//               </Text>
//             </View>
//             <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
//               <AntDesign name="closecircleo" size={20} color="red" />
//             </TouchableOpacity>
//           </View>

//           <FlatList
//             data={filterOptions}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.filterItem,
//                   selectedFilter === item && styles.selectedFilterItem,
//                 ]}
//                 onPress={() => {
//                   setSelectedFilter(item);
//                   setIsFilterVisible(false);
//                 }}
//               >
//                 <Text
//                   style={[
//                     styles.filterItemText,
//                     selectedFilter === item && styles.selectedFilterItemText,
//                   ]}
//                 >
//                   {item}
//                 </Text>
//                 {selectedFilter === item && (
//                   <AntDesign name="check" size={16} color="#007AFF" />
//                 )}
//               </TouchableOpacity>
//             )}
//             keyExtractor={(item) => item}
//             style={styles.filterList}
//             showsVerticalScrollIndicator={true}
//           />
//         </View>
//       </BottomSheet>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   icon: {
//     width: 24,
//     height: 24,
//     marginRight: 8,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     padding: 16,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },
//   backButton: {
//     padding: 15,
//     backgroundColor: "#f2f2f2",
//     borderRadius: 100,
//   },
//   headerText: {
//     fontSize: 20,
//     fontWeight: "bold",
//     textAlign: "center",
//     flex: 1,
//   },
//   placeholder: {
//     width: 50,
//   },
//   button: {
//     flexDirection: "row",
//     alignItems: "center",
//     alignSelf: "flex-start",
//     backgroundColor: "#eeeeee",
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     marginBottom: 16,
//   },
//   buttonText: {
//     fontSize: 14,
//     marginRight: 8,
//     fontWeight: "500",
//   },
//   dropdown: {
//     backgroundColor: "#fff",
//     elevation: 2,
//     marginBottom: 16,
//     borderRadius: 5,
//     padding: 10,
//   },
//   dropdownItem: {
//     paddingVertical: 12,
//     backgroundColor: "#f5f5f5",
//     marginBottom: 10,
//     paddingHorizontal: 16,
//     borderRadius: 10,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   selectedDropdownItem: {
//     backgroundColor: "#E3F2FD",
//     borderColor: "#007AFF",
//     borderWidth: 1,
//   },
//   dropdownItemText: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#212529",
//   },
//   selectedDropdownItemText: {
//     color: "#007AFF",
//     fontWeight: "600",
//   },
//   filterList: {
//     flexGrow: 1,
//   },
//   transactionContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//     backgroundColor: "#f5f5f5",
//     padding: 10,
//     borderRadius: 16,
//   },
//   transactionInfo: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     flex: 3, // Give more space to the transaction info
//   },
//   transactionTextContainer: {
//     flex: 1, // Take available space
//   },
//   icons: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   transactionType: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: "#212529",
//     marginBottom: 4,
//     flexShrink: 1, // Allow text to shrink
//   },
//   transactionDate: {
//     fontSize: 13,
//     color: "#6c757d",
//   },
//   transactionDetails: {
//     alignItems: "flex-end",
//     flex: 2, // Give less space to the transaction details
//   },
//   transactionAmount: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   statusContainer: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   transactionStatus: {
//     fontSize: 12,
//     fontWeight: "500",
//   },
//   statussuccessful: {
//     color: "#00A278",
//   },
//   statusPending: {
//     color: "#FF9800",
//   },
//   statusRejected: {
//     color: "#E53935",
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginVertical: 8,
//   },
//   label: {
//     fontSize: 14,
//     color: "#777",
//     flex: 1,
//     textAlign: "left",
//   },
//   value: {
//     fontSize: 14,
//     color: "#000",
//     flex: 1,
//     textAlign: "right",
//     fontWeight: "400",
//   },
//   bottomSheetContent: {
//     padding: 20,
//     backgroundColor: "white",
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     maxHeight: "80%", // Limit the height of bottom sheet
//   },
//   filterListContainer: {
//     flexGrow: 1,
//     maxHeight: 400, // Adjust this value as needed
//   },
//   // bottomSheetContent: {
//   //   padding: 20,
//   //   backgroundColor: "white",
//   //   borderTopLeftRadius: 30,
//   //   borderTopRightRadius: 30,
//   // },
//   titleContainer: {
//     flex: 1,
//     alignItems: "center",
//   },
//   bottomSheetTitle: {
//     fontSize: 18,
//     fontWeight: "500",
//     textAlign: "center",
//   },
//   bottomSheetText: {
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   successBottomSheetText: {
//     fontSize: 16,
//     marginBottom: 10,
//     alignItems: "center",
//   },
//   successBottomSheetTextgreen: {
//     fontSize: 16,
//     marginBottom: 10,
//     alignItems: "center",
//     color: "#00952A",
//     fontWeight: "700",
//   },
//   bottomSheetHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 20,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },
//   flex: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   amount: {
//     textAlign: "center",
//     fontSize: 20,
//     fontWeight: "700",
//   },
//   bottomSheetSubTitle: {
//     color: "#666",
//     textAlign: "center",
//     fontSize: 12,
//     marginTop: 4,
//   },
//   reject: {
//     color: "red",
//     fontSize: 16,
//     textAlign: "center",
//     marginBottom: 5,
//   },
//   warning: {
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 10,
//   },
//   report: {
//     textAlign: "center",
//     fontSize: 16,
//     color: "#0000ff",
//     fontWeight: "500",
//     textDecorationLine: "underline",
//     marginTop: 16,
//   },
//   paymentDetailsContainer: {
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     padding: 10,
//     borderRadius: 10,
//     backgroundColor: "#f8f8f8",
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 80,
//   },
//   emptyText: {
//     fontSize: 18,
//     color: "#777",
//   },
//   errorText: {
//     color: "red",
//     textAlign: "center",
//     marginTop: 20,
//   },
//   filterSection: {
//     marginBottom: 16,
//   },
//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//   },
//   filterButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#eeeeee",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     flex: 1,
//     marginHorizontal: 4,
//     justifyContent: "center",
//   },
//   filterButtonText: {
//     fontSize: 12,
//     marginRight: 4,
//     fontWeight: "500",
//   },
//   clearFiltersButton: {
//     alignSelf: "center",
//     padding: 8,
//   },
//   clearFiltersText: {
//     color: "#E53935",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   filterItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 16,
//     paddingHorizontal: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   selectedFilterItem: {
//     backgroundColor: "#f8f9fa",
//   },
//   filterItemText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   selectedFilterItemText: {
//     color: "#007AFF",
//     fontWeight: "500",
//   },
// });

// export default Transactions;

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { AntDesign } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import { useLocalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as FileSystem from "expo-file-system";

const EditAjoContribution = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const params = useLocalSearchParams();
  const API_BASE_URL = "https://swiftpaymfb.com/api";

  const [formData, setFormData] = useState({
    name: "",
    reason: "Select Reason",
    type: "Select Type",
    amount: "",
    members: "",
    rounds: "",
    start_date: new Date(),
    image: null as string | null,
    description: "",
    frequency: "",
    status: "",
  });

  useEffect(() => {
    if (params.formdata) {
      try {
        const parsedData = JSON.parse(params.formdata as string);
        setFormData({
          name: parsedData.name || "",
          reason: parsedData.reason || "Select Reason",
          type: parsedData.type || "Select Type",
          amount: parsedData.amount || "",
          members: parsedData.members || "",
          rounds: parsedData.rounds || "",
          start_date: parsedData.start_date
            ? new Date(parsedData.start_date)
            : new Date(),
          image: parsedData.image || null,
          description: parsedData.description || "",
          frequency: parsedData.frequency || "",
          status: parsedData.status || "",
        });

        if (parsedData.start_date) {
          setDate(new Date(parsedData.start_date));
        }

        if (parsedData.image) {
          setImage(parsedData.image);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to parse form data");
      }
    }
  }, [params.formdata]);

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      handleInputChange("start_date", selectedDate);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Contribution name is required";
    if (formData.reason === "Select Reason")
      errors.reason = "Please select a reason";
    if (formData.type === "Select Type") errors.type = "Please select a type";
    if (!formData.amount.trim()) errors.amount = "Amount is required";
    if (!formData.members.trim())
      errors.members = "Number of members is required";
    if (!formData.rounds.trim()) errors.rounds = "Number of rounds is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permission to upload images"
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        handleInputChange("image", result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to pick image",
        text2: "",
        position: "top",
      });
    }
  };

  // Function to convert image to base64
  const convertImageToBase64 = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  };

  // Function to create form data for image upload
  const createFormDataWithImage = async () => {
    const formDataObj = new FormData();

    // Add all text fields
    formDataObj.append("ajo_contribution_id", params.id as string);
    formDataObj.append("name", formData.name);
    formDataObj.append("reason", formData.reason);
    formDataObj.append("type", formData.type);
    formDataObj.append("amount", formData.amount);
    formDataObj.append("members", formData.members);
    formDataObj.append("rounds", formData.rounds);
    formDataObj.append(
      "start_date",
      formData.start_date.toISOString().split("T")[0]
    );
    formDataObj.append("description", formData.description || "");

    // Add image if exists and has changed
    if (formData.image && formData.image !== image) {
      const imageInfo = await FileSystem.getInfoAsync(formData.image);

      if (imageInfo.exists) {
        const fileNameMatch = formData.image.match(/([^\/]+)$/);
        const fileName = fileNameMatch ? fileNameMatch[0] : "image.jpg";

        formDataObj.append("image", {
          uri: formData.image,
          name: fileName,
          type: `image/${fileName.split(".").pop()}`,
        } as any);
      }
    }

    return formDataObj;
  };

  const handleEditContribution = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fix the errors in the form",
        position: "top",
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please log in again",
          position: "top",
        });
        return;
      }

      let requestData;

      if (formData.image && formData.image !== image) {
        requestData = await createFormDataWithImage();
      } else {
        requestData = {
          ajo_contribution_id: params.id,
          name: formData.name,
          reason: formData.reason,
          type: formData.type,
          amount: formData.amount,
          members: formData.members,
          rounds: formData.rounds,
          start_date: formData.start_date.toISOString().split("T")[0],
          description: formData.description || "",
        };
      }

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/update`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        setIsSuccessVisible(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: response.data.message || "Failed to update contribution",
          position: "top",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to update contribution",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderValidationError = (field: string) => {
    if (validationErrors[field]) {
      return <Text style={styles.errorText}>{validationErrors[field]}</Text>;
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Ajo Contribution</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contribution Name */}
        <Text style={styles.label}>Contribution Name</Text>
        <TextInput
          style={[styles.input, validationErrors.name && styles.inputError]}
          placeholder="House Rent"
          value={formData.name}
          onChangeText={(text) => handleInputChange("name", text)}
          accessibilityLabel="Contribution name input"
        />
        {renderValidationError("name")}

        {/* Reason for Contribution */}
        <Text style={styles.label}>Reason for Contribution</Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            validationErrors.reason && styles.inputError,
          ]}
          onPress={() => setShowReasonModal(true)}
          accessibilityLabel="Select reason for contribution"
          accessibilityHint="Opens a list of contribution reasons"
        >
          <Text>{formData.reason}</Text>
          <AntDesign name="down" size={15} />
        </TouchableOpacity>
        {renderValidationError("reason")}

        {/* Reason Modal */}
        <Modal
          transparent={true}
          visible={showReasonModal}
          animationType="fade"
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Reason</Text>
              <TouchableOpacity
                onPress={() => {
                  handleInputChange("reason", "Personal Contribution");
                  setShowReasonModal(false);
                }}
                style={styles.modalOptionButton}
              >
                <Text style={styles.modalOption}>Personal Contribution</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleInputChange("reason", "Business Contribution");
                  setShowReasonModal(false);
                }}
                style={styles.modalOptionButton}
              >
                <Text style={styles.modalOption}>Business Contribution</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowReasonModal(false)}
                style={styles.closeModalButton}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Type of Contribution */}
        <Text style={styles.label}>Type of Contribution</Text>
        <TouchableOpacity
          style={[styles.dropdown, validationErrors.type && styles.inputError]}
          onPress={() => setShowTypeModal(true)}
          accessibilityLabel="Select type of contribution"
          accessibilityHint="Opens a list of contribution types"
        >
          <Text>{formData.type}</Text>
          <AntDesign name="down" size={15} />
        </TouchableOpacity>
        {renderValidationError("type")}

        {/* Type Modal */}
        <Modal transparent={true} visible={showTypeModal} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <TouchableOpacity
                onPress={() => {
                  handleInputChange("type", "Weekly Contribution");
                  setShowTypeModal(false);
                }}
                style={styles.modalOptionButton}
              >
                <Text style={styles.modalOption}>Weekly Contribution</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleInputChange("type", "Monthly Contribution");
                  setShowTypeModal(false);
                }}
                style={styles.modalOptionButton}
              >
                <Text style={styles.modalOption}>Monthly Contribution</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleInputChange("type", "Yearly Contribution");
                  setShowTypeModal(false);
                }}
                style={styles.modalOptionButton}
              >
                <Text style={styles.modalOption}>Yearly Contribution</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTypeModal(false)}
                style={styles.closeModalButton}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Amount Contributed */}
        <Text style={styles.label}>Amount Contributed</Text>
        <TextInput
          style={[styles.input, validationErrors.amount && styles.inputError]}
          placeholder="₦2,979,087.00"
          keyboardType="numeric"
          value={formData.amount}
          onChangeText={(text) => handleInputChange("amount", text)}
          accessibilityLabel="Amount contributed input"
        />
        {renderValidationError("amount")}

        {/* Number of Members */}
        <Text style={styles.label}>Number of Members (Including You)</Text>
        <TextInput
          style={[styles.input, validationErrors.members && styles.inputError]}
          placeholder="4"
          keyboardType="numeric"
          value={formData.members}
          onChangeText={(text) => handleInputChange("members", text)}
          accessibilityLabel="Number of members input"
        />
        {renderValidationError("members")}

        {/* Estimated number of rounds */}
        <Text style={styles.label}>Estimated number of rounds</Text>
        <TextInput
          style={[styles.input, validationErrors.rounds && styles.inputError]}
          placeholder="12"
          keyboardType="numeric"
          value={formData.rounds}
          onChangeText={(text) => handleInputChange("rounds", text)}
          accessibilityLabel="Number of rounds input"
        />
        {renderValidationError("rounds")}

        {/* Contribution Rotation Date */}
        <Text style={styles.label}>Start/Contribution Rotation Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateInput}
          accessibilityLabel="Select start date"
          accessibilityHint="Opens date picker"
        >
          <View style={styles.flex}>
            <AntDesign name="calendar" size={20} />
            <Text>{date.toDateString()}</Text>
          </View>
          <AntDesign name="down" size={15} />
        </TouchableOpacity>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            minimumDate={new Date()}
          />
        )}

        {/* Description (Optional) */}
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Add a description of this contribution"
          multiline={true}
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => handleInputChange("description", text)}
          accessibilityLabel="Description input"
        />

        {/* Upload Image */}
        <Text style={styles.label}>Change Contribution Image</Text>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.uploadContainer}
          accessibilityLabel="Upload image button"
          accessibilityHint="Opens image picker"
        >
          <Text style={styles.uploadButton}>
            {image ? "Change Image" : "Upload Image"}
          </Text>
        </TouchableOpacity>
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                setImage(null);
                handleInputChange("image", null);
              }}
              accessibilityLabel="Remove image"
            >
              <AntDesign name="closecircle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}

        {/* Update Ajo Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.disabledButton]}
          onPress={handleEditContribution}
          disabled={isLoading}
          accessibilityLabel="Update Ajo button"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Update Ajo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Bottom Sheet */}
      <BottomSheet
        isVisible={isSuccessVisible}
        onBackdropPress={() => setIsSuccessVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <Image
            source={require("../assets/icons/success.png")}
            style={styles.logo}
          />
          <Text style={styles.successBottomSheetHeader}>
            Ajo Updated Successfully
          </Text>
          <Text style={styles.desc}>
            You have successfully updated your Ajo Contribution.
          </Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              setIsSuccessVisible(false);
              router.push("/AjoDetails");
            }}
            accessibilityLabel="Proceed button"
          >
            <Text style={styles.nextButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginVertical: 8,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  dateInput: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  createButton: {
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#8080FF",
  },
  createButtonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageContainer: {
    position: "relative",
    marginVertical: 10,
    alignSelf: "flex-start",
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadContainer: {
    padding: 5,
    alignItems: "flex-start",
    marginVertical: 8,
  },
  uploadButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    overflow: "hidden",
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalOptionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOption: {
    fontSize: 16,
    textAlign: "center",
  },
  closeModalButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  closeModalText: {
    textAlign: "center",
    color: "#0000FF",
    fontWeight: "600",
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 15,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  icon: {
    width: 25,
    height: 25,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },
});

export default EditAjoContribution;
