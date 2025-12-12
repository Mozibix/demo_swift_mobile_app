import { Favorite, SwiftpayFavorite } from "@/services/api";
import useDataStore from "@/stores/useDataStore";
import { getInitials } from "@/utils";
import { AntDesign } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import { Image } from "expo-image";
import React, { Fragment, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function Favorites({
  onSelectBeneficiary,
  type = "bank",
}: {
  onSelectBeneficiary: (item: Favorite | SwiftpayFavorite) => void;
  type?: "swiftPay" | "bank";
}) {
  const [showSheet, setShowSheet] = useState(false);
  const bank_favorites = useDataStore((state) => state.bank_favorites);
  const swiftpay_favorites = useDataStore((state) => state.swiftpay_favorites);
  const bank_favorites_to_use =
    type === "bank"
      ? (bank_favorites as Favorite[])
      : (swiftpay_favorites as SwiftpayFavorite[]);

  const [searchQuery, setSearchQuery] = useState("");

  // showLogs("type", type);
  //   showLogs("swiftpay_favorites", swiftpay_favorites);

  const filteredFavorites = bank_favorites_to_use.filter((item) => {
    const query = searchQuery.toLowerCase();

    if (type === "bank") {
      const transfer = item as Favorite;
      return (
        transfer.acct_name.toLowerCase().includes(query) ||
        transfer.acct_number.includes(query) ||
        transfer.bank_name.toLowerCase().includes(query)
      );
    } else {
      const user = item as SwiftpayFavorite;
      return user.username?.toLowerCase().includes(query);
    }
  });

  function renderFlatList<T extends Favorite | SwiftpayFavorite>(data: T[]) {
    return (
      <FlatList
        data={showSheet ? data : data.slice(0, 3)}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              onSelectBeneficiary(item);
              setShowSheet(false);
            }}
            className="flex-row items-center mb-4"
          >
            <View className="w-10 h-10 rounded-full bg-[#c6d9ff] justify-center items-center mr-3">
              {type === "bank" ? (
                <Text className="text-[#0000ff] font-semibold text-base">
                  {getInitials((item as Favorite).acct_name)}
                </Text>
              ) : (
                <Image
                  source={{ uri: (item as SwiftpayFavorite).profile_photo }}
                  style={{ height: 30, width: 30, borderRadius: 50 }}
                  contentFit="cover"
                />
              )}
            </View>
            <View>
              {type === "bank" ? (
                <View>
                  <Text className="text-base font-bold text-black">
                    {(item as Favorite).acct_name}
                  </Text>

                  <Text className="text-sm text-gray-500">
                    {(item as Favorite).acct_number}{" "}
                    {(item as Favorite).bank_name}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text className="text-base font-bold text-black">
                    {(item as SwiftpayFavorite).first_name +
                      " " +
                      (item as SwiftpayFavorite).last_name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {(item as SwiftpayFavorite).username}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="mb-4">
            <Text className="text-[16px] font-medium">No recents found</Text>
          </View>
        )}
      />
    );
  }

  return (
    <Fragment>
      {type === "bank"
        ? renderFlatList(filteredFavorites as Favorite[])
        : renderFlatList(filteredFavorites as SwiftpayFavorite[])}

      {filteredFavorites.length > 0 && (
        <TouchableOpacity onPress={() => setShowSheet(true)}>
          <Text className="text-center font-semibold text-swiftPayBlue">
            View more
          </Text>
        </TouchableOpacity>
      )}
      <BottomSheet
        isVisible={showSheet}
        onBackdropPress={() => setShowSheet(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Recents</Text>
            <TouchableOpacity onPress={() => setShowSheet(false)}>
              <AntDesign
                name="closecircleo"
                size={20}
                color={"red"}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              flexGrow: 1,
            }}
            extraScrollHeight={60}
            enableOnAndroid={true}
            style={{ minHeight: 400 }}
          >
            <TextInput
              style={styles.input}
              placeholder="Search banks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.iconWrapper}>
              <AntDesign name="search1" size={20} color="#888" />
            </View>

            {type === "bank"
              ? renderFlatList(filteredFavorites as Favorite[])
              : renderFlatList(filteredFavorites as SwiftpayFavorite[])}
          </KeyboardAwareScrollView>
        </View>
      </BottomSheet>
    </Fragment>
  );
}

export const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    left: 96,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
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
  icon: {
    width: 25,
    height: 25,
  },
  iconWrapper: {
    position: "absolute",
    right: 10,
    top: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
    marginBottom: 10,
  },
});
