import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheet } from "@rneui/themed";
import axios from "axios";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { apiService, bureauDeChangeApi } from "../services/api";
import { DEFAULT_PIN, IS_IOS_DEVICE } from "@/constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  _TSFixMe,
  cn,
  formatAmount,
  formatKey,
  getErrorMessage,
  getFileInfo,
  maybeFormatValue,
  navigationWithReset,
} from "@/utils";
import PinComponent from "@/components/ui/PinComponent";
import { useAuth } from "@/context/AuthContext";
import KAScrollView from "@/components/ui/KAScrollView";
import Button from "@/components/ui/Button";
import { showLogs } from "@/utils/logger";
import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputLabel from "@/components/ui/InputLabel";

interface RouteParams {
  currency_id: string;
  currencyName: string;
  price: string;
  currency: string;
  volume: string;
  fee: string;
  currency_symbol: string;
  logo_url: string;
  form_fields: string;
  limit: string;
  rate: string;
}

const Exchange = () => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isTransactionPinVisible, setIsTransactionPinVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [nairaAmount, setNairaAmount] = useState("");
  const [validationData, setValidationData] = useState<any>(null);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [balance, setBalance] = useState<number>();
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState<string | null>(
    null,
  );
  const [buyDetails, setBuyDetails] = useState<Record<string, string>>({});
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const { verifyPin, getUserProfile, displayLoader, hideLoader } = useAuth();
  const navigation = useNavigation();

  const params = useLocalSearchParams();

  const {
    currencyName,
    price,
    currency,
    volume,
    fee,
    form_fields,
    limit,
    logo_url,
    currency_symbol,
    rate,
  } = params;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (form_fields) {
      try {
        const fields = JSON.parse(form_fields as string);
        setFormFields(fields);
        const initialFormData = fields.reduce(
          (acc: Record<string, string>, field: { label: string }) => {
            acc[field.label] = "";
            return acc;
          },
          {},
        );
        setBuyDetails(initialFormData);
      } catch (err) {
        console.error("Error parsing form fields:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load form fields",
        });
      }
    }
  }, [form_fields]);

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

  useEffect(() => {
    if (debouncedAmount && !isNaN(parseFloat(debouncedAmount))) {
      validateAmount(debouncedAmount);
    }
  }, [debouncedAmount]);

  const validateAmount = async (value: string) => {
    try {
      if (!value || value.length === 0 || isNaN(parseFloat(value))) {
        setNairaAmount("");
        setValidationData(null);
        return;
      }

      const amount = parseFloat(value);
      const rateValue = parseFloat(rate as string);

      const calculatedNairaAmount = amount * +price;

      const feeAmount = calculatedNairaAmount / +fee;

      const totalAmount = calculatedNairaAmount + feeAmount;

      setValidationData({
        naira_amount: calculatedNairaAmount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
      });
      setNairaAmount(calculatedNairaAmount.toFixed(2));
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to calculate amount",
        // Ensure the toast is visible above all elements
        topOffset: 60,
      });
    }
  };

  const getProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      // console.log(response);
      if (response) {
        setBalance(response.wallet_balance);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.message || "Failed to load profile",
          topOffset: 60,
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to load profile",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  function handleDateChange(event: any, selectedDate: Date | undefined) {
    if (selectedDate && selectedDateField) {
      const formatted = selectedDate.toISOString();
      setValue(selectedDateField, formatted);
      setShowDatePicker(false);
      setSelectedDateField(null);
    }
  }

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

  function onSubmit(data: Record<string, string>) {
    setBuyDetails(data);
    handlePreview();
  }

  const handlePreview = () => {
    if (!amount || !nairaAmount) {
      Toast.show({
        type: "error",
        text1: "Invalid Input",
        text2: "Please enter a valid amount",
        topOffset: 60,
      });
      return;
    }

    setIsPreviewVisible(true);
  };

  const [responseMessage, setResponseMessage] = useState<{
    type: "success" | "error";
    message: string;
    visible: boolean;
  }>({
    type: "success",
    message: "",
    visible: false,
  });

  const handleSubmitOrder = async (pin: string) => {
    setIsTransactionPinVisible(false);
    setError(null);
    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    try {
      setLoading(true);
      displayLoader();
      setResponseMessage({ type: "success", message: "", visible: false });

      const token = await SecureStore.getItemAsync("userToken");
      const formData = new FormData();
      formData.append("currency_id", params.currency_id.toString());
      formData.append("currency_amount", amount.toString());

      for (const field of parsedFields) {
        const key = field.label;
        const type = field.type;
        const formattedKey = formatFieldKey(key);
        const value = buyDetails[formattedKey];

        if (type === "file" && value) {
          const { fileUri, fileName, mimeType } = await getFileInfo(value);

          formData.append(`data[${key}]`, {
            uri: fileUri,
            name: fileName,
            type: mimeType,
          } as _TSFixMe);
        } else {
          formData.append(`data[${key}]`, value as _TSFixMe);
        }
      }

      const response = await bureauDeChangeApi.submitBuyCurrencyOrder(
        formData as _TSFixMe,
      );

      // showLogs("response", response);

      getUserProfile();
      showSuccessToast({
        title: "Successful!",
        desc: "Your Buy Order Has Been Completed!",
      });
      navigationWithReset(navigation, "(tabs)");
    } catch (err: _TSFixMe) {
      const firstError = getErrorMessage(err);
      showErrorToast({
        title:
          firstError ||
          err.response?.data?.message ||
          err.message ||
          "Somethng went wrong. Please try again",
      });
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View className={IS_IOS_DEVICE ? "mx-5" : "pt-12"}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Buy {currencyName}</Text>
          <View style={styles.placeholder} />
        </View>

        <KAScrollView>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Currency Name</Text>
            <Text style={styles.detailValue}>{currency}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>₦{formatAmount(+price)}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Payment Method</Text>
            <Text style={styles.detailValue}>SwiftPay Balance</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Quantity</Text>
            <Text style={styles.detailValue}>
              {" "}
              {currency_symbol} {volume}
            </Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Limit</Text>
            <Text style={styles.detailValue}> {limit}</Text>
          </View>

          <View style={styles.balanceSection}>
            <View style={styles.row}>
              <Text style={styles.balanceLabel}>SwiftPay Balance</Text>
              <Text style={styles.balanceAmount}>
                ₦ {formatAmount(balance ?? 0)}
              </Text>
            </View>
          </View>

          {/* <Text style={styles.headline}>Transaction Information</Text> */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <AntDesign
              name="infocirlce"
              size={14}
              color="#1400fb"
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.note, { marginBottom: 0, maxWidth: "92%" }]}>
              Note: Ensure you input the right info, as we would not be held
              liable for any loss of asset.
            </Text>
          </View>

          <Text style={styles.paymentText}>Amount in {currencyName}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter amount in ${currencyName}`}
            placeholderTextColor="#666"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />

          <Text style={styles.paymentText}>Amount in NGN to be paid</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount in NGN"
            placeholderTextColor="#666"
            value={formatAmount(+nairaAmount)}
            editable={false}
          />
          <Text style={styles.paymentWarning}>
            {`SwiftPay charges a ${fee}% fee on all transactions`}
          </Text>

          {/* Add a title "Receiver Account Details", and then below it a note message that is blue */}
          <Text style={styles.headline}>Receiver Account Details</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 5,
              marginBottom: 20,
            }}
          >
            <AntDesign
              name="infocirlce"
              size={14}
              color="#1400fb"
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.noteBottom,
                { marginTop: 0, marginBottom: 0, maxWidth: "92%" },
              ]}
            >
              Note: Ensure your Bank supports {currencyName} transfer. Recommend
              Bank - Domiciliary Account ({currency}).
            </Text>
          </View>

          {/*{validationData && (
            <View style={styles.estimate}>
              <View>
                <Text style={styles.estTitle}>SwiftPay Fees:</Text>
                <Text style={styles.subTitle}>You will pay</Text>
              </View>
              <Text style={styles.est}>
                {validationData.fee_amount.toFixed(2)} NGN
              </Text>
            </View>
          )}*/}

          <Text style={styles.headline}>Transaction Details</Text>

          {parsedFields.map((field) => {
            const key = formatFieldKey(field.label);

            return (
              <View key={key} style={{ marginBottom: 20 }}>
                <InputLabel label={field.label} isRequired={field.required} />

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

          <Button text="Continue" onPress={handleSubmit(onSubmit)} />
        </KAScrollView>

        {/* Preview Bottom Sheet */}
        <BottomSheet
          isVisible={isPreviewVisible}
          onBackdropPress={() => setIsPreviewVisible(false)}
        >
          <ScrollView>
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <TouchableOpacity
                  onPress={() => setIsPreviewVisible(false)}
                  style={styles.closeButton}
                >
                  <AntDesign name="close" size={18} color="#666" />
                </TouchableOpacity>
                <Text style={styles.bottomSheetTitle}>Order Summary</Text>
                <View style={{ width: 30 }} />
              </View>

              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>Buy {currencyName}</Text>
                </View>

                <View style={styles.cardSection}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Amount</Text>
                    <Text style={styles.cardValueHighlight}>
                      {amount} {currencyName}
                    </Text>
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Price in NGN</Text>
                    <Text style={styles.cardValue}>{nairaAmount} NGN</Text>
                  </View>

                  {validationData && (
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Fee</Text>
                      <Text style={styles.cardValue}>
                        {validationData.fee_amount.toFixed(2)} NGN
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardSection}>
                  {Object.entries(buyDetails).map(([key, value]) => (
                    <Fragment>
                      {!value.includes("file://") && (
                        <View key={key} style={styles.cardRow}>
                          <Text style={styles.cardLabel}>{formatKey(key)}</Text>
                          <Text style={styles.cardValue}>
                            {maybeFormatValue(value)}
                          </Text>
                        </View>
                      )}
                    </Fragment>
                  ))}
                </View>

                {validationData && (
                  <>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardSection}>
                      <View style={styles.cardRow}>
                        <Text style={styles.cardLabelTotal}>Total Amount</Text>
                        <Text style={styles.cardValueTotal}>
                          {validationData.total_amount.toFixed(2)} NGN
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <Button
                text="Complete Purchase"
                onPress={() => {
                  setIsPreviewVisible(false);
                  setIsTransactionPinVisible(true);
                }}
              />
            </View>
          </ScrollView>
          <Toast
            config={{
              success: (props) => (
                <BaseToast
                  {...props}
                  style={{
                    borderLeftColor: "#00952A",
                    zIndex: 9999,
                    elevation: 9999,
                  }}
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  text1Style={{
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                />
              ),
              error: (props) => (
                <ErrorToast
                  {...props}
                  style={{
                    borderLeftColor: "#FF3B30",
                    zIndex: 9999,
                    elevation: 9999, // For Android
                  }}
                  text1Style={{
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                  text2Style={{
                    fontSize: 14,
                  }}
                />
              ),
            }}
            topOffset={60}
            position="top"
            visibilityTime={4000}
          />
        </BottomSheet>

        <BottomSheet
          isVisible={isTransactionPinVisible}
          onBackdropPress={() => setIsTransactionPinVisible(false)}
        >
          <View style={[styles.bottomSheetContent, { padding: 0 }]}>
            {error && (
              <Text className="text-danger font-medium text-[16px] text-center mt-2">
                {error}
              </Text>
            )}

            <PinComponent
              onComplete={(pin: string) => handleSubmitOrder(pin)}
              setModalState={setIsTransactionPinVisible}
            />
          </View>
        </BottomSheet>

        {/* Success Bottom Sheet */}
        <BottomSheet
          isVisible={isSuccessVisible}
          onBackdropPress={() => router.back()}
        >
          <Toast
            config={{
              success: (props) => (
                <BaseToast
                  {...props}
                  style={{
                    borderLeftColor: "#00952A",
                    zIndex: 9999,
                    elevation: 9999, // For Android
                  }}
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  text1Style={{
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                />
              ),
              error: (props) => (
                <ErrorToast
                  {...props}
                  style={{
                    borderLeftColor: "#FF3B30",
                    zIndex: 9999,
                    elevation: 9999, // For Android
                  }}
                  text1Style={{
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                  text2Style={{
                    fontSize: 14,
                  }}
                />
              ),
            }}
            topOffset={60}
            position="top"
            visibilityTime={4000}
          />
          <View style={styles.bottomSheetContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <AntDesign name="close" size={18} color="#666" />
            </TouchableOpacity>

            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Image
                  source={require("../assets/icons/success.png")}
                  style={styles.successIcon}
                />
              </View>

              <Text style={styles.successTitle}>Transaction Successful</Text>

              <Text style={styles.successSubtitle}>
                Buy order for {amount} {currencyName} has been completed
              </Text>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>Transaction Details</Text>
              </View>

              <View style={styles.cardSection}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Amount</Text>
                  <Text style={styles.cardValueHighlight}>
                    {nairaAmount} NGN
                  </Text>
                </View>

                {validationData && (
                  <>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Fee</Text>
                      <Text style={styles.cardValue}>
                        {validationData.fee_amount.toFixed(2)} NGN
                      </Text>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabelTotal}>Total Amount</Text>
                      <Text style={styles.cardValueTotal}>
                        {validationData.total_amount.toFixed(2)} NGN
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.push("/Receipt")}
            >
              <Text style={styles.doneButtonText}>Receipt</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Toast component with updated styles for better visibility */}
        <Toast
          config={{
            success: (props) => (
              <BaseToast
                {...props}
                style={{
                  borderLeftColor: "#00952A",
                  zIndex: 9999,
                  elevation: 9999, // For Android
                }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
              />
            ),
            error: (props) => (
              <ErrorToast
                {...props}
                style={{
                  borderLeftColor: "#FF3B30",
                  zIndex: 9999,
                  elevation: 9999, // For Android
                }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
                text2Style={{
                  fontSize: 14,
                }}
              />
            ),
          }}
          topOffset={60}
          position="top"
          visibilityTime={4000}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 20,
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
    color: "#666",
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
  paymentWarning: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "300",
  },
  estimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#DFF1FC",
    padding: 10,
    borderRadius: 10,
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
    color: "#1400fb",
    textAlign: "left",
    marginTop: 5,
    marginBottom: 20,
  },
  est: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  estTitle: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
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
    marginBottom: 10,
    fontWeight: "500",
    fontSize: 20,
    marginTop: 20,
  },

  // Response Message Styles
  responseMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  successMessage: {
    backgroundColor: "rgba(0, 149, 42, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#00952A",
  },
  errorMessage: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  responseMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  successMessageText: {
    color: "#00952A",
  },
  errorMessageText: {
    color: "#FF3B30",
  },

  // Enhanced Bottom Sheet Styles
  bottomSheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 120,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  // Card Styles for Bottom Sheets
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  cardSection: {
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "400",
  },
  cardLabelTotal: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "700",
  },
  cardValue: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "500",
  },
  cardValueHighlight: {
    fontSize: 15,
    color: "#1400FB",
    fontWeight: "700",
  },
  cardValueTotal: {
    fontSize: 16,
    color: "#1400FB",
    fontWeight: "700",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 16,
  },

  // PIN Section Styles
  pinContainer: {
    marginVertical: 16,
  },
  pinTextContainer: {
    marginBottom: 20,
  },
  pinTextTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#333333",
    marginBottom: 8,
  },
  pinTextSub: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 20,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    color: "#000",
    fontWeight: "700",
    backgroundColor: "#F8F9FA",
  },

  // Button Styles
  completeButton: {
    backgroundColor: "#1400FB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  completeButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },

  // Success Sheet Styles (continued)
  successContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00952A",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  doneButton: {
    backgroundColor: "#1400FB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  subTitle: {
    color: "#666",
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
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
});

export default Exchange;
