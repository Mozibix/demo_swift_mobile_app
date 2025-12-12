import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { _TSFixMe, navigationWithReset } from "@/utils";

const splash = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [authState, setAuthState] = useState({
    isLoading: true,
    hasToken: false,
    hasOnboarded: false,
    hasEmail: false,
  });
  const navigation = useNavigation();
  const timerRef = useRef<_TSFixMe>(null);

  useEffect(() => {
    const runChecks = async () => {
      try {
        const [token, onboardingStatus, existingEmail] = await Promise.all([
          SecureStore.getItemAsync("userToken"),
          AsyncStorage.getItem("userHasOnboardedSP"),
          AsyncStorage.getItem("biometricEmail"),
        ]);

        setAuthState({
          isLoading: false,
          hasToken: !!token,
          hasOnboarded: onboardingStatus === "true",
          hasEmail: !!existingEmail,
        });
      } catch (error) {
        console.error("Error during auth checks:", error);
        setAuthState({
          isLoading: false,
          hasToken: false,
          hasOnboarded: false,
          hasEmail: false,
        });
      }
    };

    runChecks();
  }, []);

  useEffect(() => {
    if (authState.isLoading) return;

    console.log("authState.hasToken)", authState.hasToken);

    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        if (!authState.hasOnboarded && !authState.hasEmail) {
          navigationWithReset(navigation, "onboarding1");
        } else if (!authState.hasToken) {
          navigationWithReset(navigation, "login");
        } else {
          navigationWithReset(navigation, "(tabs)");
        }
      });
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [authState, opacity, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Video
        source={require("../assets/logo.mp4")}
        style={styles.video}
        isMuted
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        useNativeControls={false}
        shouldPlay
      />
      <Animated.View
        style={[styles.innerContainer, { opacity }]}
      ></Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0000FF",
  },
  video: {
    width: width * 1.0,
    height: height * 1.1,
    position: "absolute",
  },
  innerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default splash;
