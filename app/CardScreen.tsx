import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { router, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { apiService } from "../services/api";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/context/AuthContext";
import { showLogs } from "@/utils/logger";
import { _TSFixMe, formatAmount } from "@/utils";
import LoadingComp from "@/components/Loading";
import { COLORS } from "@/constants/Colors";
import { showErrorToast } from "@/components/ui/Toast";

// Interface for the product details
interface ProductDetails {
  fee: number;
  product: {
    productId: number;
    productName: string;
    global: boolean;
    status: string;
    supportsPreOrder: boolean;
    senderFee: number;
    senderFeePercentage: number;
    discountPercentage: number;
    denominationType: string;
    recipientCurrencyCode: string;
    minRecipientDenomination: number;
    maxRecipientDenomination: number;
    senderCurrencyCode: string;
    minSenderDenomination: number;
    maxSenderDenomination: number;
    fixedRecipientDenominations: number[];
    fixedSenderDenominations: number[] | null;
    fixedRecipientToSenderDenominationsMap: Record<string, number> | null;
    logoUrls: string[];
    brand: {
      brandId: number;
      brandName: string;
    };
    category: {
      id: number;
      name: string;
    };
    country: {
      isoName: string;
      name: string;
      flagUrl: string;
    };
    redeemInstruction?: {
      concise: string;
      verbose: string;
    };
    additionalRequirements?: {
      userIdRequired: boolean;
    };
  };
}

// Interface for User Profile
interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  account_number?: string;
  bank_name?: string;
}

const CardScreen = () => {
  const params = useLocalSearchParams<{
    productId: string;
    productName: string;
    minAmount: string;
    maxAmount: string;
    denominations: string;
    senderFee: string;
    currencyCode: string;
  }>();

  const { user } = useAuth();
  const [amountOpen, setAmountOpen] = useState(false);
  const [amount, setAmount] = useState<string | null>(null);
  const [amountItems, setAmountItems] = useState<any[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [recipientName, setRecipientName] = useState(user?.name || "");
  const [recipientEmail, setRecipientEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [price, setPrice] = useState(0);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product details when component loads
  useEffect(() => {
    if (params.productId) {
      fetchProductDetails();
    }
  }, [params.productId]);

  // Fetch product details from the API
  const fetchProductDetails = async () => {
    try {
      setFetchingProduct(true);
      const response = await apiService.getGiftCardProduct(params.productId);
      // showLogs("fetchProductDetails response", response);
      if (response.status === "success") {
        setProductDetails(response.data);
        setupDenominations(response.data.product);
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch gift card details");
      Alert.alert(
        "Error",
        "Failed to load gift card details. Please try again."
      );
    } finally {
      setFetchingProduct(false);
    }
  };

  // Setup denominations based on product details
  const setupDenominations = (product: ProductDetails["product"]) => {
    if (
      product.denominationType === "FIXED" &&
      product.fixedRecipientDenominations.length > 0
    ) {
      const items = product.fixedRecipientDenominations.map((value) => ({
        label: `${product.recipientCurrencyCode} ${value}`,
        value: value.toString(),
      }));
      setAmountItems(items);
    } else {
      // For RANGE type, create a custom amount option
      setAmountItems([
        {
          label: "Custom Amount",
          value: "custom",
        },
      ]);
    }
  };

  useEffect(() => {
    if (params.denominations) {
      const denominations = JSON.parse(params.denominations);
      const items = denominations.map((value: number) => ({
        label: `${params.currencyCode} ${value}`,
        value: value.toString(),
      }));
      // showLogs("denominations", denominations);
      if (!denominations.length) {
        items.push({
          label: "Custom Amount",
          value: "custom",
        });
      }
      setAmountItems(items);
    }
  }, [params.denominations]);

  useEffect(() => {
    if (amount && quantity) {
      validateOrder();
    }
  }, [amount, quantity]);

  const validateOrder = async () => {
    if (!amount || !quantity) return;

    try {
      setValidating(true);

      const productData = productDetails?.product || {
        productId: params.productId,
        denominationType: params.denominations ? "FIXED" : "RANGE",
        minAmount: parseFloat(params.minAmount),
        maxAmount: parseFloat(params.maxAmount),
        senderFee: parseFloat(params.senderFee),
      };

      try {
        // const amountValue = parseFloat(amount);
        const amountValue = parseFloat(amount).toFixed(2);
        const quantityValue = parseInt(quantity);

        const priceResponse = await apiService.checkGiftCardPrice(
          productData.productId.toString(),
          amountValue,
          quantityValue
        );

        showLogs("priceResponse", priceResponse);

        if (priceResponse.status === "success") {
          setPrice(priceResponse.data.price);
          setFeeAmount(priceResponse.data.fee_amount);
          setTotalAmount(priceResponse.data.total_amount);
        } else {
          // Fallback to local calculation if API fails
          const senderFeePercentage =
            (productData as _TSFixMe).senderFeePercentage ||
            parseFloat(params.senderFee);
          const calculatedFee =
            (+amountValue * quantityValue * senderFeePercentage) / 100;
          const calculatedTotal = +amountValue * quantityValue + calculatedFee;

          setFeeAmount(calculatedFee);
          setTotalAmount(calculatedTotal);
        }
      } catch (error) {
        console.log("Price check API error, using local calculation", error);
        // Fallback to local calculation
        const amountValue = parseFloat(amount);
        const quantityValue = parseInt(quantity);
        const senderFeePercentage =
          (productData as _TSFixMe).senderFeePercentage ||
          parseFloat(params.senderFee);
        const calculatedFee =
          (amountValue * quantityValue * senderFeePercentage) / 100;
        const calculatedTotal = amountValue * quantityValue + calculatedFee;

        setFeeAmount(calculatedFee);
        setTotalAmount(calculatedTotal);
      }
    } catch (error: any) {
      console.error("Validation calculation error:", error);
      Alert.alert("Validation Error", error.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !quantity || !recipientName || !recipientEmail) {
      return showErrorToast({
        title: "Error",
        desc: "Please fill in all required fields",
      });
    }

    const minAmount = productDetails?.product.minRecipientDenomination || 0;
    const maxAmount = productDetails?.product.maxRecipientDenomination || 0;

    console.log({ minAmount, maxAmount });
    if (minAmount > 0 && +amount < minAmount) {
      return showErrorToast({
        title: `Minimum gift card amount of ${minAmount} required`,
      });
    }

    if (maxAmount > 0 && +amount > maxAmount) {
      return showErrorToast({
        title: `Maximum gift card amount of ${maxAmount} exceeded`,
      });
    }

    try {
      setLoading(true);

      const productData = productDetails?.product || {
        productId: params.productId,
        denominationType: params.denominations ? "FIXED" : "RANGE",
        minAmount: parseFloat(params.minAmount),
        maxAmount: parseFloat(params.maxAmount),
        senderFee: parseFloat(params.senderFee),
      };

      router.push({
        pathname: "/GiftCardPreview",
        params: {
          productId: productData.productId.toString(),
          productName:
            (productData as _TSFixMe).productName || params.productName,
          amount: amount,
          quantity: quantity,
          recipientName: recipientName,
          recipientEmail: recipientEmail,
          totalAmount: totalAmount.toString(),
          feeAmount: feeAmount.toString(),
          price: price.toString(),
          currencyCode: getCurrencyCode(),
          logoUrl: productDetails?.product?.logoUrls?.[0] || "",
        },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get currency code from product details or params
  const getCurrencyCode = () => {
    return (
      productDetails?.product?.recipientCurrencyCode || params.currencyCode
    );
  };

  // Handle custom amount input for RANGE type cards
  const handleCustomAmountChange = (text: string) => {
    setAmount(text);
  };

  // Render custom amount input for RANGE type cards
  const renderAmountInput = () => {
    const currencyCode = getCurrencyCode();
    const product = productDetails?.product;

    if (product && product.denominationType === "RANGE") {
      return (
        <>
          <Text style={styles.label}>
            Amount ({currencyCode} {product.minRecipientDenomination} -{" "}
            {product.maxRecipientDenomination})
          </Text>
          <TextInput
            style={styles.input}
            value={amount || ""}
            onChangeText={handleCustomAmountChange}
            keyboardType="numeric"
            placeholder={`Enter amount between ${product.minRecipientDenomination} - ${product.maxRecipientDenomination}`}
            placeholderTextColor="#999"
          />
        </>
      );
    }

    return (
      <>
        <Text style={styles.label}>Amount</Text>
        <DropDownPicker
          open={amountOpen}
          value={amount}
          items={amountItems}
          setOpen={setAmountOpen}
          setValue={setAmount}
          placeholder="Select Amount"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          textStyle={styles.dropdownText}
          labelStyle={styles.dropdownLabel}
          onChangeValue={() => {
            console.log("value changed");
          }}
        />
      </>
    );
  };

  // Get fee percentage from product details or params
  const getFeePercentage = () => {
    return productDetails?.product?.senderFeePercentage || params.senderFee;
  };

  // Render main content sections
  const renderContent = () => {
    if (fetchingProduct) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingComp visible />
        </View>
      );
    }

    return (
      <>
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <Image
            source={{
              uri:
                productDetails?.product?.logoUrls?.[0] ||
                `https://cdn.reloadly.com/giftcards-v2/${params.productName
                  .toLowerCase()
                  .replace(/\s+/g, "-")}.png`,
            }}
            style={styles.cardImage}
            defaultSource={require("../assets/icons/gift.png")}
          />
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>
              {productDetails?.product?.productName || params.productName}
            </Text>
            <Text style={styles.cardSubtitle}>
              {getCurrencyCode()}{" "}
              {productDetails?.product?.minRecipientDenomination ||
                params.minAmount}{" "}
              -{" "}
              {productDetails?.product?.maxRecipientDenomination ||
                params.maxAmount}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getCurrencyCode()}</Text>
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Gift Card Details</Text>

          {/* Amount Selection */}
          {renderAmountInput()}

          {/* Fee Notice */}
          <View style={styles.feeNotice}>
            <AntDesign name="infocirlce" size={16} color="#666" />
            <Text style={styles.feeText}>
              {getFeePercentage()}% service fee applies
            </Text>
          </View>

          {/* Quantity */}
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Enter quantity"
            placeholderTextColor="#999"
          />

          {/* Recipient Details */}
          <Text style={styles.sectionTitle}>Recipient Information</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Recipient's name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            keyboardType="email-address"
            placeholder="Recipient's email"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Redemption Instructions */}
        {productDetails?.product?.redeemInstruction && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Redemption Instructions</Text>
            <Text style={styles.instructionText}>
              {productDetails.product.redeemInstruction.verbose}
            </Text>
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceTitle}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₦{formatAmount(user?.wallet_balance ?? 0)}
            </Text>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total (inc. fee)</Text>
            {validating ? (
              <ActivityIndicator size="small" color="#0066FF" />
            ) : (
              <Text style={styles.totalAmount}>
                NGN {formatAmount(totalAmount)}
              </Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Continue to Review</Text>
              <AntDesign name="arrowright" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </>
    );
  };

  // Use a list item renderer for FlatList
  const renderItem = () => {
    return (
      <>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Purchase Gift Card</Text>
          <View style={styles.placeholder} />
        </View>

        {renderContent()}
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Using FlatList instead of ScrollView to avoid nested VirtualizedLists error */}
      <FlatList
        data={[{ key: "content" }]}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  placeholder: {
    width: 40,
  },
  cardPreview: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  cardDetails: {
    marginLeft: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  formSection: {
    padding: 16,
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 50,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1A1A1A",
  },
  dropdownLabel: {
    fontWeight: "600",
  },
  feeNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  feeText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: "#1A1A1A",
  },
  summarySection: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  balanceTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  submitButton: {
    backgroundColor: COLORS.swiftPayBlue,
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.swiftPayBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
});

export default CardScreen;
