import { IS_ANDROID_DEVICE } from "@/constants";
import { BlurView } from "expo-blur";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { Text } from "react-native";
import { COLORS } from "@/constants/Colors";

export default function BlurViewComponent({ visible }: { visible: boolean }) {
  const { width } = Dimensions.get("window");

  return (
    <>
      {visible && (
        <Animated.View
          style={styles.container}
          entering={FadeIn.springify()}
          exiting={FadeOut.springify()}
        >
          <BlurView
            intensity={IS_ANDROID_DEVICE ? 100 : 25}
            style={{
              ...StyleSheet.absoluteFillObject,
              overflow: "hidden",
              zIndex: 1,
            }}
            tint={"light"}
          >
            <TouchableOpacity
              style={styles.overlay}
              activeOpacity={1}
              onPress={() => {}}
            />
            <View style={[styles.alertBox, { minWidth: width - 50 }]}></View>

            <View style={styles.verified}>
              <MaterialIcons name="verified-user" size={30} color="#1b109b" />
              <Text style={{ fontSize: 20, color: "white" }}>
                Secured by SwiftPay
              </Text>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </>
  );
}

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  alertBox: {
    borderRadius: 8,
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  verified: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
