import { useState } from "react";
import { View, Modal, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/Colors";
import Button from "./ui/Button";
import { useRouter } from "expo-router";
import { _TSFixMe } from "@/utils";
import { showErrorToast } from "./ui/Toast";
import remoteConfig from "@react-native-firebase/remote-config";
import { remoteConfigKeys } from "@/constants";
import { useGlobals } from "@/context/GlobalContext";

export default function AppPopop() {
  const isPopopEnabled = remoteConfig()
    .getValue(remoteConfigKeys.showPopops)
    .asBoolean();

  const { selectedModalContent, isKYCVerified } = useAuth();

  const router = useRouter();

  const { hasSeenPopup, setHasSeenPopup, appUpdateAvailable } = useGlobals();

  if (hasSeenPopup || appUpdateAvailable || !isPopopEnabled) return null;

  function kycVerified(callback: VoidFunction) {
    const isVerified = isKYCVerified();
    if (isVerified) {
      callback();
    } else {
      showErrorToast({
        title: "KYC Not Verified",
        desc: "Please complete your KYC to use this feature",
      });
    }
  }

  return (
    <Modal transparent={true} animationType="fade" visible={!hasSeenPopup}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="w-4/5 bg-[#E3E9FD] rounded-lg p-4 items-center justify-center">
          <Pressable className="self-end" onPress={() => setHasSeenPopup(true)}>
            <Ionicons
              name="close-circle-sharp"
              size={25}
              color={COLORS.danger}
            />
          </Pressable>
          <Image
            source={{
              uri: selectedModalContent.image,
            }}
            style={{ height: 150, width: 150 }}
          />
          <Text className="text-[20px] font-bold mt-4">
            {selectedModalContent.title}
          </Text>
          <Text className="text-gray-200 mt-2 text-[15px] text-center">
            {selectedModalContent.description}
          </Text>

          <Button
            full
            text={selectedModalContent.buttonText}
            onPress={() => {
              kycVerified(() => {
                setTimeout(() => {
                  router.push(selectedModalContent.route as _TSFixMe);
                }, 500);
              });
              setHasSeenPopup(true);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
