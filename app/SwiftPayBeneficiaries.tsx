import { showErrorToast, showSuccessToast } from "@/components/ui/Toast";
import { DEFAULT_PHOTO } from "@/constants";
import { useAuth, User } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { _TSFixMe, getInitials } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Dialog } from "@rneui/themed";
import { Image } from "expo-image";
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
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { COLORS } from "@/constants/Colors";

export type Beneficiary = {
  id: number;
  user_id: number;
  beneficiary_id: number;
  reference: string;
  description: string;
  amount: string;
  status: "successful" | "pending" | "failed";
  created_at: string;
  updated_at: string;
  source_link: string | null;
  if_favorite: boolean;
  receiver: User;
};

// type Favorite = {
//   id: number;
//   first_name: string;
//   last_name: string;
//   email: string;
//   username: string;
//   name: string;
//   profile_photo: string;
//   hash_id: string;
// };

type DialogComponentProps = {};

const SwiftPayBeneficiaries: React.FC = () => {
  const { data } = useLocalSearchParams();
  const parsedData = JSON.parse((data as string) || "{}");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryFav, setSearchQueryFav] = useState("");
  const [activeTab, setActiveTab] = useState<"Recent" | "Favourites">("Recent");
  const [visibleMenu, setVisibleMenu] = useState<number | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [favorites, setFavorites] = useState<Beneficiary[]>([]);
  const animation = useRef(new RNAnimated.Value(0)).current;
  const { displayLoader, hideLoader } = useAuth();
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    getBeneficiaries();
  }, []);

  async function getBeneficiaries() {
    try {
      const beneficiaries = await apiService.swiftPayTransferBeneficiaries();
      //   showLogs("beneficiaries", beneficiaries);
      setBeneficiaries(beneficiaries.data.recent_transfers);
      setFavorites(
        beneficiaries.data.recent_transfers.filter(
          (t: Beneficiary) => t.if_favorite
        )
      );
    } catch (error) {
      showLogs("error getting beneficiaries", error);
    }
  }

  const toggleFavorite = async (id: number, isBeneficiary: boolean) => {
    displayLoader();
    try {
      await apiService.toggleSwiftpayFavorite(id);
      getBeneficiaries();
      showSuccessToast({
        title: "Success!",
        desc: `Successfully ${isBeneficiary ? "removed" : "added"} as favorite`,
      });
      setVisibleMenu(null);
    } catch (error) {
      showLogs("error", error);
      showErrorToast({
        title: "An error occured",
        desc: `Failed to ${isBeneficiary ? "remove" : "add"} as favorite`,
      });
    } finally {
      hideLoader();
    }
  };

  function onOpenSheet(item: Beneficiary) {
    showLogs("item", item);
    const options = [
      item.if_favorite ? "Remove from favorites" : "Add to favorites",
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
            toggleFavorite(item.receiver.id, item.if_favorite);
            break;

          case destructiveButtonIndex:
        }
      }
    );
  }

  //   showLogs("beneficiaries", beneficiaries);
  //   showLogs("favorites", favorites);

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearchQuery =
      b?.receiver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b?.receiver?.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearchQuery;
  });

  const filteredFavorites = favorites.filter((b) => {
    const matchesSearchQuery =
      b?.receiver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b?.receiver?.username.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearchQuery;
  });

  const [visible2, setVisible2] = useState(false);

  const toggleDialog2 = () => {
    setVisible2(!visible2);
  };

  const renderBeneficiary = ({
    item,
    index,
  }: {
    item: _TSFixMe;
    index: number;
  }) => {
    const isOpen = visibleMenu === item.id;

    return (
      <Animated.View
        entering={FadeInDown.delay(100 * index + 1)}
        exiting={FadeOutDown.delay(100 * index + 1)}
        style={styles.beneficiaryContainer}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "./SendToBeneficiary",
              params: {
                name: item.receiver.name,
                swiftpayTag: item.receiver.username ?? "",
                accountNumber: "",
                image: item.receiver.profile_photo ?? DEFAULT_PHOTO,
              },
            })
          }
          style={styles.innerContainer}
        >
          {item.receiver.profile_photo ? (
            <Image
              source={{ uri: item.receiver.profile_photo }}
              style={{ height: 40, width: 40, borderRadius: 50 }}
            />
          ) : (
            <View style={styles.bankInitialContainer}>
              <Text className="text-[#0000ff] font-semibold text-base">
                {getInitials(item.receiver.name)}
              </Text>
            </View>
          )}

          <View style={styles.beneficiaryDetails}>
            <Text style={styles.beneficiaryName}>{item.receiver.name}</Text>
            <Text style={styles.beneficiaryTag}>@{item.receiver.username}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ position: "relative" }}>
          <TouchableOpacity onPress={() => onOpenSheet(item)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderFavorite = ({
    item,
    index,
  }: {
    item: _TSFixMe;
    index: number;
  }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(100 * index + 1)}
        exiting={FadeOutDown.delay(100 * index + 1)}
        style={styles.beneficiaryContainer}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "./SendToBeneficiary",
              params: {
                name: item.receiver.name,
                swiftpayTag: item.receiver.username ?? "",
                accountNumber: "",
                image: item.receiver.profile_photo,
              },
            })
          }
          style={styles.innerContainer}
        >
          {item.receiver.profile_photo ? (
            <Image
              source={{ uri: item.receiver.profile_photo }}
              style={{ height: 40, width: 40, borderRadius: 50 }}
            />
          ) : (
            <View style={styles.bankInitialContainer}>
              <Text className="text-[#0000ff] font-semibold text-base">
                {getInitials(item.receiver.name)}
              </Text>
            </View>
          )}

          <View style={styles.beneficiaryDetails}>
            <Text style={styles.beneficiaryName}>{item.receiver.name}</Text>
            <Text style={styles.beneficiaryTag}>@{item.receiver.username}</Text>
          </View>

          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={() => onOpenSheet(item)}>
              <Ionicons name="ellipsis-vertical" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
        renderItem={activeTab === "Recent" ? renderBeneficiary : renderFavorite}
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
  menuText: {
    fontSize: 16,
  },
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
    gap: 8,
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
    zIndex: 9999,
    elevation: 10,
    width: 250,
    height: 60,
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

export default SwiftPayBeneficiaries;
