import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BettingHistoryScreen = () => {
	const transactions = [
		{
			id: 1,
			provider: "Bet9ja",
			amount: "₦200.00",
			date: "26-12-2024",
			time: "13:36:05",
			image: require("../assets/Bills/bet9ja.jpg"),
		},
		{
			id: 2,
			provider: "1xbet",
			amount: "₦200.00",
			date: "15-12-2024",
			time: "13:36:05",
			image: require("../assets/Bills/1bet.png"),
		},
		{
			id: 3,
			provider: "SportyBet",
			amount: "₦200.00",
			date: "15-08-2024",
			time: "13:36:05",
			image: require("../assets/Bills/sporty.png"),
		},
	];

	const navigate = useRouter();

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<TouchableOpacity onPress={() => navigate.back()} style={styles.backButton}>
						<Ionicons name="chevron-back" size={24} color="#1F1F1F" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Betting History</Text>
				</View>
				<TouchableOpacity>
					<Text style={styles.moreText}>More</Text>
				</TouchableOpacity>
			</View>

			{/* Transactions List */}
			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{transactions.map((transaction) => (
					<View key={transaction.id} style={styles.transactionCard}>
						<View style={styles.transactionLeft}>
							{/* Provider Icon */}
							<Image source={transaction.image} style={styles.providerIcon} resizeMode="cover" />

							{/* Provider Details */}
							<View style={styles.providerDetails}>
								<Text style={styles.providerName}>{transaction.provider}</Text>
								<Text style={styles.transactionDate}>
									{transaction.date} {transaction.time}
								</Text>
							</View>
						</View>

						{/* Right Side - Amount and Button */}
						<View style={styles.transactionRight}>
							<Text style={styles.amount}>{transaction.amount}</Text>
							<TouchableOpacity style={styles.buyAgainButton}>
								<Text style={styles.buyAgainText}>Buy Again</Text>
							</TouchableOpacity>
						</View>
					</View>
				))}
			</ScrollView>
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
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 16,
		paddingTop: 50,
		backgroundColor: "#FFF",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F1F1F",
	},
	content: {
		flex: 1,
		paddingTop: 20,
	},
	transactionCard: {
		backgroundColor: "#F9F9F9",
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 16,
		padding: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	transactionLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	moreText: {
		fontSize: 15,
		color: "#0000FF",
		fontWeight: "500",
	},
	providerIcon: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 14,
	},
	providerDetails: {
		flex: 1,
	},
	providerName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F1F1F",
		marginBottom: 6,
	},
	transactionDate: {
		fontSize: 13,
		color: "#B0B0B0",
		fontWeight: "400",
	},
	transactionRight: {
		alignItems: "flex-end",
		gap: 10,
	},
	amount: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F1F1F",
	},
	buyAgainButton: {
		backgroundColor: "#FFF",
		borderWidth: 2,
		borderColor: "#0000FF",
		paddingHorizontal: 16,
		paddingVertical: 4,
		borderRadius: 20,
	},
	buyAgainText: {
		color: "#0000FF",
		fontSize: 13,
		fontWeight: "600",
	},
});

export default BettingHistoryScreen;
