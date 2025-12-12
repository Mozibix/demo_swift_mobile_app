import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiService } from "../services/api";
import * as SecureStore from "expo-secure-store";
import { cn } from "@/utils";
import { IS_IOS_DEVICE } from "@/constants";
import LoadingComp from "@/components/Loading";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { showLogs } from "@/utils/logger";

// Interface for the new product structure from the API
interface GiftCardProduct {
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
  minRecipientDenomination?: number;
  maxRecipientDenomination?: number;
  senderCurrencyCode: string;
  minSenderDenomination?: number;
  maxSenderDenomination?: number;
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
}

const SelectGiftCard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<GiftCardProduct[]>([]);
  const [allProducts, setAllProducts] = useState<GiftCardProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);

  useEffect(() => {
    loadCountryData();
  }, []);

  const loadCountryData = async () => {
    try {
      const code = await SecureStore.getItemAsync("selectedCountryCode");
      const name = await SecureStore.getItemAsync("selectedCountryName");

      if (!code) {
        Alert.alert("Error", "No country selected");
        router.back();
        return;
      }

      setCountryCode(code);
      setCountryName(name);
      fetchProducts(code);
    } catch (error) {
      console.error("Error loading country data:", error);
      Alert.alert("Error", "Failed to load country data");
      router.back();
    }
  };

  // useEffect(() => {
  //   if (countryCode) {
  //     const delayDebounceFn = setTimeout(() => {
  //       fetchProducts(countryCode);
  //     }, 500);
  //     return () => clearTimeout(delayDebounceFn);
  //   }
  // }, [searchQuery]);

  const fetchProducts = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiService.getGiftCardProducts(code, searchQuery);
      if (response.status === "success") {
        setProducts(response.data);
        setAllProducts(response.data);
      }
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch gift cards");
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setSearchQuery("");
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter((product) =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  // Function to get product denomination info for display
  const getProductPriceRange = (product: GiftCardProduct): string => {
    if (
      product.denominationType === "FIXED" &&
      product.fixedRecipientDenominations.length > 0
    ) {
      // For fixed denominations, show the available options
      return `${
        product.recipientCurrencyCode
      } ${product.fixedRecipientDenominations.join(", ")}`;
    } else if (product.denominationType === "RANGE") {
      // For range denominations, show the min-max range
      return `${product.recipientCurrencyCode} ${product.minRecipientDenomination} - ${product.maxRecipientDenomination}`;
    }
    return `${product.recipientCurrencyCode}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className={cn(IS_IOS_DEVICE ? "mx-5" : "mt-5")}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {countryName ? `${countryName} Gift Cards` : "Select Gift Cards"}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Subheader */}
        <Text style={styles.subHeader}>
          Which gift card would you like to buy?
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <AntDesign
            name="search1"
            size={18}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a gift card..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={onClear} style={styles.clearIcon}>
              <AntDesign name="closecircle" size={18} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Loading Indicator */}
        {loading ? (
          <LoadingComp visible />
        ) : (
          /* List of Gift Cards */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-48"
          >
            {products.length > 0 ? (
              products.map((product, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(100 * index + 1)}
                  exiting={FadeOutDown.delay(100 * index + 1)}
                >
                  <TouchableOpacity
                    activeOpacity={0.6}
                    key={index}
                    style={styles.card}
                    onPress={() => {
                      showLogs("product", product);
                      router.push({
                        pathname: "/CardScreen",
                        params: {
                          productId: product.productId.toString(),
                          productName: product.productName,
                          minAmount:
                            product.denominationType === "RANGE"
                              ? product.minRecipientDenomination?.toString()
                              : product.fixedRecipientDenominations[0]?.toString(),
                          maxAmount:
                            product.denominationType === "RANGE"
                              ? product.maxRecipientDenomination?.toString()
                              : product.fixedRecipientDenominations[
                                  product.fixedRecipientDenominations.length - 1
                                ]?.toString(),
                          denominations: JSON.stringify(
                            product.fixedRecipientDenominations
                          ),
                          senderFee: product.senderFeePercentage,
                          currencyCode: product.recipientCurrencyCode,
                        },
                      });
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          product.logoUrls && product.logoUrls.length > 0
                            ? product.logoUrls[0]
                            : `https://cdn.reloadly.com/giftcards-v2/default.png`,
                      }}
                      style={styles.icon}
                      defaultSource={require("../assets/icons/gift.png")}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.cardText}>{product.productName}</Text>
                      <Text style={styles.currencyText}>
                        {getProductPriceRange(product)}
                      </Text>
                      {product.discountPercentage > 0 && (
                        <Text style={styles.discountText}>
                          {product.discountPercentage}% discount
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <Text style={styles.noResults}>No gift cards found</Text>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
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
  subHeader: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearIcon: {
    paddingLeft: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
  },
  currencyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  discountText: {
    fontSize: 14,
    color: "#00a651",
    fontWeight: "600",
    marginTop: 4,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  noResults: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
});

export default SelectGiftCard;
