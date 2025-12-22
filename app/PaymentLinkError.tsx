import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const PaymentLinkError = () => {
	const handleTryAgain = () => {
		// Navigate back to the payment link creation screen or retry
		router.back();
	};

	const handleBackToHome = () => {
		router.push("/");
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.iconContainer}>
					<AntDesign name="close" size={80} color="#FFFFFF" />
				</View>

				<Text style={styles.title}>Failed to create payment link</Text>
				<Text style={styles.description}>Oops there was an error trying to create your payment link</Text>
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
					<Text style={styles.primaryButtonText}>Try again</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
					<Text style={styles.secondaryButtonText}>Back to home</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default PaymentLinkError;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		padding: 20,
		justifyContent: "space-between",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	iconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "#EF5350",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 30,
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#000",
		marginBottom: 15,
		textAlign: "center",
	},
	description: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		lineHeight: 20,
	},
	buttonContainer: {
		marginBottom: 20,
	},
	primaryButton: {
		backgroundColor: "#0000FF",
		borderRadius: 25,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 15,
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
	secondaryButton: {
		backgroundColor: "#FFFFFF",
		borderRadius: 25,
		paddingVertical: 16,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#0000FF",
	},
	secondaryButtonText: {
		color: "#0000FF",
		fontSize: 16,
		fontWeight: "600",
	},
});
