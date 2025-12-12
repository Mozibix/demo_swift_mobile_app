import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback } from "react";
import { AntDesign } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Card from "../components/Card";
import Cryptos from "@/components/Cryptos";
import { useHoldings } from "@/hooks/useApi";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showLogs } from "@/utils/logger";

const HoldingsInvest = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { data: holdingsData, isLoading, error, refetch } = useHoldings();

  const holdings = holdingsData?.data.active_holdings;
  const totalAssets = holdingsData?.data.total_assets;

  // showLogs("holdings", holdings);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <AntDesign name="arrowleft" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={{ marginTop: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0062ff"]}
          />
        }
      >
        <Card totalAssets={totalAssets} />
        <Text style={styles.headerLabel}>My Holdings</Text>
        <Cryptos holdings={holdings} isLoading={isLoading} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HoldingsInvest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 20,
    marginBottom: 20,
  },
});
