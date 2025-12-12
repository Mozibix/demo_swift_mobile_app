import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

export default function Divider({ dashed }: { dashed?: boolean }) {
  return (
    <Fragment>
      {dashed ? <View style={styles.dash} /> : <View style={styles.line} />}
    </Fragment>
  );
}

const styles = StyleSheet.create({
  dash: {
    width: "100%",
    marginVertical: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  line: {
    backgroundColor: "#e9e9e9",
    height: 1,
  },
});
