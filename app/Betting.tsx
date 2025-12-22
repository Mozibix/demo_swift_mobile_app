import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, SafeAreaView, Image } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const BettingScreen = () => {
	const [selectedProvider, setSelectedProvider] = useState("Sportybet");
	const [selectedAmount, setSelectedAmount] = useState(null);
	const [customAmount, setCustomAmount] = useState("");
	const [userId, setUserId] = useState("8039840914");
	const [showProviderModal, setShowProviderModal] = useState(false);
	const [accountVerified, setAccountVerified] = useState(true);
	const [isPaymentSummaryVisible, setIsPaymentSummaryVisible] = useState(false);

	const navigate = useRouter();

	const amounts = [100, 500, 1000, 2000, 5000, 10000];

	const providers = [
		{ name: "Bet9ja", image: require("../assets/Bills/bet9ja.jpg") },
		{ name: "Bangbet", image: require("../assets/Bills/bangbet.jpg") },
		{ name: "MerryBet", image: require("../assets/Bills/merrybet.png") },
		{ name: "Sportybet", image: require("../assets/Bills/sporty.png") },
		{ name: "BetKing", image: require("../assets/Bills/betking.jpg") },
		{ name: "Paripesa", image: require("../assets/Bills/paripesa.jpg") },
		{ name: "Nairabet", image: require("../assets/Bills/nairabet.jpg") },
		{ name: "Supabet", image: require("../assets/Bills/supabet.png") },
		{ name: "1xbet", image: require("../assets/Bills/1bet.png") },
	];

	const getCurrentProvider = () => {
		return providers.find((p) => p.name === selectedProvider) || providers[3];
	};

	const handlePayment = () => {
		if (!userId || userId.length < 8) {
			setAccountVerified(false);
			return;
		}

		const paymentAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

		if (!paymentAmount || paymentAmount < 150) {
			alert("Please select or enter an amount (minimum ₦150)");
			return;
		}

		setIsPaymentSummaryVisible(true);
	};

	const handleCompletePayment = () => {
		setIsPaymentSummaryVisible(false);
		// Here you would typically navigate to PIN entry or process payment
		alert("Processing payment...");
	};

	const handleUserIdChange = (text: string) => {
		setUserId(text);
		setAccountVerified(text.length >= 8);
	};

	const handleAmountSelect = (amount: any) => {
		setSelectedAmount(amount);
		setCustomAmount("");
	};

	const handleCustomAmountChange = (text: string) => {
		const numericText = text.replace(/[^0-9]/g, "");
		setCustomAmount(numericText);
		setSelectedAmount(null);
	};

	const getPaymentAmount = () => {
		if (customAmount) {
			return parseFloat(customAmount);
		}
		return selectedAmount || 0;
	};

	const formatAmount = (amount: number) => {
		return amount.toLocaleString();
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<TouchableOpacity style={styles.backButton}>
						<Ionicons name="chevron-back" size={24} color="#000" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Betting</Text>
				</View>
				<TouchableOpacity onPress={() => navigate.push("/BettingHistory")}>
					<Text style={styles.historyText}>History</Text>
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Hot Offers Row */}
				<View style={styles.topSection}>
					<View style={styles.hotOffersRow}>
						<View style={styles.hotOffersBadge}>
							<Text style={styles.hotOffersText}>🔥 Hot Offers</Text>
						</View>
						<Text style={styles.vouchersLabel}>All Vouchers</Text>
					</View>

					{/* Banner and Amount Card Row */}
					<View style={styles.bannerRow}>
						{/* Promo Banner */}
						<Image style={styles.headerImage} source={require("../assets/Bills/bet-banner.jpg")} />

						{/* Amount Card */}
						<View style={styles.amountCard}>
							<Text style={styles.amountCardLabel}>₦100</Text>
							<Text style={styles.amountCardSubtext}>Betting{"\n"}Voucher</Text>
							<TouchableOpacity style={styles.buyButton}>
								<Text style={styles.buyButtonText}>Get</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Service Provider */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Service Provider</Text>
					<TouchableOpacity style={styles.providerCard} onPress={() => setShowProviderModal(true)}>
						<View style={styles.providerLeft}>
							<Image source={getCurrentProvider().image} style={styles.providerImage} resizeMode="contain" />
							<Text style={styles.providerName}>{selectedProvider}</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#666" />
					</TouchableOpacity>
				</View>

				{/* User ID */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>User ID</Text>
					<View style={styles.inputCard}>
						<TextInput style={styles.userIdInput} value={userId} onChangeText={handleUserIdChange} keyboardType="numeric" placeholder="Enter User ID" placeholderTextColor="#999" />
					</View>
					{accountVerified && (
						<View style={styles.accountInfo}>
							<Text style={styles.accountLabel}>Account Name</Text>

							<View style={styles.accountRow}>
								<Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
								<Text style={styles.accountName}>Paul Prince Adeba</Text>
							</View>
						</View>
					)}
				</View>

				{/* Select Amount */}
				<View style={[styles.section, { marginTop: 20 }]}>
					<Text style={styles.sectionTitle}>Select Amount</Text>
					<View style={styles.amountGrid}>
						{amounts.map((amount) => (
							<TouchableOpacity key={amount} style={[styles.amountButton, selectedAmount === amount && styles.amountButtonSelected]} onPress={() => handleAmountSelect(amount)}>
								<Text style={[styles.amountText, selectedAmount === amount && styles.amountTextSelected]}>₦{formatAmount(amount)}</Text>
								<Text style={[styles.amountSubtext, selectedAmount === amount && styles.amountSubtextSelected]}>Pay ₦{formatAmount(amount)}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Custom Amount Input */}
				<View style={styles.customAmountSection}>
					<View style={styles.customAmountContainer}>
						<Text style={styles.currencySymbol}>₦</Text>
						<TextInput style={styles.customAmountInput} value={customAmount} onChangeText={handleCustomAmountChange} keyboardType="numeric" placeholder="100 - 1,000,000" placeholderTextColor="#BFBFBF" />
					</View>

					{/* Pay Button */}
					<TouchableOpacity style={styles.payButton} onPress={handlePayment}>
						<Text style={styles.payButtonText}>Pay ₦{formatAmount(getPaymentAmount())}</Text>
					</TouchableOpacity>
				</View>

				{/* Featured Matches */}
				<View style={styles.featuredSection}>
					<View style={styles.featuredHeader}>
						<View style={styles.featuredTitleRow}>
							<Ionicons name="flash" size={16} color="#FFA500" />
							<Text style={styles.featuredTitle}>Featured Matches</Text>
						</View>
						<Text style={styles.englishPr}>English Pr...</Text>
					</View>

					<TouchableOpacity style={styles.matchCard}>
						<View style={styles.matchContent}>
							{/* Home Team */}
							<View style={styles.teamContainer}>
								<View style={[styles.teamLogo, { backgroundColor: "#034694" }]}>
									<MaterialIcons name="shield" size={24} color="#fff" />
								</View>
								<Text style={styles.teamName}>Chelsea FC</Text>
								<Text style={styles.matchTime}>14:00</Text>
								<Text style={styles.matchScore}>0 - 0</Text>
							</View>

							{/* Away Team */}
							<View style={styles.teamContainer}>
								<View style={[styles.teamLogo, { backgroundColor: "#1B458F" }]}>
									<MaterialIcons name="shield" size={24} color="#fff" />
								</View>
								<Text style={styles.teamName}>Crystal Palace</Text>
								<Text style={styles.matchTime}>14:00</Text>
								<Text style={styles.matchLeague}>English Pr...</Text>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity style={styles.matchCard}>
						<View style={styles.matchContent}>
							{/* Home Team */}
							<View style={styles.teamContainer}>
								<View style={[styles.teamLogo, { backgroundColor: "#034694" }]}>
									<MaterialIcons name="shield" size={24} color="#fff" />
								</View>
								<Text style={styles.teamName}>Chelsea FC</Text>
								<Text style={styles.matchTime}>14:00</Text>
								<Text style={styles.matchScore}>0 - 0</Text>
							</View>

							{/* Away Team */}
							<View style={styles.teamContainer}>
								<View style={[styles.teamLogo, { backgroundColor: "#1B458F" }]}>
									<MaterialIcons name="shield" size={24} color="#fff" />
								</View>
								<Text style={styles.teamName}>Crystal Palace</Text>
								<Text style={styles.matchTime}>14:00</Text>
								<Text style={styles.matchLeague}>English Pr...</Text>
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Provider Selection Modal */}
			<Modal visible={showProviderModal} animationType="slide" transparent={true} onRequestClose={() => setShowProviderModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<TouchableOpacity onPress={() => setShowProviderModal(false)}>
								<Ionicons name="chevron-back" size={28} color="#000" />
							</TouchableOpacity>
							<Text style={styles.modalTitle}>Select a Provider</Text>
							<View style={{ width: 24 }} />
						</View>

						<Text style={styles.modalSubtitle}>Select a provider from the list below</Text>

						<ScrollView style={styles.providerList}>
							{providers.map((provider) => (
								<TouchableOpacity
									key={provider.name}
									style={styles.providerItem}
									onPress={() => {
										setSelectedProvider(provider.name);
										setShowProviderModal(false);
									}}
								>
									<Image source={provider.image} style={styles.providerItemImage} resizeMode="contain" />
									<Text style={styles.providerItemName}>{provider.name}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Payment Summary Bottom Sheet */}
			<Modal visible={isPaymentSummaryVisible} animationType="slide" transparent={true} onRequestClose={() => setIsPaymentSummaryVisible(false)}>
				<TouchableOpacity style={styles.bottomSheetOverlay} activeOpacity={1} onPress={() => setIsPaymentSummaryVisible(false)}>
					<TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
						<View style={styles.bottomSheetContent}>
							{/* Header */}
							<View style={styles.bottomSheetHeader}>
								<Text style={styles.bottomSheetTitle}>Complete Payment</Text>
								<TouchableOpacity onPress={() => setIsPaymentSummaryVisible(false)} style={styles.closeButton}>
									<Ionicons name="close-circle" size={28} color="#FF0000" />
								</TouchableOpacity>
							</View>

							{/* Amount Display */}
							<Text style={styles.paymentAmount}>₦ {formatAmount(getPaymentAmount())}</Text>

							{/* Transaction Details */}
							<View style={styles.detailsContainer}>
								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Product Name</Text>
									<Text style={styles.detailValue}>{selectedProvider}</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Account Number</Text>
									<Text style={styles.detailValue}>{userId}</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Account Name</Text>
									<Text style={styles.detailValue}>Paul Prince Adeba</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Amount</Text>
									<Text style={styles.detailValue}>₦{formatAmount(getPaymentAmount())}</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Remark</Text>
									<Text style={styles.detailValue}>Betting</Text>
								</View>
							</View>

							{/* Payment Method */}
							<View style={styles.paymentMethodSection}>
								<Text style={styles.paymentMethodTitle}>Payment Method</Text>
								<View style={styles.paymentMethodCard}>
									<View style={styles.paymentMethodLeft}>
										<Text style={styles.paymentMethodLabel}>Swiffpay Balance</Text>
										<Text style={styles.balanceAmount}>₦ 2,345.98</Text>
									</View>
									<Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
								</View>
							</View>

							{/* Complete Payment Button */}
							<TouchableOpacity style={styles.completePaymentButton} onPress={handleCompletePayment}>
								<Text style={styles.completePaymentButtonText}>Complete Payment</Text>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
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
		paddingVertical: 12,
		backgroundColor: "#FFF",
		paddingTop: 40,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 20,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: "#000",
	},
	historyText: {
		fontSize: 15,
		color: "#1400FB",
		fontWeight: "500",
	},
	content: {
		flex: 1,
	},
	headerImage: {
		width: "67%",
		height: 95,
		borderRadius: 12,
	},
	topSection: {
		backgroundColor: "#F9F9F9",
		paddingHorizontal: 10,
		paddingTop: 6,
		paddingBottom: 16,
		margin: 16,
		borderRadius: 12,
	},
	hotOffersRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	hotOffersBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	hotOffersText: {
		fontSize: 14,
		fontWeight: "600",
	},
	vouchersLabel: {
		fontSize: 12,
		color: "#1400FB",
		fontWeight: "500",
	},
	bannerRow: {
		flexDirection: "row",
		gap: 10,
	},
	amountCard: {
		width: "30%",
		backgroundColor: "#F5F7FA",
		borderRadius: 12,
		padding: 12,
		alignItems: "center",
		justifyContent: "space-between",
		borderWidth: 1,
		borderColor: "#1400FB",
		height: 95,
	},
	amountCardLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#000",
		marginBottom: 4,
	},
	amountCardSubtext: {
		fontSize: 9,
		color: "#666",
		textAlign: "center",
		marginBottom: 8,
		lineHeight: 11,
	},
	buyButton: {
		paddingHorizontal: 24,
		paddingVertical: 6,
		borderRadius: 16,
		borderColor: "#1400FB",
		borderWidth: 1,
	},
	buyButtonText: {
		color: "#1400FB",
		fontSize: 12,
		fontWeight: "600",
	},
	section: {
		paddingHorizontal: 16,
		marginTop: 10,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
		marginBottom: 10,
	},
	providerCard: {
		backgroundColor: "#F2F2F2",
		borderRadius: 8,
		padding: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	providerLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	providerImage: {
		width: 32,
		height: 32,
		marginRight: 12,
		borderRadius: 16,
	},
	providerName: {
		fontSize: 15,
		color: "#000",
		fontWeight: "500",
	},
	inputCard: {
		backgroundColor: "#F2F2F2",
		borderRadius: 8,
		padding: 16,
		marginBottom: 8,
	},
	userIdInput: {
		fontSize: 15,
		color: "#000",
	},
	accountInfo: {
		backgroundColor: "#CFEAFF",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 10,
		width: "100%",
	},
	accountLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#1F1F1F",
	},
	accountRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	accountName: {
		fontSize: 12,
		fontWeight: "600",
		color: "#0B57D0",
		marginLeft: 8,
	},
	amountGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	amountButton: {
		width: "31.5%",
		backgroundColor: "#F7F7F7",
		borderRadius: 8,
		paddingVertical: 16,
		paddingHorizontal: 8,
		alignItems: "center",
	},
	amountButtonSelected: {
		backgroundColor: "#EEF2FF",
		borderColor: "#1400FB",
		borderWidth: 1.5,
	},
	amountText: {
		fontSize: 15,
		color: "#000",
		fontWeight: "600",
		marginBottom: 4,
	},
	amountTextSelected: {
		color: "#1400FB",
		fontWeight: "700",
	},
	amountSubtext: {
		fontSize: 11,
		color: "#999",
		fontWeight: "400",
	},
	amountSubtextSelected: {
		color: "#1400FB",
	},
	customAmountSection: {
		paddingHorizontal: 16,
		marginTop: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	customAmountContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 8,
		paddingVertical: 16,
		paddingHorizontal: 6,
		borderBottomWidth: 1,
		borderColor: "#E5E7EB",
		width: "60%",
	},
	currencySymbol: {
		fontSize: 16,
		color: "#000",
		marginRight: 16,
		fontWeight: "500",
	},
	customAmountInput: {
		flex: 1,
		fontSize: 15,
		color: "#000",
		padding: 0,
	},
	payButton: {
		backgroundColor: "#1400FB",
		borderRadius: 30,
		alignItems: "center",
		width: 121,
		height: 51,
		flexDirection: "row",
		justifyContent: "center",
	},
	payButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	featuredSection: {
		paddingHorizontal: 16,
		marginBottom: 24,
		marginTop: 20,
	},
	featuredHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	featuredTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	featuredTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: "#000",
	},
	englishPr: {
		fontSize: 12,
		color: "#1400FB",
		fontWeight: "500",
	},
	matchCard: {
		backgroundColor: "#fff",
		borderRadius: 8,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	matchContent: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	teamContainer: {
		flex: 1,
		alignItems: "center",
	},
	teamLogo: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 6,
	},
	teamName: {
		fontSize: 11,
		color: "#000",
		textAlign: "center",
		marginBottom: 4,
		fontWeight: "500",
	},
	matchTime: {
		fontSize: 12,
		fontWeight: "600",
		color: "#000",
		marginBottom: 2,
	},
	matchScore: {
		fontSize: 10,
		color: "#666",
	},
	matchLeague: {
		fontSize: 10,
		color: "#666",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingTop: 20,
		maxHeight: "80%",
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginBottom: 8,
	},
	modalTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: "#000",
	},
	modalSubtitle: {
		fontSize: 13,
		color: "#999",
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	providerList: {
		paddingHorizontal: 16,
	},
	providerItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#F5F7FA",
	},
	providerItemImage: {
		width: 36,
		height: 36,
		marginRight: 12,
		borderRadius: 18,
	},
	providerItemName: {
		fontSize: 15,
		color: "#000",
		fontWeight: "500",
	},
	bottomSheetOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "flex-end",
	},
	bottomSheetContent: {
		backgroundColor: "#FFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 40,
	},
	bottomSheetHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	bottomSheetTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#000",
	},
	closeButton: {
		padding: 4,
	},
	paymentAmount: {
		fontSize: 36,
		fontWeight: "700",
		color: "#000",
		textAlign: "center",
		marginBottom: 24,
	},
	detailsContainer: {
		backgroundColor: "#F9F9F9",
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	detailLabel: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
	},
	detailValue: {
		fontSize: 14,
		color: "#000",
		fontWeight: "600",
	},
	paymentMethodSection: {
		marginBottom: 24,
	},
	paymentMethodTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#000",
		marginBottom: 12,
	},
	paymentMethodCard: {
		backgroundColor: "#F9F9F9",
		borderRadius: 12,
		padding: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	paymentMethodLeft: {
		flex: 1,
	},
	paymentMethodLabel: {
		fontSize: 13,
		color: "#666",
		marginBottom: 4,
		fontWeight: "500",
	},
	balanceAmount: {
		fontSize: 20,
		fontWeight: "700",
		color: "#000",
	},
	completePaymentButton: {
		backgroundColor: "#1400FB",
		borderRadius: 30,
		paddingVertical: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	completePaymentButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

export default BettingScreen;
