import React, { useEffect } from "react";
import { View } from "react-native";
import * as Notifications from "expo-notifications";
import * as ScreenCapture from "expo-screen-capture";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    // alert("Notification permissions not granted");
    return false;
  }
  return true;
};

const sendNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Screenshot Detected",
      body: "Your screen is being captured. Please protect your personal information.",
      priority: "high",
    },
    trigger: null,
  });
};

const ScreenshotNotification = () => {
  useEffect(() => {
    const setupScreenshotDetection = async () => {
      // Request permissions
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      // Add screenshot listener
      const subscription = ScreenCapture.addScreenshotListener(() => {
        sendNotification();
      });

      return () => {
        subscription.remove();
      };
    };

    setupScreenshotDetection();
  }, []);

  return <View />;
};

export default ScreenshotNotification;
