import Button from "@/components/ui/Button";
import KAScrollView from "@/components/ui/KAScrollView";
import ExchangeSellSheet from "@/components/ui/sheets/ExchangeSellSheet";
import { IS_ANDROID_DEVICE, IS_IOS_DEVICE } from "@/constants";
import { FormField, SellDetails } from "@/types";
import { cn, formatAmount } from "@/utils";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { z } from "zod";
import {
  apiService,
  bureauDeChangeApi,
  SellCurrencyDetails,
} from "../services/api";
import * as Clipboard from "expo-clipboard";
import { showSuccessToast } from "@/components/ui/Toast";
import { showLogs } from "@/utils/logger";
import InputLabel from "@/components/ui/InputLabel";

const ExchangeSell = () => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [sellStep, setSellStep] = useState<"start" | "completion">("start");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [nairaAmount, setNairaAmount] = useState("");
  const [validationData, setValidationData] = useState<any>(null);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sellDetails, setSellDetails] = useState<SellDetails>();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [balance, setBalance] = useState<number>();
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const [currencyDetails, setCurrencyDetails] =
    useState<SellCurrencyDetails | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState<string | null>(
    null,
  );
  const [image, setImage] = useState<string | null>(null);
  const { width } = Dimensions.get("window");
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  const {
    cryptoName,
    price,
    currency,
    volume,
    fee,
    form_fields,
    limit,
    logo_url,
    currency_symbol,
    currency_id,
    banks,
    rate,
  } = useLocalSearchParams();

  const formatFieldKey = (label: string) => label.replace(/\W+/g, "_");

  const parsedFields: FormField[] = JSON.parse((form_fields as string) || "[]");

  // showLogs("parsedFields", parsedFields);

  const dynamicSchema: Record<string, z.ZodTypeAny> = parsedFields.reduce(
    (schema, field) => {
      const key = formatFieldKey(field.label);

      if (field.type === "file") {
        if (field.required) {
          schema[key] = z
            .any()
            .refine((val) => val !== null && val !== undefined, {
              message: `${field.label} is required`,
            });
        } else {
          schema[key] = z.any().optional();
        }
      } else {
        if (field.required) {
          schema[key] = z
            .string({
              required_error: `${field.label} is required`,
              invalid_type_error: `${field.label} must be a string`,
            })
            .nonempty(`${field.label} is required`);
        } else {
          schema[key] = z.string().optional();
        }
      }

      return schema;
    },
    {} as Record<string, z.ZodTypeAny>,
  );

  const schema = z.object(dynamicSchema);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: any) => {
    setSellDetails(data);
    setIsPreviewVisible(true);
  };

  const [parsedBanks, setParsedBanks] = useState<any[]>([]);

  // showLogs("banks", JSON.parse(banks as string));

  useEffect(() => {
    if (banks) {
      try {
        setParsedBanks(JSON.parse(banks as string));
      } catch (err) {
        console.error("Error parsing banks:", err);
      }
    }
  }, [banks]);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const fetchCurrencyDetails = async () => {
      try {
        setLoading(true);
        const currencyId = parseInt(currency_id as string);
        const details = await bureauDeChangeApi.getSellCurrencyPage(currencyId);
        setCurrencyDetails(details);
        // Initialize form fields based on the API response
        const initialFormData = details.form_fields.reduce(
          (acc, field) => {
            acc[field.label] = "";
            return acc;
          },
          {} as Record<string, string>,
        );
        setFormData(initialFormData);
        setFormFields(details.form_fields);
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err.message || "Failed to load currency details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyDetails();
  }, [currency_id]);

  useEffect(() => {
    if (debouncedAmount && !isNaN(parseFloat(debouncedAmount))) {
      validateAmount(debouncedAmount);
    }
  }, [debouncedAmount]);

  function handleDateChange(event: any, selectedDate: Date | undefined) {
    if (selectedDate && selectedDateField) {
      const formatted = selectedDate.toISOString();
      setValue(selectedDateField, formatted);
      setShowDatePicker(false);
      setSelectedDateField(null);
    }
  }

  async function pickImageAsync() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  }

  const validateAmount = async (value: string) => {
    try {
      if (!value || value.length === 0 || isNaN(parseFloat(value))) {
        setNairaAmount("");
        setValidationData(null);
        return;
      }

      const amount = parseFloat(value);

      if (amount <= 0) {
        Toast.show({
          type: "error",
          text1: "Invalid Amount",
          text2: "Please enter an amount greater than 0",
        });
        setNairaAmount("");
        setValidationData(null);
        return;
      }

      let rateValue = 0;
      if (typeof rate === "string") {
        try {
          const parsedRate = JSON.parse(rate as string);
          rateValue = Array.isArray(parsedRate)
            ? parseFloat(parsedRate[0] || "0")
            : parseFloat(parsedRate || "0");
        } catch {
          rateValue = parseFloat((rate as string) || "0");
        }
      } else if (Array.isArray(rate)) {
        rateValue = parseFloat(rate[0] || "0");
      } else {
        rateValue = parseFloat((rate as string) || "0");
      }

      if (isNaN(rateValue) || rateValue <= 0) {
        Toast.show({
          type: "error",
          text1: "Invalid Rate",
          text2: "Currency rate is not valid",
        });
        return;
      }

      const calculatedNairaAmount = amount * rateValue;

      const feeAmount = calculatedNairaAmount * (+fee / 100);

      const totalAmount = calculatedNairaAmount - feeAmount;

      setValidationData({
        naira_amount: calculatedNairaAmount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
      });

      setNairaAmount(calculatedNairaAmount.toFixed(2));
    } catch (err: any) {
      console.error("Validation error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to calculate amount",
      });
      setNairaAmount("");
      setValidationData(null);
    }
  };

  const getProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      // showLogs("resp", response);
      if (response) {
        setBalance(response.wallet_balance);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.message || "Failed to load profile",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const handleAmountChange = (value: string) => {
    // Update the input field immediately
    setAmount(value);

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout for 1 second
    debounceTimeout.current = setTimeout(() => {
      validateAmount(value);
    }, 1000);
  };

  // Cleanup the timeout on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handlePreview = () => {};

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  function handleCopy(item: string, type: string) {
    Clipboard.setStringAsync(item);
    showSuccessToast({
      title: `${type} copied!`,
    });
  }

  const renderBankCard = ({ item }: { item: any }) => (
    <View style={{ width: width - 40, paddingRight: 2 }}>
      <View className="mb-6 bg-gray-100 p-3 rounded-lg pr-10">
        <Text style={styles.sectionTitle}>Transaction Information</Text>
        <View className="mt-2 space-y-2">
          <View className="mb-2">
            <Text className="text-gray-300 text-[16px]">Account Name</Text>
            <Text className="font-semibold text-[16px] mt-1">
              {item.account_name}
            </Text>
          </View>
          <View className="mb-2 mt-2">
            <Text className="text-gray-300 text-[16px]">Account Number</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleCopy(item.account_number, "Account Number")}
            >
              <View className="flex-row items-center gap-2 mt-1">
                <Text className="font-semibold text-[16px]">
                  {item.account_number}
                </Text>
                <Ionicons name="copy-outline" size={18} color="black" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="mb-2 mt-2">
            <Text className="text-gray-300 text-[16px]">Bank Name</Text>
            <Text className="font-semibold text-[16px] mt-1">
              {item.bank_name}
            </Text>
          </View>
          <View className="mb-2 mt-2">
            <Text className="text-gray-300 text-[16px]">Swift Code</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleCopy(item.swift_code, "Swift Code")}
            >
              <View className="flex-row items-center gap-2 mt-1">
                <Text className="font-semibold text-[16px]">
                  {item.swift_code}
                </Text>
                <Ionicons name="copy-outline" size={18} color="black" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="mb-2 mt-3">
            <Text className="font-semibold text-[16px] text-gray-800">
              {item.description}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        style={[
          styles.header,
          {
            paddingTop: IS_ANDROID_DEVICE ? 50 : 0,
            marginHorizontal: 15,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={
            sellStep === "start"
              ? () => router.back()
              : () => setSellStep("start")
          }
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {sellStep === "start" ? "Bureau De Change" : "Complete Payment"}
        </Text>
        <View style={styles.placeholder} />
      </View>
      <KAScrollView>
        {sellStep === "start" && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.currencyCard}>
              <View style={styles.currencyHeader}>
                <View style={styles.currencyInfo}>
                  <Image
                    source={{ uri: logo_url as string }}
                    style={styles.currencyIcon}
                    defaultSource={require("../assets/icons/dollar.png")}
                  />
                  <Text style={styles.currencyName}>{currency}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Available</Text>
                </View>
              </View>

              <Text style={styles.rateValue}>₦{formatAmount(+price)}</Text>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>
                  {currency_symbol} {volume}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Limit</Text>
                <Text style={styles.detailValue}>{limit}</Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>SwiftPay Balance</Text>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>SwiftPay Balance</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceAmount}>
                    ₦ {isBalanceHidden ? "*****" : balance?.toLocaleString()}
                  </Text>
                  <TouchableOpacity onPress={toggleBalanceVisibility}>
                    <AntDesign
                      name={isBalanceHidden ? "eyeo" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Transaction Information</Text>
              <Text className="text-swiftPayBlue font-light mb-6">
                Note: Our rate is subject to the current Fx rate at the Central
                Bank Of Nigeria.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Amount to sell in {cryptoName}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter amount in ${cryptoName}`}
                  placeholderTextColor="#666"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount to Receive (NGN)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Amount in NGN"
                  placeholderTextColor="#666"
                  value={formatAmount(+nairaAmount)}
                  editable={false}
                />
              </View>
              {validationData && (
                <View style={styles.feeContainer} className="-mt-4 mb-3">
                  <View>
                    <Text style={styles.feeLabel}>Transaction Fee:</Text>
                    <Text style={styles.feeSubLabel}>
                      SwiftPay charges a {fee}% fee on all transactions
                    </Text>
                  </View>
                  <Text style={styles.feeAmount}>
                    {formatAmount(validationData?.fee_amount)} NGN
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        <View className="mx-5">
          {sellStep === "completion" && (
            <Animated.View entering={FadeInDown.delay(200)}>
              {/* <View className="flex-row items-center gap-3 mb-4">
                  <Text className="font-medium text-[17px]">
                    Complete payment within:
                  </Text>
                  <TimeBox minutes={20} seconds={15} />
                </View> */}

              <View className="mb-6">
                <View className="flex-row items-start gap-2 mb-2">
                  <Text className="text-gray-200">•</Text>
                  <Text className="text-gray-200">
                    Please transfer Asset to the address below.
                  </Text>
                </View>
                <View className="flex-row items-start gap-2 mb-2">
                  <Text className="text-gray-200">•</Text>
                  <Text className="text-gray-200">
                    After you Transfer, please ensure you fill in the
                    transaction info of your payment, to help us confirm your
                    order.
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-gray-200">•</Text>
                  <Text className="text-gray-200 max-w-[95%]">
                    Note: This order will be automatically cancelled if the
                    button is not clicked by the deadline.
                  </Text>
                </View>
              </View>

              {parsedBanks.length === 0 ? (
                <View className="mb-6 bg-gray-100 p-5 rounded-lg pr-10">
                  <Text className="font-medium text-[16px]">
                    No bank account available for this currency
                  </Text>
                </View>
              ) : parsedBanks.length > 1 ? (
                <View>
                  <FlatList
                    data={parsedBanks}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderBankCard}
                    onMomentumScrollEnd={(event) => {
                      const index = Math.round(
                        event.nativeEvent.contentOffset.x / width,
                      );
                      setCurrentIndex(index);
                    }}
                  />
                  <View className="flex-row justify-center mb-8">
                    {parsedBanks.map((_, index) => (
                      <View
                        key={index}
                        className={`h-2 w-2 mx-1 rounded-full ${
                          currentIndex === index
                            ? "bg-swiftPayBlue"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                parsedBanks.length === 1 &&
                renderBankCard({ item: parsedBanks[0] })
              )}

              <Text style={styles.sectionTitle} className="mb-2">
                Transaction Details
              </Text>
              {parsedFields.map((field, index) => {
                const key = formatFieldKey(field.label);
                console.log({ field });

                return (
                  <View key={key} style={{ marginBottom: 20 }}>
                    <InputLabel
                      label={field.label}
                      isRequired={field.required}
                    />

                    <Controller
                      control={control}
                      name={key}
                      render={({ field: { onChange, value } }) => {
                        if (["date", "time"].includes(field.type)) {
                          return (
                            <Fragment>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedDateField(key);
                                  setShowDatePicker(true);
                                }}
                                style={styles.datePickerField}
                              >
                                <Text
                                  className={cn(
                                    value ? "text-left" : "text-center",
                                  )}
                                >
                                  {value
                                    ? new Date(value).toLocaleString()
                                    : "Select Date"}
                                </Text>
                              </TouchableOpacity>

                              {showDatePicker && selectedDateField === key && (
                                <DateTimePicker
                                  value={new Date()}
                                  maximumDate={new Date()}
                                  mode={
                                    IS_IOS_DEVICE
                                      ? field.type === "time"
                                        ? "datetime"
                                        : "date"
                                      : "date"
                                  }
                                  display={"default"}
                                  onChange={handleDateChange}
                                  style={{ marginTop: 7, marginLeft: -10 }}
                                />
                              )}
                            </Fragment>
                          );
                        }

                        if (field.type === "file") {
                          return (
                            <TouchableOpacity
                              onPress={async () => {
                                const picked = await pickImageAsync();
                                if (picked) {
                                  onChange(picked);
                                }
                              }}
                              style={styles.imagePickerField}
                            >
                              {value ? (
                                <Image
                                  source={{ uri: value }}
                                  style={{
                                    width: "100%",
                                    height: 100,
                                    borderRadius: 5,
                                  }}
                                />
                              ) : (
                                <Text>Select File</Text>
                              )}
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            placeholder={field.label}
                            placeholderTextColor="#999"
                            style={styles.input}
                          />
                        );
                      }}
                    />

                    {errors[key] &&
                      "message" in errors[key] &&
                      typeof errors[key].message === "string" && (
                        <Text className="mb-3 mt-1 text-[#CC1212] font-medium">
                          {errors[key].message}
                        </Text>
                      )}
                  </View>
                );
              })}
            </Animated.View>
          )}
        </View>

        {/* Proceed Button */}
        {/* <TouchableOpacity
            style={[styles.proceedButton, loading && styles.disabledButton]}
            onPress={handlePreview}
            disabled={loading}
          >
            <Text style={styles.proceedButtonText}>
              {loading ? "Processing..." : "Proceed"}
            </Text>
          </TouchableOpacity> */}

        <View className="mx-5">
          <Button
            text="Proceed"
            loadingText="Processing..."
            isLoading={loading}
            disabled={loading || !amount}
            onPress={
              sellStep === "start"
                ? () => {
                    setSellStep("completion");
                    scrollViewRef.current?.scrollToPosition(0, 0, true);
                  }
                : handleSubmit(onSubmit)
            }
          />
        </View>

        <Toast />

        <ExchangeSellSheet
          isPreviewVisible={isPreviewVisible}
          setIsPreviewVisible={setIsPreviewVisible}
          parsedFields={parsedFields}
          cryptoName={cryptoName}
          currency_id={+currency_id}
          amount={+amount}
          nairaAmount={nairaAmount}
          fee={validationData?.fee_amount}
          sellDetails={sellDetails!}
        />
      </KAScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  },
  backButton: {
    padding: 6,
    backgroundColor: "#E8ECFF",
    borderRadius: 50,
  },
  placeholder: {
    width: 40,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    color: "#333",
  },
  datePickerField: {
    padding: 12,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
  },
  imagePickerField: {
    padding: 12,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },

  // Currency Card
  currencyCard: {
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 10,
    borderWidth: 0,
  },
  currencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  currencyName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7ED",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00C853",
  },
  statusText: {
    color: "#00952A",
    fontWeight: "600",
    fontSize: 13,
  },
  rateValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: "#000",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  balanceContainer: {
    borderLeftWidth: 4,
    borderLeftColor: "#1400FB",
    paddingLeft: 10,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  // Input Section
  inputSection: {
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#222",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
  },
  feeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EEF5FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  feeSubLabel: {
    fontSize: 13,
    color: "#666",
    maxWidth: 200,
  },
  feeAmount: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1400FB",
  },

  // Bank Section
  bankSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoNote: {
    fontSize: 14,
    color: "#1400fb",
    marginBottom: 16,
    fontWeight: "500",
    backgroundColor: "#EEF0FF",
    padding: 12,
    borderRadius: 10,
  },
  accountContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
  },
  accountDetail: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Form Section
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formContainer: {},
  uploadButton: {
    backgroundColor: "#EEF0FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0FF",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    color: "#1400FB",
    fontWeight: "600",
  },

  // Buttons
  proceedButton: {
    backgroundColor: "#1400FB",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#1400FB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionButton: {
    backgroundColor: "#1400FB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Bottom Sheet
  bottomSheetContent: {
    padding: 24,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginLeft: 20, // To center despite the close button
  },
  summaryContainer: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    color: "#222",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00952A",
  },

  // PIN Entry
  pinContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginVertical: 8,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#1400FB",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },

  // Success Screen
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
  },
  successIcon: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
});

export default ExchangeSell;
