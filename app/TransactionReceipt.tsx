import Button from "@/components/ui/Button";
import {
  cn,
  formatAmount,
  formatBalance,
  formatDate,
  formatSource,
  navigationWithReset,
  triggerHaptic,
} from "@/utils";
import { Image } from "expo-image";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { BottomSheet } from "@rneui/base";
import { useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import ViewShot from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBroswer from "expo-web-browser";
import { showLogs } from "@/utils/logger";
import Divider from "@/components/ui/Divider";

export default function TransactionReceipt() {
  const {
    currentTransaction,
    type,
    fromHistory,
    fromSendAfrica,
    isCrypto,
    isSellCypto,
  } = useLocalSearchParams();
  const transaction = JSON.parse((currentTransaction as string) ?? "{}");
  const [showDownloadFormats, setShowDownloadFormats] = useState(false);
  const receiptRef = useRef(null);
  const router = useRouter();
  const navigation = useNavigation();

  showLogs("transaction", transaction);

  useFocusEffect(() => {
    triggerHaptic();
  });

  async function downloadAsPDF() {
    try {
      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1,
      });

      const htmlContent = `
            <html>
              <body>
                <img src="${uri}" style="width: 100%; height: auto;" />
              </body>
            </html>
          `;

      const { uri: pdfUri } = await Print.printToFileAsync({
        html: htmlContent,
      });
      await Sharing.shareAsync(pdfUri);
      setShowDownloadFormats(false);
    } catch (error) {
      console.error("Failed to create PDF", error);
    }
  }

  async function downloadAsImage() {
    try {
      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1,
      });
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
        await Sharing.shareAsync(uri);
        setShowDownloadFormats(false);
      }
    } catch (error) {
      console.error("Failed to save image", error);
    }
  }

  const handlePressLiveChat = async () => {
    const userDetailsString = await AsyncStorage.getItem("UserDetails");
    const hashID = userDetailsString
      ? JSON.parse(userDetailsString).hash_id
      : null;
    const url = `https://swiftpaymfb.com/visit-live-chat?user_hash_id=${hashID}`;
    await WebBroswer.openBrowserAsync(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="mx-5">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={
              fromHistory === "true"
                ? () => router.back()
                : () => navigationWithReset(navigation, "(tabs)")
            }
          >
            <AntDesign name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="font-semibold text-[18px]">Share Receipt</Text>
          <View className="pr-[16px]" />
        </View>
        <ViewShot ref={receiptRef} options={{ format: "png", quality: 1 }}>
          <View className="bg-[#EAF5FF] p-3 border-[1px] border-[#C6E3FF] rounded-lg">
            <View className="flex-row justify-between items-center">
              <Image
                source={{ uri: "https://swiftpaymfb.com/logo-welcome.png" }}
                style={{ height: 40, width: 100, objectFit: "contain" }}
              />
              <Text
                className="text-semibold text-[15px]"
                style={{ color: "#565656" }}
              >
                Transaction Receipt
              </Text>
            </View>

            <View className="justify-center items-center mt-10">
              <Text className="font-bold text-[29px] text-[#00C620]">
                {isCrypto === "true"
                  ? transaction.amount + " " + transaction.symbol
                  : `₦${formatAmount(
                      transaction?.amount || transaction?.total_amount || 0
                    )}`}
              </Text>
              <Text className="mt-1 text-[16px] font-medium capitalize">
                {transaction.status}
              </Text>
              <Text className="mt-3 text-[16px] text-[#666464]">
                {fromSendAfrica ? (
                  transaction.date
                ) : (
                  <>{formatDate(transaction.created_at || transaction.date)}</>
                )}
              </Text>
            </View>

            <View className="px-[20px]">
              <Divider dashed />
            </View>

            <View className="mt-8">
              <View className="flex-row justify-between items-center">
                <Text className="text-[16px] text-[#666464]">
                  Transaction Type
                </Text>

                {transaction.type === "SwiftPay" &&
                transaction.accounts.includes(",") ? (
                  <Text className={"font-medium text-[16px] capitalize"}>
                    SwiftPay Multiple Transfer
                  </Text>
                ) : type === "transfer" || transaction.message ? (
                  <Text
                    className={cn(
                      "font-semibold text-[16px] capitalize",
                      transaction?.type === "credit"
                        ? "text-[#046c4e]"
                        : transaction.type === "bank" ||
                          transaction.type === "debit"
                        ? "text-[#c81e1e]"
                        : "text-[#111]"
                    )}
                  >
                    {transaction?.type || transaction?.transactionType}
                  </Text>
                ) : (
                  <Text className={"font-medium text-[16px] capitalize"}>
                    {transaction?.transactionType || transaction?.type}
                  </Text>
                )}
              </View>

              {type === "transfer" && transaction.recipientName && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">Receipient</Text>
                  <Text className="font-medium text-[16px] max-w-[200px]">
                    {transaction.recipientName || transaction.accounts}
                  </Text>
                </View>
              )}

              {transaction.type === "SwiftPay" && transaction.accounts && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">Receipient</Text>
                  <Text className="font-medium text-[16px] max-w-[200px]">
                    {transaction.accounts}
                  </Text>
                </View>
              )}

              {type === "transfer" && transaction.recipientTag && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">
                    Receipient Tag
                  </Text>
                  <Text className="font-medium text-[16px]">
                    @{transaction.recipientTag}
                  </Text>
                </View>
              )}

              {type === "transfer" && transaction.feeAmount && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">Fee</Text>
                  <Text className="font-medium text-[16px]">
                    ₦{formatAmount(transaction.feeAmount)}
                  </Text>
                </View>
              )}

              {type === "transfer" && transaction.recipientBank && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">
                    Recipient Bank
                  </Text>
                  <Text className="font-medium text-[16px]">
                    {transaction.recipientBank}
                  </Text>
                </View>
              )}

              {type === "transfer" && transaction.recipientAccount && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">
                    Recipient Account No.
                  </Text>
                  <Text className="font-medium text-[16px]">
                    {transaction.recipientAccount}
                  </Text>
                </View>
              )}

              {isSellCypto === "true" && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">
                    Amount to receive
                  </Text>
                  <Text
                    className="font-medium text-[16px] max-w-[200px]"
                    style={{ maxWidth: 250 }}
                  >
                    {transaction.amountToReceive} NGN
                  </Text>
                </View>
              )}

              {type === "transfer" ? (
                <>
                  {transaction.senderName ? (
                    <View className="flex-row justify-between items-center mt-5">
                      <Text className="text-[16px] text-[#666464]">Sender</Text>
                      <Text
                        className="font-medium text-[16px] max-w-[200px]"
                        style={{ maxWidth: 250 }}
                      >
                        {transaction.senderName}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">Source</Text>
                  <Text className="font-medium text-[16px] text-swiftPayBlue">
                    {formatSource(
                      fromSendAfrica
                        ? "send_to_africa"
                        : transaction.source ?? "muliple_bank_transfer"
                    ) ?? "-"}
                  </Text>
                </View>
              )}

              {transaction.description ||
                (transaction.message && (
                  <View className="flex-row justify-between items-center mt-5 mb-3">
                    <Text className="text-[16px] text-[#666464]">
                      Description
                    </Text>
                    {type === "transfer" || isCrypto === "true" ? (
                      <Text
                        className="font-medium text-[16px] max-w-[220px]"
                        style={{ textAlign: "right" }}
                      >
                        {fromSendAfrica
                          ? "Send to Africa transfer"
                          : transaction.description ||
                            transaction.message ||
                            "-"}
                      </Text>
                    ) : (
                      <Text
                        className="font-medium text-[16px] max-w-[190px]"
                        style={{ textAlign: "right" }}
                      >
                        {fromSendAfrica
                          ? "Send to Africa transfer"
                          : transaction.message ??
                            `Multiple Bank Transfer ${
                              transaction?.accounts
                                ? `to ${transaction?.accounts} and others`
                                : ""
                            }   `}
                      </Text>
                    )}
                  </View>
                ))}

              {isCrypto === "true" && transaction.nairaAmount && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">
                    Amount in NGN
                  </Text>
                  <Text className="font-medium text-[16px] self-end max-w-[200px]">
                    {transaction.nairaAmount} NGN
                  </Text>
                </View>
              )}

              {isCrypto === "true" && transaction.network && (
                <View className="flex-row justify-between items-center mt-5">
                  <Text className="text-[16px] text-[#666464]">Network</Text>
                  <Text className="font-medium text-[16px] self-end max-w-[200px]">
                    {transaction.network}
                  </Text>
                </View>
              )}

              {isCrypto === "true" && transaction.walletAddress && (
                <View className="flex-row justify-between items-center mt-5 mb-10">
                  <Text className="text-[16px] text-[#666464]">
                    Wallet Address
                  </Text>
                  <Text className="font-medium text-[16px] self-end max-w-[200px]">
                    {transaction.walletAddress}
                  </Text>
                </View>
              )}

              {transaction.reference && (
                <View className="flex-row justify-between items-center mt-5 mb-10">
                  <Text className="text-[16px] text-[#666464]">Reference</Text>
                  <Text className="font-medium text-[16px] self-end max-w-[200px]">
                    {transaction.reference}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.decorativeCircles}>
              {[...Array(8)].map((_, index) => (
                <View key={index} style={styles.circle} />
              ))}
            </View>
          </View>
        </ViewShot>

        <Button
          text="Share Receipt"
          onPress={() => setShowDownloadFormats(true)}
          classNames="mt-8"
        ></Button>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePressLiveChat}
          className="flex-row justify-center items-center gap-4 mt-4"
        >
          <Text className="text-[17px] font-medium text-swiftPayBlue">
            Report an issue
          </Text>
        </TouchableOpacity>

        <BottomSheet
          isVisible={showDownloadFormats}
          onBackdropPress={() => setShowDownloadFormats(false)}
        >
          <View style={styles.bottomSheetContent}>
            <Image
              source={require("../assets/share-receipt.png")}
              style={{ height: 80, width: 80, alignSelf: "center" }}
            />
            <Text style={styles.bottomSheetTitle}>Share Receipt as</Text>

            <View className="flex-row items-center mt-5 gap-3 mb-10">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={downloadAsPDF}
                className="bg-[#ebf5ff] h-[60px] w-[48%] p-2 rounded-lg flex-row gap-3 items-center"
              >
                <Image
                  source={require("../assets/pdf.png")}
                  style={{ height: 35, width: 35, alignSelf: "center" }}
                />
                <Text className="font-medium text-[16px]">PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={downloadAsImage}
                className="bg-[#ebf5ff] h-[60px] w-[48%] p-2 rounded-lg flex-row gap-3 items-center"
              >
                <Image
                  source={require("../assets/gallery.png")}
                  style={{ height: 35, width: 35, alignSelf: "center" }}
                />{" "}
                <Text className="font-medium text-[16px]">IMAGE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: Platform.OS === "android" ? 50 : 0,
  },
  bottomSheetContent: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 10,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  decorativeCircles: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: -4,
    left: 10,
    right: 10,
    zIndex: 1,
    overflow: "hidden",
  },
  circle: {
    width: 35,
    height: 17,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: "white",
  },
});
