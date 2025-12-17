import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BettingScreen = () => {
	const [selectedProvider, setSelectedProvider] = useState("Sportybet");
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [customAmount, setCustomAmount] = useState("");

	const amounts = [100, 500, 1000, 2000, 5000, 10000];

	const matches = [
		{
			league: "English Premier League",
			homeTeam: "Chelsea FC",
			awayTeam: "Crystal Palace",
			homeOdds: "2.00",
			awayOdds: "1.72",
		},
		{
			league: "English Premier League",
			homeTeam: "Chelsea FC",
			awayTeam: "Crystal Palace",
			homeOdds: "2.00",
			awayOdds: "1.72",
		},
	];

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton}>
					<Ionicons name="chevron-back" size={24} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Betting</Text>
				<TouchableOpacity>
					<Text style={styles.historyText}>History</Text>
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Promo Banner */}
				<View style={styles.promoBanner}>
					<Text style={styles.promoTitle}>1XBET</Text>
					<Text style={styles.promoSubtitle}>HYPER BONUS!</Text>
					<Text style={styles.promoDescription}>Up to ₦1,000,000 every Friday</Text>
				</View>

				{/* Balance Card */}
				<View style={styles.balanceCard}>
					<View style={styles.balanceRow}>
						<Text style={styles.redOrbit}>🔴 Red Orbit</Text>
						<Text style={styles.availableText}>All Available</Text>
					</View>
					<View style={styles.balanceAmountRow}>
						<Text style={styles.balanceAmount}>₦100</Text>
						<TouchableOpacity style={styles.topUpButton}>
							<Text style={styles.topUpText}>TOP UP</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Service Provider */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Service Provider</Text>
					<TouchableOpacity style={styles.providerCard}>
						<View style={styles.providerLeft}>
							<View style={styles.providerIcon}>
								<Text style={styles.providerIconText}>S</Text>
							</View>
							<Text style={styles.providerName}>Sportybet</Text>
						</View>
						<Ionicons name="chevron-down" size={20} color="#666" />
					</TouchableOpacity>
				</View>

				{/* User ID */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>User ID</Text>
					<View style={styles.inputCard}>
						<Text style={styles.userIdText}>805864324</Text>
					</View>
					<View style={styles.accountInfo}>
						<Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
						<Text style={styles.accountName}>Account Name</Text>
						<Text style={styles.accountDetails}>Titus Precious Adims</Text>
					</View>
				</View>

				{/* Select Amount */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Select Amount</Text>
					<View style={styles.amountGrid}>
						{amounts.map((amount) => (
							<TouchableOpacity key={amount} style={[styles.amountButton, selectedAmount === amount && styles.amountButtonSelected]} onPress={() => setSelectedAmount(amount)}>
								<Text style={[styles.amountText, selectedAmount === amount && styles.amountTextSelected]}>₦{amount.toLocaleString()}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Custom Amount Input */}
				<View style={styles.customAmountContainer}>
					<Text style={styles.currencySymbol}>₦</Text>
					<TextInput style={styles.customAmountInput} placeholder="Enter Amount" placeholderTextColor="#999" keyboardType="numeric" value={customAmount} onChangeText={setCustomAmount} />
				</View>

				{/* Pay Button */}
				<TouchableOpacity style={styles.payButton}>
					<Text style={styles.payButtonText}>Pay ₦200</Text>
				</TouchableOpacity>

				{/* Featured Matches */}
				<View style={styles.featuredSection}>
					<Text style={styles.featuredTitle}>⚡ Featured Matches</Text>

					{matches.map((match, index) => (
						<View key={index} style={styles.matchCard}>
							<Text style={styles.leagueText}>{match.league}</Text>
							<View style={styles.matchContent}>
								{/* Home Team */}
								<View style={styles.teamContainer}>
									<View style={styles.teamLogo}>
										<Ionicons name="shield" size={32} color="#034694" />
									</View>
									<Text style={styles.teamName}>{match.homeTeam}</Text>
									<Text style={styles.odds}>{match.homeOdds}</Text>
								</View>

								<Text style={styles.vsText}>VS</Text>

								{/* Away Team */}
								<View style={styles.teamContainer}>
									<View style={styles.teamLogo}>
										<Ionicons name="shield" size={32} color="#1B458F" />
									</View>
									<Text style={styles.teamName}>{match.awayTeam}</Text>
									<Text style={styles.odds}>{match.awayOdds}</Text>
								</View>
							</View>
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F7FA",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 50,
		paddingBottom: 16,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5E5",
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000",
	},
	historyText: {
		fontSize: 14,
		color: "#0066FF",
		fontWeight: "500",
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	promoBanner: {
		backgroundColor: "#000",
		borderRadius: 12,
		padding: 20,
		marginTop: 16,
		marginBottom: 12,
	},
	promoTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
	},
	promoSubtitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#00FF00",
		marginTop: 4,
	},
	promoDescription: {
		fontSize: 12,
		color: "#fff",
		marginTop: 4,
	},
	balanceCard: {
		backgroundColor: "#E3F2FD",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	balanceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	redOrbit: {
		fontSize: 14,
		color: "#666",
	},
	availableText: {
		fontSize: 12,
		color: "#666",
	},
	balanceAmountRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	balanceAmount: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#000",
	},
	topUpButton: {
		backgroundColor: "#0066FF",
		paddingHorizontal: 24,
		paddingVertical: 8,
		borderRadius: 20,
	},
	topUpText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
		marginBottom: 8,
	},
	providerCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	providerLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	providerIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#FF0000",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	providerIconText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
	},
	providerName: {
		fontSize: 16,
		color: "#000",
		fontWeight: "500",
	},
	inputCard: {
		backgroundColor: "#F8F9FA",
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#E5E5E5",
	},
	userIdText: {
		fontSize: 16,
		color: "#000",
	},
	accountInfo: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#E8F5E9",
		padding: 12,
		borderRadius: 8,
	},
	accountName: {
		fontSize: 12,
		color: "#666",
		marginLeft: 6,
	},
	accountDetails: {
		fontSize: 12,
		color: "#000",
		marginLeft: 6,
		fontWeight: "600",
	},
	amountGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	amountButton: {
		width: "31.5%",
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#E5E5E5",
	},
	amountButtonSelected: {
		backgroundColor: "#E3F2FD",
		borderColor: "#0066FF",
		borderWidth: 2,
	},
	amountText: {
		fontSize: 16,
		color: "#666",
		fontWeight: "500",
	},
	amountTextSelected: {
		color: "#0066FF",
		fontWeight: "600",
	},
	customAmountContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F8F9FA",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#E5E5E5",
	},
	currencySymbol: {
		fontSize: 16,
		color: "#000",
		marginRight: 8,
		fontWeight: "500",
	},
	customAmountInput: {
		flex: 1,
		fontSize: 16,
		color: "#000",
	},
	payButton: {
		backgroundColor: "#0066FF",
		borderRadius: 30,
		padding: 16,
		alignItems: "center",
		marginBottom: 24,
		shadowColor: "#0066FF",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	payButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	featuredSection: {
		marginBottom: 24,
	},
	featuredTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
		marginBottom: 12,
	},
	matchCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	leagueText: {
		fontSize: 12,
		color: "#666",
		marginBottom: 12,
	},
	matchContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	teamContainer: {
		flex: 1,
		alignItems: "center",
	},
	teamLogo: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#F5F7FA",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
	},
	teamName: {
		fontSize: 12,
		color: "#000",
		textAlign: "center",
		marginBottom: 4,
		fontWeight: "500",
	},
	odds: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
	},
	vsText: {
		fontSize: 12,
		color: "#999",
		marginHorizontal: 12,
		fontWeight: "500",
	},
});

export default BettingScreen;
