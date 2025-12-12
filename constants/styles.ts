import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontWeight: "500",
  },
  bottomSheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 120,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    flex: 1,
  },
  closeButton: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: "#CC1212",
    borderRadius: 15,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  cardSection: {
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "400",
  },
  cardLabelTotal: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "700",
  },
  cardValue: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "500",
  },
  cardValueHighlight: {
    fontSize: 15,
    color: "#1400FB",
    fontWeight: "700",
  },
  cardValueTotal: {
    fontSize: 16,
    color: "#1400FB",
    fontWeight: "700",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 16,
  },

  // PIN Section Styles
  pinContainer: {
    marginVertical: 16,
  },
  pinTextContainer: {
    marginBottom: 20,
  },
  pinTextTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  pinTextSub: {
    fontSize: 14,
    color: "#666666",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 20,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    color: "#000",
    fontWeight: "700",
    backgroundColor: "#F8F9FA",
  },

  // Button Styles
  completeButton: {
    backgroundColor: "#1400FB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  completeButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },

  // Success Sheet Styles (continued)
  successContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00952A",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  doneButton: {
    backgroundColor: "#1400FB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  subTitle: {
    color: "#666",
  },
});
