// components/ProgressBar.tsx

import React from "react";
import { View, StyleSheet, Text } from "react-native";

interface ProgressBarProps {
  progress: number; // should be a value between 0 and 1, e.g., 0.5 for 50%
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 10,
  backgroundColor = "#e0e0e0",
  progressColor = "green",
}) => {
  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View
        style={[
          styles.progress,
          { width: `${progress * 100}%`, backgroundColor: progressColor },
        ]}
      />
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 5,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 5,
  },
});
