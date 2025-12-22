import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const PaymentLinkScreen = () => {
	const [selectedTab, setSelectedTab] = useState("payment");

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton}>
					<Ionicons name="chevron-back" size={24} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Select Invoice Or Payment Link</Text>
			</View>

			{/* Tab Switcher */}
			<View style={styles.tabContainer}>
				<TouchableOpacity style={[styles.tab, selectedTab === "invoice" && styles.tabActive]} onPress={() => setSelectedTab("invoice")}>
					<Text style={[styles.tabText, selectedTab === "invoice" && styles.tabTextActive]}>Create Invoice</Text>
				</TouchableOpacity>

				<TouchableOpacity style={[styles.tab, selectedTab === "payment" && styles.tabActive]} onPress={() => setSelectedTab("payment")}>
					<Text style={[styles.tabText, selectedTab === "payment" && styles.tabTextActive]}>Create Payment Link</Text>
				</TouchableOpacity>
			</View>

			{/* Empty State */}
			<View style={styles.content}>
				<View style={styles.emptyState}>
					{/* Link Icon with Gradient */}
					<Image style={{ width: 140, height: 140 }} source={require("../assets/Bills/link.png")} />

					<Text style={styles.emptyText}>You haven't created any payment link yet.</Text>
				</View>
			</View>

			{/* Bottom Buttons */}
			<View style={styles.buttonContainer}>
				<TouchableOpacity onPress={() => router.push("/CreatePaymentLink")} style={styles.primaryButton}>
					<Text style={styles.primaryButtonText}>Create New Payment Link</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.secondaryButton}>
					<Text style={styles.secondaryButtonText}>Back to home</Text>
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
		fontSize: 16,
		fontWeight: "600",
		color: "#000",
		flex: 1,
	},
	tabContainer: {
		flexDirection: "row",
		paddingHorizontal: 16,
		marginTop: 8,
		gap: 8,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		backgroundColor: "#F5F5F5",
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: "#FFF",
	},
	tabText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},
	tabTextActive: {
		color: "#000",
		fontWeight: "600",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
	},
	iconGradient: {
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
	},
	linkIcon: {
		width: 100,
		height: 100,
		justifyContent: "center",
		alignItems: "center",
	},
	linkChain: {
		width: 70,
		height: 70,
		position: "relative",
		transform: [{ rotate: "-45deg" }],
	},
	chainLink: {
		position: "absolute",
		width: 30,
		height: 45,
		borderWidth: 8,
		borderColor: "#FFF",
		borderRadius: 15,
	},
	chainLinkLeft: {
		left: 0,
		top: 12,
	},
	chainLinkRight: {
		right: 0,
		top: 12,
	},
	emptyText: {
		fontSize: 16,
		color: "#000",
		textAlign: "center",
		fontWeight: "500",
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

export default PaymentLinkScreen;
