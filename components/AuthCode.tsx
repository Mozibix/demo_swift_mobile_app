import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "react-native-elements";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import LoadingComp from "./Loading";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showLogs } from "@/utils/logger";
import Button from "./ui/Button";
import { useAuth } from "@/context/AuthContext";
import { navigationWithReset } from "@/utils";
import { showErrorToast, showSuccessToast } from "./ui/Toast";
import { IS_ANDROID_DEVICE } from "@/constants";

const AuthCode = () => {
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");

	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const inputRefs = useRef<(TextInput | null)[]>([]);
	const [counter, setCounter] = useState(60);
	const { setUser } = useAuth();
	const params = useLocalSearchParams();
	const navigation = useNavigation();

	useEffect(() => {
		let timer: NodeJS.Timeout | number = 0;
		if (counter > 0) {
			timer = setInterval(() => {
				setCounter((prevCounter) => prevCounter - 1);
			}, 1000);
		}

		return () => clearInterval(timer);
	}, [counter]);

	const handleOtpChange = (text: string, index: number) => {
		const newOtp = [...otp];
		newOtp[index] = text;
		setOtp(newOtp);

		if (text && index < 6) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyPress = (e: any, index: number) => {
		if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
			// Move to the previous input
			if (index > 0) {
				inputRefs.current[index - 1]?.focus();
			}
		}
	};

	async function HandleApi() {
		try {
			setLoading(true);

			const token = await SecureStore.getItemAsync("otpToken");
			if (!token) {
				throw new Error("Authentication token not found");
			}

			const response = await axios.post(
				"https://swiftpaymfb.com/api/onboarding/verify-otp",
				{ otp_code: otp.join("") },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.data) {
				throw new Error("Invalid server response");
			}

			// showLogs("response", response.data);

			const data = response.data.data;
			if (data.token) {
				await SecureStore.setItemAsync("userToken", data.token);
			}

			if (data.user) {
				await SecureStore.setItemAsync("userData", JSON.stringify(data.user));
				setUser(data.user);
			}

			await SecureStore.setItemAsync("biometricEmail", email);
			await SecureStore.setItemAsync("biometricPassword", (params.password as string) ?? "");
			await AsyncStorage.setItem("biometricEmail", email);

			navigationWithReset(navigation, "(tabs)");

			router.replace("/(tabs)");
		} catch (err: any) {
			// showLogs("err here", err.response.data);
			console.log("otp", Number(otp.join("")));
			if (err.response?.status === 422) {
				showErrorToast({
					title: "Authentication Failed",
					desc: Object.values(err.response.data.errors).flat().join("\n"),
				});
			} else if (err.response?.status === 401) {
				showErrorToast({
					title: "Authentication Failed",
					desc: "Invalid details provided",
				});
			} else {
				showErrorToast({
					title: "Authentication Failed",
					desc: err.response?.data?.message || "An error occurred during login",
				});
			}
			// console.log(err.response);
			showLogs("err.response", err.response);
			throw err;
		} finally {
			setLoading(false);
		}
	}

	const resendOTP = async () => {
		setLoading(true);

		try {
			const token = await SecureStore.getItemAsync("otpToken");
			console.log("Retrieved token:", token);

			if (!token) {
				throw new Error("Authentication token not found");
			}

			const response = await axios.post(
				"https://swiftpaymfb.com/api/onboarding/resend-otp",
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			setCounter(60);

			showSuccessToast({
				title: "Resent Successfully",
				desc: response.data.message || "Check yur email for the new verification code",
			});
		} catch (error: any) {
			console.error("Resend OTP error:", error.response || error.message);

			const errorMessage = error.response?.data?.message || error.message || "Failed to resend OTP";

			showErrorToast({
				title: "Resend Failed",
				desc: errorMessage,
			});
			if (error.response?.status === 401) {
				// Handle unauthorized access
				router.replace("/login");
			}
		} finally {
			setLoading(false);
		}
	};

	async function getEmail() {
		let userEmail = await AsyncStorage.getItem("biometricEmail");
		console.log("userEmail", userEmail);
		setEmail(userEmail ?? "");
	}

	useEffect(() => {
		getEmail();
	}, []);

	return (
		<SafeAreaView className="flex-1 bg-white">
			<View style={[styles.container, { paddingTop: IS_ANDROID_DEVICE ? 10 : 0 }]}>
				<LoadingComp visible={loading} />
				{/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity> */}

				<Text style={styles.headerText}>Two Factor Authentication</Text>

				<Text style={styles.descriptionText}>
					Enter the Authentication code sent to <Text className="font-bold">{email}</Text>
				</Text>

				<Text style={styles.label}>Verification Code</Text>
				<View style={styles.otpContainer}>
					{otp.map((digit, index) => (
						<TextInput
							key={index}
							ref={(ref) => (inputRefs.current[index] = ref)}
							style={styles.otpInput}
							keyboardType="number-pad"
							maxLength={1}
							value={digit}
							onChangeText={(text) => handleOtpChange(text, index)}
							onKeyPress={(e) => handleKeyPress(e, index)}
							autoFocus={index === 0} // Auto-focus the first input
						/>
					))}
				</View>
				<Text className="text-[15px]">It may take a while to receive the code.</Text>

				{counter > 0 ? (
					<Text className="mt-2 mb-4">
						Resend code in <Text className="text-swiftPayBlue font-semibold">{counter}s</Text>
					</Text>
				) : (
					<Text style={styles.resendCode} className="mt-2">
						Didn't receive the code?{" "}
						<Text onPress={resendOTP} style={styles.resend}>
							Resend
						</Text>
					</Text>
				)}

				<Button text="Submit" onPress={HandleApi} disabled={otp.join("").length < 6} />

				<Toast />
			</View>
		</SafeAreaView>
	);
};

export default AuthCode;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
		marginTop: 40,
	},
	otpContainer: {
		flexDirection: "row",
		marginBottom: 30,
		width: "100%",
		// gap: 35,
		alignSelf: "center",
		justifyContent: "space-evenly",
	},
	otpInput: {
		width: "14%",
		height: 65,
		borderWidth: 1,
		borderColor: "#999", // Success green color for the border
		borderRadius: 15,
		textAlign: "center",
		fontSize: 30,
		color: "#000",
		fontWeight: "900",
	},
	headerText: {
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 10,
		color: "#000",
	},
	descriptionText: {
		fontSize: 16,
		color: "#7E7E7E",
		marginBottom: 40,
	},
	backButton: {
		marginTop: 40,
		marginBottom: 20,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 100,
		padding: 10,
		width: 45,
		left: -15,
	},
	saveButton: {
		backgroundColor: "#0000FF", // Blue color for the button
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		gap: 20,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "400",
	},
	label: {
		fontWeight: "600",
		marginBottom: 10,
		fontSize: 17,
	},
	resend: {
		color: "#0000ff",
		fontWeight: "600",
	},
	resendCode: {
		marginBottom: 40,
		fontSize: 15,
	},
});
