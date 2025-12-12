import { AntDesign } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../services/api";
import { cn } from "@/utils";
import { IS_IOS_DEVICE } from "@/constants";
import LoadingComp from "@/components/Loading";

const SelectCountryScreen: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  // const [countries, setCountries] = useState<any[]>([]);
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCountries();
  }, []);

  // useEffect(() => {
  //   const delayDebounceFn = setTimeout(() => {
  //     fetchCountries();
  //   }, 500);

  //   return () => clearTimeout(delayDebounceFn);
  // }, [searchQuery]);

  useEffect(() => {
    filterCountries();
  }, [searchQuery, allCountries]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGiftCardCountries(searchQuery);
      if (response.status === "success") {
        setAllCountries(response.data);
        setFilteredCountries(response.data);
      }
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch countries");
    } finally {
      setLoading(false);
    }
  };

  function filterCountries() {
    if (!searchQuery.trim()) {
      setFilteredCountries(allCountries);
      return;
    }

    // Filter countries based on name or currency
    const filtered = allCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.currency_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        country.currency_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredCountries(filtered);
  }

  const onClear = () => {
    setSearchQuery("");
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
          <Text style={styles.headerText}>Buy Gift Cards</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Subheader */}
        <Text style={styles.subHeader}>
          Which country would you like to buy from?
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
            placeholder="Search for a country..."
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
          <FlatList
            data={filteredCountries}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            ListEmptyComponent={
              <Text style={styles.noResults}>No countries found</Text>
            }
            renderItem={({ item: country, index }) => (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    padding: 12,
                    borderRadius: 2,
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
                onPress={async () => {
                  try {
                    await SecureStore.setItemAsync(
                      "selectedCountryCode",
                      String(country.iso_name)
                    );
                    await SecureStore.setItemAsync(
                      "selectedCountryName",
                      String(country.name)
                    );
                    router.push("/SelectGiftCard");
                  } catch (error) {
                    console.error("Error storing country data:", error);
                    Alert.alert(
                      "Error",
                      "Failed to store country data. Please try again."
                    );
                  }
                }}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: country.flag_url }}
                  style={{
                    width: 40,
                    height: 40,
                    // borderRadius: 100,
                    marginRight: 12,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 4,
                    },
                    shadowOpacity: 0.5,
                    shadowRadius: 3,
                  }}
                  contentFit="contain"
                  transition={200}
                />
                <View style={styles.countryInfo}>
                  <Text
                    style={[
                      styles.cardText,
                      {
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1A1A1A",
                        marginTop: 15,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {country.name}
                  </Text>
                  <Text
                    style={[
                      styles.currencyText,
                      {
                        fontSize: 14,
                        color: "#666",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {country.currency_name} ({country.currency_code})
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
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
  },
  backButton: {
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    color: "#1A1A1A",
  },
  placeholder: {
    width: 48,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A1A",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  clearIcon: {
    padding: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  flagContainer: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  flagLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  countryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  currencyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noResults: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "600",
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default SelectCountryScreen;
