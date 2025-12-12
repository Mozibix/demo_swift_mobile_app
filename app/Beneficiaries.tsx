import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { DEFAULT_PHOTO } from "@/constants";
import { apiService } from "@/services/api";
import { getInitials } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Dialog } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as SecureStore from "expo-secure-store";

export type Beneficiary = {
  id: number;
  user_id: number;
  reference: string;
  status: "pending" | "success" | "failed";
  last_status_check_at: string | null;
  amount: number;
  fee: number;
  description: string;
  type: "bank" | string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  created_at: string;
  updated_at: string;
  username: string;
  transfer_id: string;
  bulk_transfer_id: string | null;
  source_link: string | null;
  is_beneficiary: boolean;
  hash_id: string;
};

type DialogComponentProps = {};

const Beneficiaries: React.FC = () => {
  const { data } = useLocalSearchParams();
  const parsedData = JSON.parse((data as string) || "{}");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryFav, setSearchQueryFav] = useState("");
  const [activeTab, setActiveTab] = useState<"Recent" | "Favourites">("Recent");
  const [visibleMenu, setVisibleMenu] = useState<number | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [favorites, setFavorites] = useState<Beneficiary[]>([]);
  const [percentageTransferFee, setPercentageTransferFee] = useState();
  const [fixedTransferFee, setFixedTransferFee] = useState();
  const animation = useRef(new RNAnimated.Value(0)).current;
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    getBeneficiaries();
    fetchBanks();
  }, []);
  // Filter beneficiaries based on search query and active tab
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearchQuery =
      b?.account_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b?.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b?.account_number?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearchQuery;
  });

  const filteredFavorites = favorites.filter((b) => {
    const matchesSearchQuery =
      b?.account_name?.toLowerCase().includes(searchQueryFav.toLowerCase()) ||
      b?.bank_name?.toLowerCase().includes(searchQueryFav.toLowerCase()) ||
      b?.account_number?.toLowerCase().includes(searchQueryFav.toLowerCase());

    return matchesSearchQuery;
  });

  async function getBeneficiaries() {
    try {
      const beneficiaries = await apiService.getBankTransferBeneficiaries();
      // showLogs("beneficiaries.data.transfers", beneficiaries.data.transfers);
      setBeneficiaries(beneficiaries.data.transfers);
      setFavorites(
        beneficiaries.data.transfers.filter(
          (b: Beneficiary) => b.is_beneficiary
        )
      );
    } catch (error) {
      showLogs("error getting beneficiaries", error);
    }
  }

  const fetchBanks = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      const response = await fetch(
        "https://swiftpaymfb.com/api/bank-transfer",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setFixedTransferFee(data.data.fixed_transfer_fee);
      setPercentageTransferFee(data.data.percentage_transfer_fee);
    } catch (error: any) {
    } finally {
    }
  };

  const toggleMenu = (id: number) => {
    setVisibleMenu(visibleMenu === id ? null : id);
  };

  const toggleFavorite = async (id: number, isBeneficiary: boolean) => {
    try {
      const response = await apiService.toggleBankFavorite(id);
      getBeneficiaries();
      showSuccessToast({
        title: "Success!",
        desc: `Successfully ${isBeneficiary ? "removed" : "added"} as favorite`,
      });
      setVisibleMenu(null);
    } catch (error) {
      showErrorToast({
        title: "An error occured",
        desc: `Failed to ${isBeneficiary ? "remove" : "add"} as favorite`,
      });
    }
  };

  const [visible2, setVisible2] = useState(false);

  const toggleDialog2 = () => {
    setVisible2(!visible2);
  };

  function onOpenSheet(item: Beneficiary) {
    const options = [
      item.is_beneficiary ? "Remove from favorites" : "Add to favorites",
      "Cancel",
    ];
    const destructiveButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
      },
      (selectedIndex?: number) => {
        switch (selectedIndex) {
          case 0:
            toggleFavorite(item.id, item.is_beneficiary);
            break;

          case destructiveButtonIndex:
        }
      }
    );
  }

  const renderBeneficiary = ({
    item,
    index,
  }: {
    item: Beneficiary;
    index: number;
  }) => {
    const isOpen = visibleMenu === item.id;

    const handleToggleFavorite = (isBeneficiary: boolean) => {
      toggleFavorite(item.id, isBeneficiary);
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(100 * index + 1)}
        exiting={FadeOutDown.delay(100 * index + 1)}
        style={styles.beneficiaryContainer}
        layout={LinearTransition.springify().damping(20)}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "./SendToBeneficiary",
              params: {
                type: "bank",
                name: item.account_name,
                swiftpayTag: item.username ?? "",
                accountNumber: item.account_number,
                image: DEFAULT_PHOTO,
                bankName: item.bank_name,
                fixedFee: fixedTransferFee,
                percentageFee: percentageTransferFee,
                bank_code: item.bank_code,
              },
            })
          }
          style={styles.innerContainer}
        >
          <View style={styles.bankInitialContainer}>
            <Text className="text-[#0000ff] font-semibold text-base">
              {getInitials(item.account_name)}
            </Text>
          </View>

          <View style={styles.beneficiaryDetails}>
            <Text style={styles.beneficiaryName}>{item.account_name}</Text>
            <Text style={styles.beneficiaryTag}>{item.account_number}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ position: "relative" }}>
          <TouchableOpacity onPress={() => onOpenSheet(item)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>

          {isOpen && (
            <RNAnimated.View
              style={[
                styles.dropdownMenu,
                {
                  opacity: animation,
                  transform: [
                    {
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleToggleFavorite(item.is_beneficiary)}
              >
                <AntDesign
                  name={item.is_beneficiary ? "star" : "staro"}
                  size={20}
                  color={item.is_beneficiary ? "gold" : "#666"}
                />
                <Text style={styles.menuText}>
                  {item.is_beneficiary
                    ? "Remove from Favorites"
                    : "Add to Favorites"}
                </Text>
              </TouchableOpacity>
            </RNAnimated.View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Beneficiaries</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
        {activeTab === "Recent" ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search beneficiaries"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        ) : (
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorites"
            value={searchQueryFav}
            onChangeText={setSearchQueryFav}
          />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("Recent")}
          style={[styles.tab, activeTab === "Recent" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Recent" && styles.activeTabText,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Favourites")}
          style={[styles.tab, activeTab === "Favourites" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Favourites" && styles.activeTabText,
            ]}
          >
            Favourites
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={
          activeTab === "Recent" ? filteredBeneficiaries : filteredFavorites
        }
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBeneficiary}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View>
            <Text className="text-gray-300 text-center text-[16px]">
              No beneficiaries found
            </Text>
          </View>
        )}
      />

      <Dialog
        isVisible={visible2}
        onBackdropPress={toggleDialog2}
        overlayStyle={styles.dialog} // Apply the dialog style here
      >
        <Text style={styles.text}>
          Are you sure you want to delete this beneficiary?
        </Text>
        <Dialog.Actions>
          <View style={styles.btns}>
            <TouchableOpacity
              style={styles.dialogButton}
              onPress={() => console.log("Primary Action Clicked!")}
            >
              <Text style={styles.dialogButtonText1}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogButton1}
              onPress={() => console.log("Secondary Action Clicked!")}
            >
              <Text style={styles.dialogButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Dialog.Actions>
      </Dialog>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // existing styles remain the same
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
    marginTop: 40,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 50,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bankInitialContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c6d9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
    color: "#888",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    width: "90%",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-around",
    left: -50,
  },
  tab: {
    alignItems: "center",
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#00CB14",
  },
  tabText: {
    color: "#888",
    fontSize: 16,
  },
  activeTabText: {
    color: "#00CB14",
    fontWeight: "bold",
  },
  beneficiaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  beneficiaryImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  beneficiaryDetails: {
    flex: 1,
  },
  beneficiaryName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  beneficiaryTag: {
    color: "#888",
    marginTop: 4,
  },
  menu: {
    height: 100,
    padding: 5,
  },
  kebab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {},
  button: {
    borderRadius: 6,
    width: 220,
    margin: 20,
    borderWidth: 1, // Add border width
    borderColor: "#ddd", // Add border color
    backgroundColor: "#f5f5f5", // Add background color
  },
  buttonContainer: {
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#fff", // Background color of the dialog
    borderRadius: 10, // Border radius for the dialog
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "85%",
  },
  dialogButton: {
    borderWidth: 1, // Border width for the button
    borderColor: "#0000ff", // Border color for the button
    backgroundColor: "#fff", // Background color for the button
    borderRadius: 8, // Border radius for the button
    marginHorizontal: 10,
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  dialogButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  dialogButtonText1: {
    color: "#0000ff",
    textAlign: "center",
  },
  dialogButton1: {
    borderWidth: 1, // Border width for the button
    borderColor: "#ddd", // Border color for the button
    backgroundColor: "#1400fb", // Background color for the button
    borderRadius: 8, // Border radius for the button
    marginHorizontal: 10,
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  btns: {
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  text: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },

  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 28,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    width: 200,
    borderWidth: 1,
    borderColor: "#ebeaea",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
});

export default Beneficiaries;
