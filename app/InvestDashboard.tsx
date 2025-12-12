import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import { COLORS } from "@/constants/Colors";
import { useInvestmentPortfolio } from "@/hooks/useApi";
import { formatAmount, navigationWithReset } from "@/utils";
import { showLogs } from "@/utils/logger";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useNavigation } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

const InvestmentScreen: React.FC = () => {
  const { data: portfolio, isLoading, error } = useInvestmentPortfolio();
  const [fallback, setFallback] = useState(false);
  const navigation = useNavigation();

  // showLogs("FETCHED iNVESTMENT:", { Investment, TotalAsset });

  function generateData() {
    const result: number[] = [];
    const count = 4;

    if (!TotalAsset || TotalAsset <= 0 || isNaN(TotalAsset)) {
      return [0, 0, 0, 0];
    }

    if (!TotalAsset || TotalAsset <= 0) return result;

    const step = TotalAsset / count;

    for (let i = 1; i <= count; i++) {
      if (i === count) {
        result.push(TotalAsset);
      } else {
        result.push(Math.round(step * i));
      }
    }

    return result;
  }

  if (isLoading) {
    return <LoadingComp visible />;
  }

  if (error) {
    return (
      <Text style={styles.errorText}>Failed to load portfolio data ....</Text>
    );
  }

  const TotalAsset = portfolio?.data?.total_asset;
  const Investment = portfolio?.data?.investments || [];

  // showLogs("Investment", Investment);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.canGoBack()
              ? router.back()
              : navigationWithReset(navigation, "(tabs)");
          }}
        >
          <AntDesign name="left" size={20} />
        </TouchableOpacity>
      </View>
      {/* Total Investment */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <>
          <View style={styles.investmentCard}>
            <View style={styles.investment}>
              <View>
                <Text style={styles.investmentTitle}>
                  Total Active Investments
                </Text>
                <Text style={styles.investmentValue}>
                  ₦{""} {(TotalAsset ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={{ marginLeft: 30 }}>
              <LineChart
                data={{
                  labels: ["", "", "", "", "", ""],
                  datasets: [{ data: generateData() }],
                }}
                width={350}
                height={170}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(34, 128, 255, ${opacity})`,
                  //@ts-ignore
                  yAxisSuffix: "t",
                  yAxisWidth: 130,
                  propsForLabels: { fontSize: 10 },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                fromZero={true}
                yAxisInterval={1}
                withVerticalLabels={false}
              />
            </View>
          </View>

          <Button
            text="Invest Now"
            centered
            onPress={() => router.push("/InvestAsset")}
            classNames="w-[50%] mb-6"
          />

          {/* Investments */}
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>My holdings</Text>
            <TouchableOpacity
              onPress={() => router.push("/InvestmentHistory")}
              className="flex-row items-center space-x-1"
            >
              <Text style={styles.viewAllText}>History</Text>
              <Entypo
                name="chevron-small-right"
                size={24}
                color={COLORS.swiftPayBlue}
              />
            </TouchableOpacity>
          </View>

          {Investment && Investment.length > 0 ? (
            <FlatList
              data={Investment}
              renderItem={({ item }) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemContainer}
                  onPress={() =>
                    router.push({
                      pathname: "/InvestHoldingDetails",
                      params: {
                        id: item.id,
                        assetType: item.asset_type,
                        assetName: item.asset_name,
                        assetSymbol: item.asset_symbol,
                        current_earnings: item.current_earnings?.toString(),
                      },
                    })
                  }
                >
                  <View style={styles.flex}>
                    <Image
                      source={{
                        uri:
                          item.asset_type === "stock"
                            ? "https://swiftpaymfb.com/trend.png"
                            : item.asset_icon_url,
                      }}
                      style={styles.icon}
                    />
                    <View>
                      <Text style={styles.title}>{item.asset_name}</Text>

                      <View className="flex-row items-center gap-1">
                        <Text style={{ fontSize: 15, color: "#666" }}>
                          {item?.change_percentage?.toFixed(2)}
                        </Text>
                        <AntDesign
                          name={"arrowright"}
                          size={12}
                          color={"#333"}
                        />
                        <Text style={{ fontSize: 15, color: "#666" }}>
                          {item.current_rate?.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={
                        (item?.current_earnings ?? 0) < item.amount_invested
                          ? styles.red
                          : styles.green
                      }
                    >
                      ₦{item.current_earnings?.toLocaleString() || "0"}
                    </Text>
                    <Text>₦{formatAmount(item.amount_invested) || "0"}</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              style={styles.portfolioList}
            />
          ) : (
            <View style={styles.noInvestments}>
              <Image
                source={require("../assets/payments/2.png")}
                style={{
                  height: 150,
                  width: 200,
                }}
              />
              <Text style={styles.noInvestmentsText}>
                No investments found. Start investing now!
              </Text>
            </View>
          )}
        </>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvestmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    // marginTop: 20,
  },
  investmentCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  investmentTitle: {
    fontSize: 16,
    color: "#777",
  },
  investmentValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  chart: {
    marginVertical: 10,
    alignSelf: "center",
  },
  investButton: {
    backgroundColor: "#0000FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
  investButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  portfolioSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAllText: {
    color: COLORS.swiftPayBlue,
    fontWeight: "bold",
    fontSize: 17,
  },
  portfolioList: {},
  portfolioCard: {
    width: 200,
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: "bold",
  },
  stockCompany: {
    fontSize: 12,
    color: "#777",
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  stockChange: {
    color: "green",
    fontWeight: "bold",
  },
  stockDrop: {
    color: "red",
    fontWeight: "bold",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  watchlistSection: {
    marginTop: 20,
  },
  watchlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stockInfo: {
    flexDirection: "column",
  },
  stockName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  stockPercentage: {
    color: "#777",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    gap: 20,
  },
  chartButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    flexDirection: "row",
  },
  investment: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 10, // Adjust spacing as necessary
    marginRight: 5,
  },
  portfolioHead: {
    flexDirection: "row",
    left: -10,
  },
  rates: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartButtonText: {
    marginRight: 10,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  stockVal: {
    alignItems: "flex-end",
  },
  stockTitle: {
    color: "green",
    fontSize: 16,
    fontWeight: "bold",
  },
  stockSub: {
    color: "#777",
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  noInvestments: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noInvestmentsText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
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
    width: 35,
    height: 35,
    resizeMode: "contain",
    left: -2,
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
  subText: {
    color: "#666",
    fontSize: 12,
  },
  red: {
    color: COLORS.danger,
    fontSize: 18,
    fontWeight: "600",
  },
  green: {
    color: COLORS.greenText,
    fontSize: 18,
    fontWeight: "600",
  },
});
