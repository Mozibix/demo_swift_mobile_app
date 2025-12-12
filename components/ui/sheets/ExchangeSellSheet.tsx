import { AntDesign } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/themed";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { bureauDeChangeApi } from "@/services/api";
import { DEFAULT_PIN } from "@/constants";
import { COLORS } from "@/constants/Colors";
import { styles } from "@/constants/styles";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "@/types";
import {
  _TSFixMe,
  formatKey,
  getErrorMessage,
  getFileInfo,
  maybeFormatValue,
  navigationWithReset,
} from "@/utils";
import { showLogs } from "@/utils/logger";
import { useNavigation } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import Button from "../Button";
import PinComponent from "../PinComponent";
import { showErrorToast, showSuccessToast } from "../Toast";

type SheetProps = {
  isPreviewVisible: boolean;
  setIsPreviewVisible: Dispatch<SetStateAction<boolean>>;
  parsedFields: FormField[];
  cryptoName: string | string[];
  currency_id: number;
  amount: number;
  nairaAmount: string | string[];
  fee: string;
  sellDetails: Record<string, string>;
};
export default function ExchangeSellSheet({
  isPreviewVisible,
  setIsPreviewVisible,
  cryptoName,
  parsedFields,
  currency_id,
  amount,
  nairaAmount,
  fee,
  sellDetails,
}: SheetProps) {
  // showLogs("parsedFields", parsedFields);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState<string | null>("");
  const [showPinComponent, setShowPinComponent] = useState(false);

  // showLogs("sellDetails", sellDetails);

  const { verifyPin, getUserProfile, displayLoader, hideLoader } = useAuth();
  const navigation = useNavigation();

  const formatFieldKey = (label: string) => label.replace(/\W+/g, "_");

  async function handlePurchase(pin: string) {
    setErrorMessage("");

    if (pin !== DEFAULT_PIN) {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return setError("You entered an invalid PIN, please try again");
      }
    }

    setShowPinComponent(false);

    try {
      displayLoader();
      setLoading(true);
      const formData = new FormData();
      formData.append("currency_id", currency_id.toString());
      formData.append("currency_amount", amount.toString());

      for (const field of parsedFields) {
        const key = field.label;
        const type = field.type;
        const formattedKey = formatFieldKey(key);
        const value = sellDetails[formattedKey];

        if (type === "file" && value) {
          const { fileUri, fileName, mimeType } = await getFileInfo(value);

          formData.append(`data[${key}]`, {
            uri: fileUri,
            name: fileName,
            type: mimeType,
          } as _TSFixMe);
        } else {
          formData.append(`data[${key}]`, value as _TSFixMe);
        }
      }

      // showLogs("FormData prepared", formData);

      const response = await bureauDeChangeApi.submitSellCurrencyOrder(
        formData as _TSFixMe,
      );

      if (response.status === "success") {
        getUserProfile();
        showSuccessToast({
          title: "Successful!",
          desc: "Your Sell Order Has Been Completed!",
        });
        navigationWithReset(navigation, "(tabs)");
      }
    } catch (error: any) {
      const firstErrorMessage = getErrorMessage(error);
      showErrorToast({
        title:
          firstErrorMessage ||
          error.response?.data?.message ||
          error.message ||
          "Somethng went wrong. Please try again",
      });
    } finally {
      hideLoader();
      setLoading(false);
    }
  }

  return (
    <Fragment>
      <BottomSheet
        isVisible={isPreviewVisible}
        onBackdropPress={() => setIsPreviewVisible(false)}
      >
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            flexGrow: 1,
          }}
          extraScrollHeight={60}
          enableOnAndroid={true}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <View style={{ width: 30 }} />
              <Text style={styles.bottomSheetTitle}>Order Summary</Text>
              <TouchableOpacity
                onPress={() => setIsPreviewVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={18} color="#CC1212" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>Sell {cryptoName}</Text>
              </View>

              <View style={styles.cardSection}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Amount</Text>
                  <Text
                    style={[
                      styles.cardValueHighlight,
                      { color: COLORS.greenText },
                    ]}
                  >
                    {amount} {cryptoName}
                  </Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Price in NGN</Text>
                  <Text style={styles.cardValue}>{nairaAmount} NGN</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Fee</Text>
                  <Text style={styles.cardValue}>{fee} NGN</Text>
                </View>

                {sellDetails &&
                  Object.entries(sellDetails).map(([key, value]) => (
                    <Fragment>
                      {!value?.includes("file://") && (
                        <View key={key} style={styles.cardRow}>
                          <Text style={styles.cardLabel}>{formatKey(key)}</Text>
                          <Text style={styles.cardValue}>
                            {maybeFormatValue(value)}
                          </Text>
                        </View>
                      )}
                    </Fragment>
                  ))}
              </View>
            </View>

            <View style={styles.pinContainer}>
              <Animated.View
                entering={ZoomIn.duration(200)}
                exiting={ZoomOut.duration(200)}
              >
                {errorMessage && (
                  <Text
                    className="text-red-500 font-bold text-[15px]"
                    style={{ color: COLORS.red }}
                  >
                    {errorMessage}
                  </Text>
                )}
              </Animated.View>

              <Animated.View layout={LinearTransition.springify().damping(14)}>
                <Button
                  text="Confirm Purchase"
                  loadingText="Processing..."
                  onPress={() => {
                    setIsPreviewVisible(false);
                    setTimeout(() => setShowPinComponent(true), 500);
                  }}
                  isLoading={loading}
                  disabled={loading}
                />
              </Animated.View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </BottomSheet>

      <BottomSheet
        isVisible={showPinComponent}
        onBackdropPress={() => setShowPinComponent(false)}
      >
        <View style={[styles.bottomSheetContent, { padding: 0 }]}>
          {error && (
            <Text className="text-danger font-medium text-[16px] text-center mt-4">
              {error}
            </Text>
          )}

          <PinComponent
            onComplete={(pin: string) => {
              handlePurchase(pin);
            }}
            setModalState={setShowPinComponent}
          />
        </View>
      </BottomSheet>
    </Fragment>
  );
}
