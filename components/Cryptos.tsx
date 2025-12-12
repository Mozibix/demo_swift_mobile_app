import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { Holding } from "../services/api";
import LoadingComp from "./Loading";
import { formatAmount, formatDate, formatDateShort } from "@/utils";
import { showLogs } from "@/utils/logger";
import { Image } from "expo-image";

interface CryptosProps {
  holdings?: Holding[];
  totalAssets?: number;
  isLoading: boolean;
}

const getAssetIcon = (assetType: string) => {
  if (assetType.toLowerCase() === "fiat") {
    return require("../assets/icons/bitcoin.png");
  }
  if (assetType.toLowerCase() === "metal") {
    return require("../assets/icons/gold.png");
  }
};

const Cryptos: React.FC<CryptosProps> = ({ holdings = [], isLoading }) => {
  if (isLoading) {
    return <LoadingComp visible />;
  }

  if (!holdings.length) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("../assets/payments/6.png")}
          style={{
            width: 180,
            height: 180,
            resizeMode: "cover",
          }}
        />
        <Text style={styles.emptyText}>No active holdings</Text>
      </View>
    );
  }

  // showLogs("holdings", holdings);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {holdings.map((holding) => (
        <TouchableOpacity
          key={holding.id}
          style={styles.itemContainer}
          onPress={() =>
            router.push({
              pathname: "/HardCurrencyDetails",
              params: {
                id: holding.id,
                assetType: holding.asset_type,
                assetName: holding.asset_name,
                assetSymbol: holding.asset_symbol,
              },
            })
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Image
              source={{ uri: holding.icon_url }}
              style={
                holding.asset_type === "fiat" ? styles.icon : styles.iconMetal
              }
            />
            <View>
              <Text
                style={
                  holding.asset_type === "fiat"
                    ? styles.title
                    : styles.titleMetal
                }
                className="capitalize"
              >
                {holding.asset_name}
              </Text>
              <Text
                style={
                  holding.asset_type === "fiat"
                    ? styles.subText
                    : styles.subTextMetal
                }
              >
                {holding.naira_start_rate?.toLocaleString() ||
                  holding.current_rate.toLocaleString()}
                → {formatAmount(holding.current_rate)}
              </Text>
            </View>
          </View>
          <Image
            source={require("../assets/icons/chart1.png")}
            style={styles.icon2}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>
              {holding.asset_amount}{" "}
              {holding.asset_symbol.length > 8
                ? holding.asset_symbol.slice(0, 8) + "...."
                : holding.asset_symbol}
            </Text>
            <Text>{formatDateShort(holding.end_date)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default Cryptos;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 3,
    gap: 3,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    borderRadius: 10,
    left: -5,
  },
  iconMetal: {
    width: 40,
    height: 40,
    borderRadius: 10,
    left: -10,
  },
  icon2: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  titleMetal: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: -10,
  },
  subText: {
    color: "#666",
    fontSize: 12,
  },
  subTextMetal: {
    color: "#666",
    fontSize: 12,
    marginLeft: -10,
  },
  price: {
    color: "green",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    color: "#666",
    textAlign: "center",
  },
});
