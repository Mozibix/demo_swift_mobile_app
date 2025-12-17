import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CheckBox from "@react-native-community/checkbox";

const CustomCheckbox: React.FC<{
	value: boolean;
	onValueChange: () => void;
}> = ({ value, onValueChange }) => {
	return (
		<TouchableOpacity onPress={onValueChange} style={styles.checkboxContainer}>
			<Ionicons name={value ? "checkbox" : "square-outline"} size={24} color="#0000ff" />
		</TouchableOpacity>
	);
};

const CardOrder = () => {
	const [isSelected, setSelection] = React.useState(false);

	const toggleCheckbox = () => setSelection(!isSelected);

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
				<AntDesign name="arrowleft" size={24} color="#000" />
			</TouchableOpacity>

			<Text style={styles.title}>Card Order</Text>

			<View style={styles.cardContainer}>
				<View style={styles.cardDetails}>
					<Text style={styles.cardNumber}>XXXX XXXX XXXX XXXX</Text>
					<Text style={styles.cardName}>John Doe</Text>
					<Text style={styles.cardExpiry}>VALID THRU 08/28</Text>
				</View>
			</View>

			<View style={styles.infoContainer}>
				<Text style={styles.infoText}>💳 Instant Access</Text>
				<Text style={styles.infoText}>Accepted by both local and international merchants.</Text>
				<Text style={styles.infoText}>CBN licensed, NDIC Insured</Text>
			</View>

			<View style={styles.checkboxContainer}>
				<CustomCheckbox value={isSelected} onValueChange={toggleCheckbox} />
				<Text style={styles.label}>
					I have accepted the <Text style={styles.link}>Terms and Conditions</Text>
				</Text>
			</View>

			<TouchableOpacity style={styles.getNowButton}>
				<Text style={styles.getNowButtonText}>Get Now</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 15,
		backgroundColor: "#fff",
	},
	backButton: {
		position: "absolute",
		top: 50,
		left: 20,
		backgroundColor: "#f2f2f2",
		borderRadius: 30,
		padding: 6,
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 50,
		textAlign: "center",
		marginTop: 30,
	},
	cardContainer: {
		backgroundColor: "#0047FF",
		borderRadius: 10,
		padding: 10,
		alignItems: "center",
		marginBottom: 20,
	},
	cardImage: {
		width: 300,
		height: 180,
		marginBottom: 20,
	},
	cardDetails: {
		alignItems: "center",
	},
	cardNumber: {
		color: "#fff",
		fontSize: 18,
		marginBottom: 10,
	},
	cardName: {
		color: "#fff",
		fontSize: 16,
		marginBottom: 10,
	},
	cardExpiry: {
		color: "#fff",
		fontSize: 14,
	},
	infoContainer: {
		marginBottom: 20,
	},
	infoText: {
		fontSize: 16,
		marginBottom: 10,
		color: "#666",
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	checkbox: {
		alignSelf: "center",
	},
	label: {
		marginLeft: 10,
	},
	link: {
		color: "#0047FF",
		textDecorationLine: "underline",
	},
	getNowButton: {
		backgroundColor: "#0047FF",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	getNowButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});

export default CardOrder;
