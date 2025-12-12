import SkipButton from "@/components/onboarding/SkipButton";
import { navigationWithReset } from "@/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Onboarding3 = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View className="absolute right-0 top-4">
        <SkipButton classNames="bg-[#17A1FAC7] py-3 mt-12 mr-4" />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/images/3.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <ImageBackground
        source={require("../assets/images/bg.png")}
        style={styles.bg}
        imageStyle={styles.imageBackgroundStyle}
      >
        <View style={styles.contentContainer}>
          <Animated.View entering={FadeInUp.delay(100)}>
            <Text style={styles.title}>Earn more with</Text>
            <Text style={styles.subtitle}>HOLDINGS</Text>
          </Animated.View>

          <Animated.View
            style={styles.iconContainer}
            entering={FadeInDown.delay(200)}
          >
            <Image
              source={require("../assets/icons/c.png")}
              style={styles.icon}
            />
            <Text style={styles.listItem}>
              Invest in Stocks, Metals and many more stable assets and make
              profits daily.
            </Text>
          </Animated.View>

          <Animated.View
            style={styles.iconContainerM}
            entering={FadeInDown.delay(300)}
          >
            <Image
              source={require("../assets/icons/a.png")}
              style={styles.icon}
            />
            <Text style={styles.listItem}>
              Save your money in hard currency and earn more when the rate goes
              higher.
            </Text>
          </Animated.View>

          <Animated.View
            style={styles.iconContainer}
            entering={FadeInDown.delay(400)}
          >
            <Image
              source={require("../assets/icons/b.png")}
              style={styles.icon}
            />
            <Text style={styles.listItem}>
              Earn more money & protect your money from Inflation and currency
              devaluation
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(500)}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.button, { marginBottom: insets.bottom + 10 }]}
            onPress={async () => {
              await AsyncStorage.setItem("userHasOnboardedSP", "true");
              navigationWithReset(navigation, "login");
            }}
          >
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0000ff",
    justifyContent: "space-between",
  },
  imageContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 20,
  },
  contentContainer: {
    alignItems: "flex-start",
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: "#6666ff",
    marginTop: 40,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 28,
    color: "#0000ff",
    fontWeight: "bold",
    marginVertical: 10,
  },
  listItem: {
    fontSize: 14,
    color: "#666",
    marginVertical: 15,
    textAlign: "left",
    maxWidth: "93%",
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
  },
  bg: {
    flex: 1, // Ensures the background image covers the entire view
    justifyContent: "space-between", // Space between content and button
  },
  imageBackgroundStyle: {
    resizeMode: "cover", // Makes sure the image covers the entire area
    width: "100%", // Ensures the width is 100% of the screen
    height: "100%", // Ensures the height is 100% of the screen
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerM: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    left: 7,
  },
});

export default Onboarding3;
