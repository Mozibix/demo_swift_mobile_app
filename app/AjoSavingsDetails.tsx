import LoadingComp from "@/components/Loading";
import TransactionChart from "@/components/TransactionChart";
import Card from "@/components/ui/Card";
import { COLORS } from "@/constants/Colors";
import {
  _TSFixMe,
  formatAmount,
  formatDateAgo,
  navigationWithReset,
} from "@/utils";
import { showLogs } from "@/utils/logger";
import { Entypo, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import AjoSavingsTransactionHistory from "./AjoSavingsTransactionHistory";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { BottomSheet } from "@rneui/themed";
import PinComponent from "@/components/ui/PinComponent";
import { DEFAULT_PIN } from "@/constants";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { ajoSavingsApi } from "@/services/api";

interface Transaction {
  id: number;
  amount: number;
  status: string;
  message: string;
  source: string;
  created_at: string;
}

interface Savings {
  id: number;
  type: string;
  balance: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    savings: Savings;
    transactions: Transaction[];
  };
}

const AjoSavingsDetails = () => {
  const { hash_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>([]);
  const [transactionDate, setTransactionDate] = useState<any>([]);
  const [transactionLabel, setTransactionLabel] = useState<any>([]);
  const API_BASE_URL = "https://swiftpaymfb.com/api";
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showPaybackModal, setShowPaybackModal] = useState(false);

  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const { displayLoader, hideLoader, verifyPin } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    fetchSavingsDetails();
  }, [hash_id]);

  const fetchSavingsDetails = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        if (!token) {
          Toast.show({
            type: "error",
            text1: "Authentication Error",
            text2: "Please login again",
          });
          router.replace("/login");
          return;
        }
      }

      const response = await axios.get(
        `${API_BASE_URL}/ajo-savings/show?ajo_savings_id=${hash_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // showLogs("Response:", response.data?.data);

      if (response.data.status === "success") {
        setData(response.data.data?.ajo_savings);
        if (response.data.data?.transactions_chart_data) {
          setChartData(response.data.data.transactions_chart_data);
        }
        if (response.data.data?.transactions_chart_labels) {
          setChartLabels(response.data.data.transactions_chart_labels);
        }
        setError(null);
      } else {
        Toast.show({
          type: "error",
          text1: response.data.message,
          text2: "Oops, something went wrong",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err.response?.data?.message || "Failed to fetch savings details",
        text2: "Oops, something went wrong",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchSavingsDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const HandleEndSaving = async () => {
    try {
      displayLoader();
      setShowEndConfirmation(false);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please login again",
        });
        router.replace("/login");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/ajo-savings/end`,
        {
          ajo_savings_id: hash_id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        Toast.show({
          type: "success",
          text1: response.data.message,
          text2: "Savings ended successfully",
        });
        router.back();
        navigationWithReset(navigation, "StartAjoSavings");
      } else {
        Toast.show({
          type: "error",
          text1: response.data.message,
          text2: "Oops, something went wrong",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1:
          error.response?.data?.message || "Failed to fetch savings details",
        text2: "Oops, something went wrong",
      });
    } finally {
      hideLoader();
    }
  };

  async function handlePayback(pin: string) {
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        setIsTransactionPinVisible(false);
        return showErrorToast({
          title: "You entered an invalid PIN, please try again",
        });
      }
    }

    try {
      setIsTransactionPinVisible(false);
      displayLoader();
      const response = await ajoSavingsApi.paybackAjoSavings(data.id);
      showLogs("response", response);
      showSuccessToast({
        title: "Payback successful!",
      });
      fetchSavingsDetails();
    } catch (error: _TSFixMe) {
      showLogs("error", error.data);
      showErrorToast({
        title:
          error.message ?? error?.response?.data?.message ?? "Payback failed",
        desc: "Please try again",
      });
    } finally {
      hideLoader();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajo Savings Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View className="flex-row justify-between items-center rounded-lg mb-4">
            <View>
              <Text style={styles.savingsType}>{data?.type} Ajo Savings</Text>
              <Text style={styles.balanceAmount}>
                ₦{formatAmount(data?.balance)}
              </Text>
              <Text style={[styles.savingsType, { marginTop: -12 }]}>
                Closed {formatDateAgo(data?.end_date)}
              </Text>
            </View>
            {data?.status === "active" && (
              <TouchableOpacity
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: "white",
                  borderRadius: 5,
                }}
                activeOpacity={0.8}
                onPress={() => {
                  if (data.pay_back_amount > 0) {
                    setShowPaybackModal(true);
                    return;
                  }
                  setShowEndConfirmation(true);
                }}
              >
                <Text style={styles.endBtn}>End</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.savingsInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(data?.created_at || "")}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(data?.end_date || "")}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: data?.status === "active" ? "#00C851" : "#FF4444",
                    backgroundColor:
                      data?.status === "active" ? "#E8F5E9" : "#FFEBEE",
                  },
                ]}
              >
                {data?.status}
              </Text>
            </View>
          </View>
        </View>

        <Card>
          <Text className="font-medium text-[17px]">
            Payback Amount:{" "}
            <Text className="font-bold text-[21px]">
              ₦{formatAmount(data?.pay_back_amount)}
            </Text>
          </Text>

          {data?.pay_back_amount > 0 && (
            <Button
              text="Payback Now"
              outlined
              softBg
              onPress={() => setShowPaybackModal(true)}
              classNames="w-[50%] p-3"
            />
          )}
        </Card>

        <View style={styles.transactionsSection}>
          {/* <Text style={styles.sectionTitle}>Transaction History</Text> */}
          {/* <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/AjoSavingsTransactionHistory",
                params: { id: data.id, title: `${data?.type} Ajo Savings` },
              })
            }
            className="flex-row items-center space-x-1"
          >
            <Text className="text-swiftPayBlue text-[17px] font-bold">
              View Transactions
            </Text>
            <Entypo
              name="chevron-small-right"
              size={24}
              color={COLORS.swiftPayBlue}
            />
          </TouchableOpacity> */}
          {chartData.length > 0 && chartLabels.length > 0 && (
            <TransactionChart chartData={chartData} chartLabels={chartLabels} />
          )}

          <Text style={styles.sectionTitle}>Transactions</Text>
          <AjoSavingsTransactionHistory id={data.id} />
        </View>

        <Modal
          visible={showEndConfirmation}
          transparent={true}
          onRequestClose={() => setShowEndConfirmation(false)}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text className="font-semibold text-[18px]">End Ajo Savings</Text>
              <View className="flex-row items-start space-x-3 mt-5">
                <Ionicons name="information-outline" size={24} color="gray" />
                <Text className="text-[16px] text-gray-200">
                  Closing the Ajo savings before the end date will attract a 2%
                  fee on the total amount saved
                </Text>
              </View>
              <View className="flex-row gap-3">
                <Button
                  outlined
                  text="Cancel"
                  onPress={() => setShowEndConfirmation(false)}
                  classNames="w-[35%] p-3"
                />
                <Button
                  text="Yes, End Savings"
                  onPress={HandleEndSaving}
                  classNames="w-[65%] p-3"
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showPaybackModal}
          transparent={true}
          onRequestClose={() => setShowPaybackModal(false)}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text className="font-semibold text-[18px]">
                Payback Ajo Savings
              </Text>
              <View className="mt-5">
                <Text className="text-[16px] text-gray-200">
                  You need to pay back the total outstanding amount before this
                  savings can be ended
                </Text>

                <Text className="text-center text-[16px] font-medium mt-3">
                  Total Payback Amount
                </Text>
                <Text className="text-center text-[20px] font-semibold mt-2">
                  ₦{formatAmount(data?.pay_back_amount)}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <Button
                  outlined
                  softBg
                  text="Cancel"
                  onPress={() => setShowPaybackModal(false)}
                  classNames="w-[35%] p-3"
                />
                <Button
                  text="Payback Now"
                  onPress={() => {
                    setShowPaybackModal(false);
                    setIsTransactionPinVisible(true);
                  }}
                  classNames="w-[65%] p-3"
                />
              </View>
            </View>
          </View>
        </Modal>

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View style={[styles.bottomSheetContent, { padding: 0 }]}>
            <PinComponent
              onComplete={(pin: string) => handlePayback(pin)}
              setModalState={setIsTransactionPinVisible}
            />
          </View>
        </BottomSheet>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.swiftPayBlue,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  endBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.swiftPayBlue,
  },
  savingsType: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: "700",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
  },
  savingsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#17A1FAC7",
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    textTransform: "capitalize",
  },
  transactionsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 14,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 16,
  },
  transactionMessage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    textTransform: "capitalize",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0062ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    width: "80%",
    alignSelf: "center",
    borderRadius: 10,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default AjoSavingsDetails;
