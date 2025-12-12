import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { _TSFixMe } from "@/utils";

export default function AssetChart({
  data_changes,
  noShadow,
}: {
  data_changes: _TSFixMe;
  noShadow?: boolean;
}) {
  const dataArray = data_changes || [0];
  const yMin = Math.min(...dataArray) * 0.95;
  const yMax = Math.max(...dataArray) * 1.05;

  return (
    <View
      style={noShadow ? styles.chartContainerMinimal : styles.chartContainer}
    >
      {dataArray.length > 0 && (
        <LineChart
          data={{
            labels: ["", "", "", "", "", ""],
            datasets: [
              {
                data: dataArray,
                color: (opacity = 1) => `rgba(34, 128, 255, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={350}
          height={220}
          withDots={false}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          hidePointsAtIndex={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          fromZero={false}
          formatYLabel={(value) => parseFloat(value).toFixed(1)}
          yLabelsOffset={15}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(34, 128, 255, ${opacity})`,
            labelColor: (opacity = 0.6) => `rgba(128, 128, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: "#EAEAEA",
              strokeWidth: 0.5,
            },
            fillShadowGradient: "rgba(34, 128, 255, 1)",
            fillShadowGradientOpacity: 0.2,
            useShadowColorFromDataset: false,
            // @ts-ignore
            yAxisSuffix: "",
            yAxisMinValue: yMin,
            yAxisMaxValue: yMax,
          }}
          bezier
          style={styles.chart}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainerMinimal: {
    borderRadius: 16,
    marginTop: 20,
    padding: 4,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    padding: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
