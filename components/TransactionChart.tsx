import { COLORS } from "@/constants/Colors";
import React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface TransactionChartProps {
  chartData: number[];
  chartLabels: string[];
}

const TransactionChart: React.FC<TransactionChartProps> = ({
  chartData,
  chartLabels,
}) => {
  const formattedLabels = chartLabels.map((date) => {
    const dateObj = new Date(date);
    return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
  });

  const cumulativeData: number[] = [];
  let runningTotal = 0;
  chartData.forEach((amount) => {
    runningTotal += amount;
    cumulativeData.push(runningTotal);
  });

  const screenWidth = Dimensions.get("window").width - 30;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 98, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "3",
      //   stroke: '#0062ff',
    },
  };

  const data = {
    labels: formattedLabels,
    datasets: [
      {
        data: chartData,
        color: (opacity = 1) => `rgba(255, 159, 64, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: cumulativeData,
        color: (opacity = 1) => COLORS.swiftPayBlue,
        strokeWidth: 3,
      },
    ],
    // legend: ["Transactions", "Balance"],
  };

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        yAxisSuffix="₦"
        yAxisInterval={1}
        fromZero
        segments={4}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    // marginBottom: 24,
    // backgroundColor: '#f8f9fa',
    borderRadius: 16,
    // padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
});

export default TransactionChart;
