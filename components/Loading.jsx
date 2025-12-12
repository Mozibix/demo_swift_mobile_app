import { StyleSheet, View, Dimensions } from "react-native";
import { Image } from "expo-image";

const LoadingComp = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Image
        source={require("../assets/loader.gif")}
        style={{ width: 80, height: 80 }}
      />
    </View>
  );
};

export default LoadingComp;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 10,
  },
});
