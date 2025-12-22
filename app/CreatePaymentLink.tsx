import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CreatePaymentLinkScreen = () => {
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton}>
					<Ionicons name="chevron-back" size={24} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Create Payment Link</Text>
			</View>

			{/* Content */}
			<View style={styles.content}>
				{/* Info Text */}
				<Text style={styles.infoText}>This is a one-off payment link that lets you receive payment from one person only.</Text>

				{/* Amount Input */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Amount</Text>
					<View style={styles.amountInputContainer}>
						<View style={styles.currencyContainer}>
							<View style={styles.nigeriaFlag}>
								<View style={styles.flagGreen} />
								<View style={styles.flagWhite} />
								<View style={styles.flagGreen} />
							</View>
							<Text style={styles.currencyText}>NGN</Text>
						</View>
						<TextInput style={styles.amountInput} placeholder="0" placeholderTextColor="#CCC" keyboardType="numeric" value={amount} onChangeText={setAmount} />
					</View>
				</View>

				{/* Description Input */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Description</Text>
					<TextInput style={styles.descriptionInput} placeholder="E.g. Raise money for my business" placeholderTextColor="#999" multiline value={description} onChangeText={setDescription} />
				</View>

				{/* Upload Image */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Upload an image (optional)</Text>
					<TouchableOpacity style={styles.uploadButton}>
						<View style={styles.uploadIconContainer}>
							<Ionicons name="image-outline" size={24} color="#999" />
						</View>
						<Text style={styles.uploadText}>Add an image for the background</Text>
						<Ionicons name="chevron-forward" size={20} color="#999" />
					</TouchableOpacity>
				</View>
			</View>

			{/* Bottom Buttons */}
			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.primaryButton}>
					<Text style={styles.primaryButtonText}>Share Payment Link</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.secondaryButton}>
					<Text style={styles.secondaryButtonText}>Save as draft</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
		paddingTop: 40,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000",
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 20,
	},
	infoText: {
		fontSize: 14,
		color: "#666",
		lineHeight: 20,
		marginBottom: 24,
	},
	inputGroup: {
		marginBottom: 24,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
		marginBottom: 12,
	},
	amountInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E0E0E0",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: "#FFF",
	},
	currencyContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingRight: 12,
		borderRightWidth: 1,
		borderRightColor: "#E0E0E0",
		marginRight: 12,
	},
	nigeriaFlag: {
		width: 24,
		height: 16,
		flexDirection: "row",
		borderRadius: 2,
		overflow: "hidden",
	},
	flagGreen: {
		flex: 1,
		backgroundColor: "#008751",
	},
	flagWhite: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	currencyText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#000",
	},
	amountInput: {
		flex: 1,
		fontSize: 16,
		color: "#000",
		padding: 0,
	},
	descriptionInput: {
		borderBottomWidth: 1,
		borderColor: "#E0E0E0",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 14,
		color: "#000",
		minHeight: 50,
		textAlignVertical: "top",
	},
	uploadButton: {
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1,
		borderColor: "#E0E0E0",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 16,
		gap: 12,
	},
	uploadIconContainer: {
		width: 40,
		height: 40,
		backgroundColor: "#F5F5F5",
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	uploadText: {
		flex: 1,
		fontSize: 14,
		color: "#999",
	},
	buttonContainer: {
		paddingHorizontal: 16,
		paddingBottom: 24,
		gap: 12,
	},
	primaryButton: {
		backgroundColor: "#1400FB",
		paddingVertical: 16,
		borderRadius: 30,
		alignItems: "center",
		shadowColor: "#1400FB",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	primaryButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "600",
	},
	secondaryButton: {
		backgroundColor: "#FFF",
		paddingVertical: 16,
		borderRadius: 30,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#1400FB",
	},
	secondaryButtonText: {
		color: "#1400FB",
		fontSize: 16,
		fontWeight: "600",
	},
});

export default CreatePaymentLinkScreen;
