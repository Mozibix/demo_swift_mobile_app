import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard"; // Import Clipboard API
import { AntDesign } from "@expo/vector-icons";
import useWalletStore from "@/stores/useWalletStore";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const SellNetworks = () => {
  const setWalletDetails = useWalletStore((state) => state.setWalletDetails);
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>(
    {}
  );

  const networks = [
    {
      id: "bep20",
      name: "Binance Smart Chain",
      withdrawalsEnabled: "Yes",
      depositsEnabled: "Yes",
    },
    {
      id: "erc20",
      name: "Ethereum Network",
      withdrawalsEnabled: "Yes",
      depositsEnabled: "Yes",
    },
    {
      id: "trc20",
      name: "Tron Network",
      withdrawalsEnabled: "Yes",
      depositsEnabled: "Yes",
    },
    {
      id: "polygon",
      name: "Polygon Network",
      withdrawalsEnabled: "Yes",
      depositsEnabled: "Yes",
    },
  ];

  type WalletAddressState = { [key: string]: string };
  const [walletAddressGenerated, setWalletAddressGenerated] =
    useState<WalletAddressState>({});
  const [walletAddress, setWalletAddress] = useState<WalletAddressState>({});
  const [modalVisible, setModalVisible] = useState(false);

  // const handleGenerateAddress = (id: string) => {
  //   const newAddress = `0x${Array.from({ length: 40 }, () =>
  //     Math.floor(Math.random() * 16).toString(16)
  //   ).join("")}`;
  //   setWalletAddress((prev) => ({ ...prev, [id]: newAddress }));
  //   setWalletAddressGenerated((prev) => ({ ...prev, [id]: "generated" }));
  //   setModalVisible(true);
  // };

  const handleGenerateAddress = async (id: string) => {
    try {
      setIsGenerating((prev) => ({ ...prev, [id]: true }));

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        console.error("No authentication token found");
        setIsGenerating((prev) => ({ ...prev, [id]: false }));
        return;
      }

      const response = await axios.post(
        "https://swiftpaymfb.com/api/crypto-exchange/generate-payment-address",
        {
          network: id,
          currency_code: symbol,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showLogs("NEW ADDRESS", response.data);
      if (response.data.status === "success") {
        const newAddress = response.data.data.payment_address;
        setWalletAddress((prev) => ({ ...prev, [id]: newAddress }));
        setWalletAddressGenerated((prev) => ({ ...prev, [id]: "generated" }));
        setModalVisible(true);
      } else {
        setError(response.data.message || "Failed to generate address");
      }
    } catch (err: any) {
      console.error("Error generating address:", err);
      // Handle address already generated error
      if (err.response?.data?.message?.includes("Address already generated")) {
        setError(
          "Address already generated for this network. Please try another network."
        );
      } else {
        setError(
          err.response?.data?.message || "Failed to generate payment address"
        );
      }
    } finally {
      setIsGenerating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleCopyToClipboard = (address: string) => {
    Clipboard.setStringAsync(address);
    Alert.alert("Copied to Clipboard", "Wallet address has been copied!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>SwiftPay Tether USD Wallet</Text>

      <View style={styles.walletInfo}>
        <View>
          <Text style={styles.walletInfoText}>Name</Text>
          <Text style={styles.walletInfoText}>Currency code</Text>
          <Text style={styles.walletInfoText}>Balance</Text>
        </View>
        <View>
          <Text style={styles.walletInfoValue}>USDT Tether</Text>
          <Text style={styles.walletInfoValue}>usdt</Text>
          <Text style={styles.walletInfoValue}>0.0</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Supported Networks</Text>
      <ScrollView>
        {networks.map((network) => (
          <View key={network.id} style={styles.networkCard}>
            <View style={styles.networkCardRow}>
              <Text style={styles.networkCardText}>ID</Text>
              <Text style={[styles.networkCardValue, styles.highlight]}>
                {network.id}
              </Text>
            </View>

            <View style={styles.networkCardRow}>
              <Text style={styles.networkCardText}>Name</Text>
              <Text style={styles.networkCardValue}>{network.name}</Text>
            </View>

            <View style={styles.networkCardRow}>
              <Text style={styles.networkCardText}>Payment Address</Text>
              {walletAddressGenerated[network.id] ? (
                <Text style={styles.walletAddress}>
                  {walletAddress[network.id]}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => handleGenerateAddress(network.id)}
                >
                  {isGenerating[network.id] ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                  ) : (
                    <Text style={styles.generateAddress}>
                      <AntDesign name="reload1" size={12} color="#0000ff" />{" "}
                      Generate Address
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.networkCardRow}>
              <Text style={styles.networkCardText}>Withdrawals Enabled</Text>
              <Text style={styles.networkCardValue}>
                {network.withdrawalsEnabled}
              </Text>
            </View>

            <View style={styles.networkCardRow}>
              <Text style={styles.networkCardText}>Deposits Enabled</Text>
              <Text style={styles.networkCardValue}>
                {network.depositsEnabled}
              </Text>
            </View>

            {walletAddressGenerated[network.id] && (
              <TouchableOpacity
                style={styles.useWalletAddressButton}
                onPress={() => handleCopyToClipboard(walletAddress[network.id])}
              >
                <Text style={styles.useWalletAddressButtonText}>
                  Copy Wallet Address
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require("../assets/success.png")}
              style={styles.icon}
            />
            <Text style={styles.modalText}>Success</Text>
            <Text style={styles.modalAddress}>
              Your payment wallet address is being generated and you will be
              notified shortly once it is ready.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DFF1FC",
    padding: 10,
    borderRadius: 15,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 20,
  },
  walletInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 10,
    marginBottom: 20,
  },
  walletInfoText: {
    fontSize: 14,
    color: "#000",
    marginBottom: 5,
  },
  walletInfoValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  networkCard: {
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ceddff",
    padding: 10,
  },
  networkCardText: {
    fontSize: 14,
    color: "#000",
    marginBottom: 5,
  },
  networkCardValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  generateAddress: {
    color: "#0000ff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  walletAddress: {
    color: "#0000ff",
    fontSize: 12,
    fontWeight: "500",
    width: "50%",
  },
  networkCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingRight: 1,
    alignItems: "center",
  },
  useWalletAddressButton: {
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0000ff",
  },
  useWalletAddressButtonText: {
    color: "#0000ff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    padding: 10,
    borderRadius: 30,
    width: "100%",
    borderWidth: 1,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#0000ff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 10,
    resizeMode: "contain",
  },
  highlight: {
    color: "#0000ff",
  },
});

export default SellNetworks;
