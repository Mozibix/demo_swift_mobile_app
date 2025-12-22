import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useGlobals } from "@/context/GlobalContext";

const Bills = () => {
	const { isCryptoEnabled } = useGlobals();

	const billOptions = [
		{
			id: 1,
			label: "Electricity",
			image: require("../../assets/Bills/electricity.png"),
			route: "/Electricity" as const,
			bgColor: "#E3F2FD",
		},
		{
			id: 2,
			label: "TV & Internet",
			image: require("../../assets/Bills/tv.png"),
			route: "/Tv" as const,
			bgColor: "#FCE4EC",
		},
		{
			id: 3,
			label: "Invoice & Payment link",
			image: require("../../assets/Bills/paymentLink.png"),
			route: "/PaymentLink" as const,
			bgColor: "#E0F2F1",
		},
		{
			id: 4,
			label: "Airtime & Data",
			image: require("../../assets/Bills/phone.png"),
			route: "/AirtimeData" as const,
			bgColor: "#FFF9C4",
		},
		{
			id: 5,
			label: "Betting",
			image: require("../../assets/Bills/betting.png"),
			route: "/Betting" as const,
			bgColor: "#F3E5F5",
		},
	];

	return (
		<GestureHandlerRootView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={20} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerText}>Bill Payment</Text>
				<View style={styles.placeholder} />
			</View>

			<View style={styles.gridContainer}>
				{billOptions.slice(0, 3).map((option) => (
					<TouchableOpacity key={option.id} style={[styles.card, { backgroundColor: option.bgColor }]} onPress={() => router.push(option.route)}>
						<Image source={option.image} style={styles.icon} />
						<Text style={styles.label}>{option.label}</Text>
					</TouchableOpacity>
				))}
			</View>

			<View style={styles.gridContainer}>
				{billOptions.slice(3, 5).map((option) => (
					<TouchableOpacity key={option.id} style={[styles.card, { backgroundColor: option.bgColor }]} onPress={() => router.push(option.route)}>
						<Image source={option.image} style={styles.icon} />
						<Text style={styles.label}>{option.label}</Text>
					</TouchableOpacity>
				))}
				<View style={styles.emptyCard} />
			</View>

			<TouchableOpacity style={styles.continueButton}>
				<Text style={styles.continueButtonText}>Continue</Text>
			</TouchableOpacity>
		</GestureHandlerRootView>
	);
};

export default Bills;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		padding: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: "10%",
		marginBottom: 30,
	},
	backButton: {
		padding: 8,
	},
	headerText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000",
	},
	placeholder: {
		width: 36,
	},
	gridContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: 15,
	},
	card: {
		width: "31%",
		aspectRatio: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		padding: 10,
		marginBottom: 10,
	},
	emptyCard: {
		width: "31%",
		aspectRatio: 1,
	},
	icon: {
		width: 40,
		height: 40,
		marginBottom: 12,
		resizeMode: "contain",
	},
	label: {
		fontSize: 11,
		fontWeight: "500",
		color: "#000",
		textAlign: "center",
	},
	continueButton: {
		backgroundColor: "#1400FB",
		borderRadius: 25,
		paddingVertical: 16,
		alignItems: "center",
		position: "absolute",
		bottom: 30,
		left: 20,
		right: 20,
	},
	continueButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});
