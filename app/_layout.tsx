import BlurViewComponent from "@/components/BlurView";
import LoadingComp from "@/components/Loading";
import { useColorScheme } from "@/components/useColorScheme";
import { MultipleTransferProvider } from "@/context/MultipleTransferContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import NetInfo from "@react-native-community/netinfo";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, LogBox, Platform, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { ToastProvider } from "react-native-toast-notifications";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";
import QueryProvider from "../providers/query-provider";
import NoNetworkScreen from "./NoNetworkScreen";
import ScreenshotNotification from "./ScreenshotNotification";
import UserInactivityProvider from "@/context/UserInactivityContext";
import OTAUpdate from "@/components/OTAUpdate";
import UpdateAppScreen from "@/components/UpdateAppScreen";
import { GlobalProvider, useGlobals } from "@/context/GlobalContext";

LogBox.ignoreAllLogs();

// export const unstable_settings = {
//   initialRouteName: "splash",
// };

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 1000 * 60 * 5,
		},
	},
});

export default function RootLayout() {
	useNotificationObserver();
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		SatoshiRegular: require("../assets/font/satoshi/Satoshi-Regular.otf"),
		...FontAwesome.font,
	});
	const [expoPushToken, setExpoPushToken] = useState("");
	const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
	const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);

	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowAlert: true,
			shouldPlaySound: true,
			shouldSetBadge: false,
		}),
	});

	async function registerForPushNotificationsAsync() {
		let token;

		if (Platform.OS === "android") {
			await Notifications.setNotificationChannelAsync("myNotificationChannel", {
				name: "A channel is needed for the permissions prompt to appear",
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: "#FF231F7C",
			});
		}

		if (Device.isDevice) {
			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;
			if (existingStatus !== "granted") {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== "granted") {
				alert("Push notifications are currently disabled. Please enable them in your device settings to stay updated");
				return;
			}

			try {
				const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
				if (!projectId) {
					throw new Error("Project ID not found");
				}
				token = (
					await Notifications.getExpoPushTokenAsync({
						projectId,
					})
				).data;
				console.log(token);
			} catch (e) {
				token = `${e}`;
			}
		} else {
			alert("Must use physical device for Push Notifications");
		}

		return token;
	}

	useEffect(() => {
		registerForPushNotificationsAsync().then((token) => token && setExpoPushToken(token));

		if (Platform.OS === "android") {
			Notifications.getNotificationChannelsAsync().then((value) => setChannels(value ?? []));
		}
		const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
			setNotification(notification);
		});

		const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
			console.log(response);
		});

		return () => {
			notificationListener.remove();
			responseListener.remove();
		};
	}, []);

	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	function useNotificationObserver() {
		useEffect(() => {
			let isMounted = true;

			function redirect(notification: Notifications.Notification) {
				const url = notification.request.content.data?.url;
				if (url) {
					router.push(url);
				}
			}

			Notifications.getLastNotificationResponseAsync().then((response) => {
				if (!isMounted || !response?.notification) {
					return;
				}
				redirect(response?.notification);
			});

			const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
				redirect(response.notification);
			});

			return () => {
				isMounted = false;
				subscription.remove();
			};
		}, []);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
			<ActionSheetProvider>
				<GlobalProvider>
					<AuthProvider>
						<UserInactivityProvider>
							<MultipleTransferProvider>
								<RootLayoutNav />
							</MultipleTransferProvider>
						</UserInactivityProvider>
					</AuthProvider>
				</GlobalProvider>
			</ActionSheetProvider>
		</GestureHandlerRootView>
	);
}

function RootLayoutNav() {
	const colorScheme = useColorScheme();
	const [isConnected, setIsConnected] = useState(true);
	const { showLoader } = useAuth();
	const { OTAUpdateAvailable, appUpdateAvailable } = useGlobals();
	const appState = useRef(AppState.currentState);
	const [showBlurView, setShowBlurView] = useState(false);
	const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			setIsConnected(state.isConnected ?? false);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", handleAppStateChange);

		return function () {
			subscription.remove();

			if (blurTimeoutRef.current) {
				clearTimeout(blurTimeoutRef.current);
			}
		};
	}, []);

	function handleAppStateChange(nextAppState: AppStateStatus) {
		if (blurTimeoutRef.current) {
			clearTimeout(blurTimeoutRef.current);
			blurTimeoutRef.current = null;
		}

		if (nextAppState === "inactive" || nextAppState === "background") {
			setShowBlurView(true);
		} else if ((appState.current === "inactive" || appState.current === "background") && nextAppState === "active") {
			blurTimeoutRef.current = setTimeout(() => {
				setShowBlurView(false);
			}, 100);
		}

		appState.current = nextAppState;
	}

	return (
		<ToastProvider
			placement="bottom"
			duration={4000}
			animationType="slide-in"
			animationDuration={250}
			successColor="#28a745"
			dangerColor="#dc3545"
			warningColor="#ffc107"
			normalColor="#007bff"
			successIcon={<FontAwesome name="check-circle" size={24} color="white" />}
			dangerIcon={<FontAwesome name="times-circle" size={24} color="white" />}
			warningIcon={<FontAwesome name="exclamation-circle" size={24} color="white" />}
			textStyle={{ fontSize: 16, color: "#fff" }}
			offset={50}
			swipeEnabled={true}
			renderToast={(toastOptions) => (
				<View
					style={{
						maxWidth: "90%",
						paddingHorizontal: 15,
						paddingVertical: 10,
						backgroundColor: toastOptions.type === "success" ? "#28a745" : "#dc3545",
						borderRadius: 8,
						flexDirection: "row",
						alignItems: "center",
						gap: 10,
					}}
				>
					{toastOptions.icon}
					<Text style={{ color: "#fff", fontSize: 16 }}>{toastOptions.message}</Text>
				</View>
			)}
		>
			<QueryClientProvider client={queryClient}>
				<LoadingComp visible={showLoader} />
				<BlurViewComponent visible={showBlurView} />
				<UpdateAppScreen visible={appUpdateAvailable} />
				<OTAUpdate visible={OTAUpdateAvailable && !appUpdateAvailable} />

				<QueryProvider>
					<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
						{/* ScreenshotNotification is outside the Stack */}
						<ScreenshotNotification />

						{!isConnected && <NoNetworkScreen />}
						{isConnected && (
							<View
								style={{
									flex: 1,
									//  paddingTop: Platform.OS === "ios" ? 20 : 0
								}}
							>
								<StatusBar style="dark" />

								<Stack screenOptions={{ animation: "slide_from_right" }} initialRouteName="splash">
									<Stack.Screen name="splash" options={{ headerShown: false }} />

									<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
									<Stack.Screen name="login" options={{ headerShown: false }} />
									<Stack.Screen name="signup" options={{ headerShown: false }} />
									<Stack.Screen name="onbording1" options={{ headerShown: false }} />
									<Stack.Screen name="OtpVerificationScreen" options={{ headerShown: false }} />
									<Stack.Screen name="VerifyPhone" options={{ headerShown: false }} />
									<Stack.Screen name="TransactionPinSetup" options={{ headerShown: false }} />
									<Stack.Screen name="Biometric" options={{ headerShown: false }} />
									<Stack.Screen
										name="QrCodeScreen"
										options={{
											headerShown: false,
											animation: "slide_from_bottom",
										}}
									/>
									<Stack.Screen name="Transfer" options={{ headerShown: false }} />
									<Stack.Screen name="TransferScreen" options={{ headerShown: false }} />
									<Stack.Screen name="Rates" options={{ headerShown: false }} />
									<Stack.Screen name="AddMoney" options={{ headerShown: false }} />
									<Stack.Screen name="Notification" options={{ headerShown: false }} />
									<Stack.Screen name="onboarding1" options={{ headerShown: false }} />
									<Stack.Screen name="onboarding2" options={{ headerShown: false }} />
									<Stack.Screen name="onboarding3" options={{ headerShown: false }} />
									<Stack.Screen name="onboarding4" options={{ headerShown: false }} />
									<Stack.Screen name="ScreenshotNotification" options={{ headerShown: false }} />
									<Stack.Screen name="NoNetworkScreen" options={{ headerShown: false }} />
									<Stack.Screen name="AjoSavings" options={{ headerShown: false }} />
									<Stack.Screen name="Africa" options={{ headerShown: false }} />
									<Stack.Screen name="Abroad" options={{ headerShown: false }} />
									<Stack.Screen name="HardCurrency" options={{ headerShown: false }} />
									<Stack.Screen name="InvestHoldingDetails" options={{ headerShown: false }} />
									<Stack.Screen name="Stock" options={{ headerShown: false }} />
									<Stack.Screen name="AjoContribution" options={{ headerShown: false }} />
									<Stack.Screen
										name="AjoContibutionCreated"
										options={{
											headerShown: false,
											animation: "slide_from_bottom",
										}}
									/>
									<Stack.Screen name="Exchange" options={{ headerShown: false }} />
									<Stack.Screen name="ExchangeSell" options={{ headerShown: false }} />
									<Stack.Screen name="SellTrading" options={{ headerShown: false }} />
									<Stack.Screen name="BuyTrading" options={{ headerShown: false }} />
									<Stack.Screen name="BuyCryptoScreen" options={{ headerShown: false }} />
									<Stack.Screen name="SellCryptoScreen" options={{ headerShown: false }} />
									<Stack.Screen name="SellBtc" options={{ headerShown: false }} />
									<Stack.Screen name="BuyBtc" options={{ headerShown: false }} />
									<Stack.Screen name="BuyEthereum" options={{ headerShown: false }} />
									<Stack.Screen name="CompletePaymentScreen" options={{ headerShown: false }} />
									<Stack.Screen name="BureauDeChange" options={{ headerShown: false }} />
									<Stack.Screen name="SelectCountry" options={{ headerShown: false }} />
									<Stack.Screen name="SelectGiftCard" options={{ headerShown: false }} />
									<Stack.Screen name="CardScreen" options={{ headerShown: false }} />
									<Stack.Screen name="PaymentOption" options={{ headerShown: false }} />
									<Stack.Screen name="CreditCard" options={{ headerShown: false }} />
									<Stack.Screen name="PaymentVerification" options={{ headerShown: false }} />
									<Stack.Screen name="PaymentVerified" options={{ headerShown: false }} />
									<Stack.Screen name="SellGiftcard" options={{ headerShown: false }} />
									<Stack.Screen name="TradeSummary" options={{ headerShown: false }} />
									<Stack.Screen name="GiftcardSuccess" options={{ headerShown: false }} />
									<Stack.Screen name="TransferPin" options={{ headerShown: false }} />
									<Stack.Screen name="TransferToSwiftpay" options={{ headerShown: false }} />
									<Stack.Screen name="Receipt" options={{ headerShown: false }} />
									<Stack.Screen name="Beneficiaries" options={{ headerShown: false }} />
									<Stack.Screen name="SwiftPayBeneficiaries" options={{ headerShown: false }} />
									<Stack.Screen name="SendToBeneficiary" options={{ headerShown: false }} />
									<Stack.Screen name="SingleBankTransfer" options={{ headerShown: false }} />
									<Stack.Screen name="Report" options={{ headerShown: false }} />
									<Stack.Screen name="MultipleBankTransfer" options={{ headerShown: false }} />
									<Stack.Screen name="AllMultipleBanks" options={{ headerShown: false }} />
									<Stack.Screen name="MultipleTransferSummary" options={{ headerShown: false }} />
									<Stack.Screen name="MultipleSwiftpayTransfer" options={{ headerShown: false }} />
									<Stack.Screen name="AllMultipleSwiftpay" options={{ headerShown: false }} />
									<Stack.Screen name="MultipleSwiftpaySummary" options={{ headerShown: false }} />
									<Stack.Screen name="SaveNow" options={{ headerShown: false }} />
									<Stack.Screen name="SaveWithInterest" options={{ headerShown: false }} />
									<Stack.Screen name="SavingsDetails" options={{ headerShown: false }} />
									<Stack.Screen name="SavingsHistory" options={{ headerShown: false }} />
									<Stack.Screen name="InterestSavingsCreated" options={{ headerShown: false }} />
									<Stack.Screen name="CreateSavings" options={{ headerShown: false }} />
									<Stack.Screen name="Transactions" options={{ headerShown: false }} />
									<Stack.Screen name="Profile" options={{ headerShown: false }} />
									<Stack.Screen name="Document" options={{ headerShown: false }} />
									<Stack.Screen name="KycLevelOne" options={{ headerShown: false }} />
									<Stack.Screen name="KycLevelTwo" options={{ headerShown: false }} />
									<Stack.Screen name="KycLevelThree" options={{ headerShown: false }} />
									<Stack.Screen name="QrCodeMain" options={{ headerShown: false }} />
									<Stack.Screen name="Myqrcode" options={{ headerShown: false }} />
									<Stack.Screen name="GroupSavings" options={{ headerShown: false }} />
									<Stack.Screen name="AirtimeData" options={{ headerShown: false }} />
									<Stack.Screen name="BillReceipt" options={{ headerShown: false }} />
									<Stack.Screen name="Electricity" options={{ headerShown: false }} />
									<Stack.Screen name="Tv" options={{ headerShown: false }} />
									<Stack.Screen name="ComingSoon" options={{ headerShown: false }} />
									<Stack.Screen name="MyAccount" options={{ headerShown: false }} />
									<Stack.Screen name="ChangeSwiftpayTag" options={{ headerShown: false }} />
									<Stack.Screen name="CreateSwiftpayTag" options={{ headerShown: false }} />
									<Stack.Screen name="CustomerCare" options={{ headerShown: false }} />
									<Stack.Screen name="ChangePassword" options={{ headerShown: false }} />
									<Stack.Screen name="EnterCodeScreen" options={{ headerShown: false }} />
									<Stack.Screen name="ResetPassword" options={{ headerShown: false }} />
									<Stack.Screen name="ChangePin" options={{ headerShown: false }} />
									<Stack.Screen name="EnterPin" options={{ headerShown: false }} />
									<Stack.Screen name="TwoFactorAuthentication" options={{ headerShown: false }} />
									<Stack.Screen name="AuthVerification" options={{ headerShown: false }} />
									<Stack.Screen name="GroupDashboard" options={{ headerShown: false }} />
									<Stack.Screen name="GroupSavingsDetails" options={{ headerShown: false }} />
									<Stack.Screen name="HoldingsInvest" options={{ headerShown: false }} />
									<Stack.Screen name="StartHoldings" options={{ headerShown: false }} />
									<Stack.Screen name="InvestDashboard" options={{ headerShown: false }} />
									<Stack.Screen name="HoldingsSaveInHardCurrency" options={{ headerShown: false }} />
									<Stack.Screen name="Fiats" options={{ headerShown: false }} />
									<Stack.Screen name="InvestAsset" options={{ headerShown: false }} />
									<Stack.Screen name="InvestAssetHoldings" options={{ headerShown: false }} />
									<Stack.Screen name="InvestDetails" options={{ headerShown: false }} />
									<Stack.Screen name="InvestDetailsHoldings" options={{ headerShown: false }} />
									<Stack.Screen name="InternationalTransfer" options={{ headerShown: false }} />
									<Stack.Screen name="SendToAbroad" options={{ headerShown: false }} />
									<Stack.Screen name="TransferAbroad" options={{ headerShown: false }} />
									<Stack.Screen name="AjoContributionDashboard" options={{ headerShown: false }} />
									<Stack.Screen name="AjoContributionHistory" options={{ headerShown: false }} />
									<Stack.Screen name="CreateAjo" options={{ headerShown: false }} />
									<Stack.Screen name="ConfirmationScreen" options={{ headerShown: false }} />
									<Stack.Screen name="GroupDetails" options={{ headerShown: false }} />
									<Stack.Screen name="GroupSavingsHistory" options={{ headerShown: false }} />
									<Stack.Screen name="Confirmation" options={{ headerShown: false }} />
									<Stack.Screen
										name="TransactionReceipt"
										options={{
											headerShown: false,
											animation: "slide_from_bottom",
										}}
									/>
									<Stack.Screen name="SendAfricaReceiveMoney" options={{ headerShown: false }} />
									<Stack.Screen name="AjoDetails" options={{ headerShown: false }} />
									<Stack.Screen name="StartAjoSavings" options={{ headerShown: false }} />
									<Stack.Screen name="CreateAjoSavings" options={{ headerShown: false }} />
									<Stack.Screen name="AjoSavingsDetails" options={{ headerShown: false }} />
									<Stack.Screen name="AllAjoHistory" options={{ headerShown: false }} />
									<Stack.Screen name="StatusInformation" options={{ headerShown: false }} />
									<Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />
									<Stack.Screen name="resetOtp" options={{ headerShown: false }} />
									<Stack.Screen name="Affiliate" options={{ headerShown: false }} />
									<Stack.Screen name="InternetService" options={{ headerShown: false }} />
									<Stack.Screen name="CreateInvestHoldings" options={{ headerShown: false }} />
									<Stack.Screen name="EditAjoContribution" options={{ headerShown: false }} />
									<Stack.Screen
										name="JoinGroup"
										options={{
											headerShown: false,
											animation: "slide_from_bottom",
										}}
									/>
									<Stack.Screen name="JoinGroupsavingDetails" options={{ headerShown: false }} />
									<Stack.Screen name="CreateGroupSavings" options={{ headerShown: false }} />
									<Stack.Screen name="GroupSavingsCreated" options={{ headerShown: false }} />
									<Stack.Screen name="EditGroupSavings" options={{ headerShown: false }} />
									<Stack.Screen name="Members" options={{ headerShown: false }} />
									<Stack.Screen name="MemberDetails" options={{ headerShown: false }} />
									<Stack.Screen name="Terms" options={{ headerShown: false }} />
									<Stack.Screen name="DeviceSessions" options={{ headerShown: false }} />
									<Stack.Screen name="FaceCapturing" options={{ headerShown: false }} />
									<Stack.Screen name="GenerateAccontNumber" options={{ headerShown: false }} />
									<Stack.Screen name="VerifyAccount" options={{ headerShown: false }} />
									<Stack.Screen name="GiftCardPreview" options={{ headerShown: false }} />
									<Stack.Screen name="ConfirmTransactionPin" options={{ headerShown: false }} />
									<Stack.Screen name="BureauDeChangeSell" options={{ headerShown: false }} />
									<Stack.Screen name="HardCurrencyDetails" options={{ headerShown: false }} />
									<Stack.Screen name="HoldingsHistory" options={{ headerShown: false }} />
									<Stack.Screen name="InvestmentHistory" options={{ headerShown: false }} />
									<Stack.Screen name="Payback" options={{ headerShown: false }} />
									<Stack.Screen name="Privacy" options={{ headerShown: false }} />
									<Stack.Screen name="Betting" options={{ headerShown: false }} />
									<Stack.Screen name="BettingHistory" options={{ headerShown: false }} />
									<Stack.Screen name="PaymentLink" options={{ headerShown: false }} />
									<Stack.Screen name="CreatePaymentLink" options={{ headerShown: false }} />
								</Stack>
								<Toast visibilityTime={4000} />
							</View>
						)}
						{/* <StatusBar
              backgroundColor={Platform.OS === "android" ? "blue" : undefined}
              barStyle={
                Platform.OS === "ios"
                  ? colorScheme === "dark"
                    ? "light-content"
                    : "dark-content"
                  : "light-content"
              }
              translucent={Platform.OS === "android"}

              /> */}
					</ThemeProvider>
				</QueryProvider>
			</QueryClientProvider>
		</ToastProvider>
	);
}
