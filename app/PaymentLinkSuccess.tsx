import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const PaymentLinkSuccess = () => {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.iconContainer}>
					<AntDesign name="check" size={80} color="#FFFFFF" />
				</View>

				<Text style={styles.title}>Link Created Successfully!</Text>
				<Text style={styles.description}>Your payment link for "96" Television for 150,000 has been successfully created</Text>
			</View>

			<TouchableOpacity style={styles.button} onPress={() => router.push("/")}>
				<Text style={styles.buttonText}>Back to home</Text>
			</TouchableOpacity>
		</View>
	);
};

export default PaymentLinkSuccess;

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
		backgroundColor: "#4CAF50",
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
	button: {
		backgroundColor: "#0000FF",
		borderRadius: 25,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 20,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});
