import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

const HardCurrencyDetails = () => {
  const candlestickData = [
    { date: "1 Dec", open: 220, high: 260, low: 200, close: 250 },
    { date: "2 Dec", open: 250, high: 270, low: 240, close: 260 },
    { date: "3 Dec", open: 260, high: 280, low: 250, close: 270 },
    { date: "4 Dec", open: 270, high: 290, low: 260, close: 280 },
    { date: "5 Dec", open: 280, high: 300, low: 270, close: 290 },
  ];

  const renderCandlestick = ({ item }: any) => {
    const isPositive = item.close >= item.open;
    return (
      <View style={styles.candleContainer}>
        {/* High-Low Line */}
        <View
          style={[
            styles.line,
            {
              height: item.high - item.low,
              backgroundColor: isPositive ? "#4CAF50" : "#F44336",
            },
          ]}
        />
        {/* Open-Close Bar */}
        <View
          style={[
            styles.bar,
            {
              height: Math.abs(item.close - item.open),
              backgroundColor: isPositive ? "#4CAF50" : "#F44336",
              marginTop: item.high - Math.max(item.open, item.close),
            },
          ]}
        />
        <Text style={styles.candleLabel}>{item.date}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backArrow}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Custom Chart Example</Text>
        <TouchableOpacity>
          <Text style={styles.menu}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Candlestick Chart */}
      <FlatList
        data={candlestickData}
        renderItem={renderCandlestick}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContainer}
        keyExtractor={(item, index) => index.toString()}
      />
    </ScrollView>
  );
};

export default HardCurrencyDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  menu: {
    fontSize: 24,
  },
  chartContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  candleContainer: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  line: {
    width: 2,
    borderRadius: 1,
  },
  bar: {
    width: 10,
    borderRadius: 2,
  },
  candleLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#333",
  },
});
