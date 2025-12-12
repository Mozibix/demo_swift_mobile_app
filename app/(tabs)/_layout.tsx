import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Tabs } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { _TSFixMe } from "@/utils";
import { useMultipleTransfer } from "@/context/MultipleTransferContext";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast } from "@/components/ui/Toast";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { setTransferSource } = useMultipleTransfer();
  const { isKYCVerified } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: Colors["light"].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors["light"].background,
          borderTopWidth: 0,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
      // screenListeners={{
      //   tabPress: (e: _TSFixMe) => {
      //     const parts = e.target.split("-");
      //     const result = parts[0];
      //     if (result === "transfer") {
      //       setTransferSource("normal");
      //     }
      //   },
      // }}

      screenListeners={{
        tabPress: (e: _TSFixMe) => {
          const parts = e.target.split("-");
          const tabName = parts[0];

          const restrictedTabs = ["transfer", "savings", "bills", "cards"];
          if (restrictedTabs.includes(tabName)) {
            if (!isKYCVerified()) {
              e.preventDefault();
              showErrorToast({
                title: "KYC Not Verified",
                desc: "Please complete your KYC to use this feature",
              });
              return;
            }
          }

          if (tabName === "transfer") {
            setTransferSource("normal");
          }
        },
      }}
    >
      <Tabs.Screen redirect name="splash" />
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "SwiftPay",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={
                focused
                  ? require("../../assets/logo-focused.png")
                  : require("../../assets/logo-unfocused.png")
              }
              style={{ height: 72, width: 72 }}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    name="logo-skype"
                    size={25}
                    color={Colors["light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          headerShown: false,
          title: "Transfer",
          tabBarIcon: ({ color }) => <TabBarIcon name="send" color={color} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          headerShown: false,
          title: "Savings",
          tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          headerShown: false,
          title: "Bills",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="receipt-sharp" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cards"
        options={{
          href: null, // NOTE: remove this when card feature is available
          headerShown: false,
          title: "Cards",
          tabBarIcon: ({ color }) => <TabBarIcon name="card" color={color} />,
        }}
      />
    </Tabs>
  );
}
