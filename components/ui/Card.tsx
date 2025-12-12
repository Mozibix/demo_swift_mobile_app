import { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

export default function Card({
  children,
  classNames,
  cardStyles,
}: {
  children: ReactNode;
  classNames?: string;
  cardStyles?: ViewStyle;
}) {
  return (
    <View style={[styles.card, cardStyles]} className={classNames}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#FFF",
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
