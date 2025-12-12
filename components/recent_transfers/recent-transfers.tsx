import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import React, { Fragment, useEffect, useState } from "react";
import useDataStore from "@/stores/useDataStore";
import { useRouter } from "expo-router";
import { Transfer } from "@/services/api";
import { BottomSheet } from "@rneui/themed";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { getInitials } from "@/utils";
import { showLogs } from "@/utils/logger";
import { User } from "@/context/AuthContext";
import { Image } from "expo-image";

export default function RecentTransfers({
  onSelectBeneficiary,
  type = "bank",
}: {
  onSelectBeneficiary: (item: Transfer | User) => void;
  type?: "swiftPay" | "bank";
}) {
  const [showSheet, setShowSheet] = useState(false);
  const recent_transfers = useDataStore((state) => state.recent_transfers);
  const recent_transfers_swiftPay = useDataStore(
    (state) => state.recent_transfers_swiftPay
  );

  const recents_to_use =
    type === "bank"
      ? (recent_transfers as Transfer[])
      : (recent_transfers_swiftPay as User[]);

  const [searchQuery, setSearchQuery] = useState("");

  // showLogs("recent_transfers_swiftPay", recent_transfers_swiftPay);
  // showLogs("recents_to_use", recents_to_use);
  // showLogs("type", type);

  const filteredTransfers = recents_to_use.filter((item) => {
    const query = searchQuery.toLowerCase();

    if (type === "bank") {
      const transfer = item as Transfer;
      return (
        transfer.account_name.toLowerCase().includes(query) ||
        transfer.account_number.includes(query) ||
        transfer.bank_name.toLowerCase().includes(query)
      );
    } else {
      const user = item as User;
      return user.username.toLowerCase().includes(query);
    }
  });

  function renderFlatList<T extends Transfer | User>(data: T[]) {
    return (
      <FlatList
        data={data}
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
                  {getInitials((item as Transfer).account_name)}
                </Text>
              ) : (
                <Image
                  source={{ uri: "https://swiftpaymfb.com/default.png" }}
                  style={{ height: 30, width: 30, borderRadius: 50 }}
                  contentFit="cover"
                />
              )}
            </View>
            <View>
              {type === "bank" ? (
                <View>
                  <Text className="text-base font-bold text-black">
                    {(item as Transfer).account_name}
                  </Text>

                  <Text className="text-sm text-gray-500">
                    {(item as Transfer).account_number}{" "}
                    {(item as Transfer).bank_name}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text className="text-base font-bold text-black">
                    {(item as User).name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {(item as User).username}
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
        ? renderFlatList(filteredTransfers as Transfer[])
        : renderFlatList(filteredTransfers as User[])}

      {filteredTransfers.length > 0 && (
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
              ? renderFlatList(filteredTransfers as Transfer[])
              : renderFlatList(filteredTransfers as User[])}
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
