import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import useWalletStore from "@/stores/useWalletStore";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { showLogs } from "@/utils/logger";
import { showSuccessToast } from "./ui/Toast";
import { useAuth } from "@/context/AuthContext";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { COLORS } from "@/constants/Colors";

interface NetworkProps {
  networks?: Array<{
    id: string;
    name: string;
    withdraws_enabled?: boolean;
    deposits_enabled?: boolean;
    payment_address?: string | null;
    destination_tag?: string | null;
  }>;
  onAddressSelected?: () => void;
  symbol?: string | string[];
  name?: string | string[];
  type?: "buy" | "sell";
  setSelectedNetwork?: Dispatch<SetStateAction<string | null>>;
  setShouldRefresh: Dispatch<SetStateAction<string>>;
  setDestinationTag?: Dispatch<SetStateAction<string>>;
  callback?: VoidFunction;
  balanceDetails?: {
    name: string;
    currency: string;
    balance: string;
  } | null;
}

const Networks: React.FC<NetworkProps> = ({
  networks: propNetworks,
  onAddressSelected,
  symbol,
  name,
  balanceDetails,
  setSelectedNetwork,
  setShouldRefresh,
  setDestinationTag,
  callback,
  type,
}) => {
  const storeSetWalletAddress = useWalletStore(
    (state) => state.setWalletAddress
  );
  const storeNetwork = useWalletStore((state) => state.setNetwork);
  const clearStoredAddress = useWalletStore(
    (state) => state.clearStoredAddress
  );

  const networks = propNetworks || [];

  type WalletAddressState = { [key: string]: string };
  const [walletAddressGenerated, setWalletAddressGenerated] =
    useState<WalletAddressState>({});
  const [walletAddress, setWalletAddress] = useState<WalletAddressState>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [useWalletModalVisible, setUseWalletModalVisible] = useState(false);
  const [selectedAddressInfo, setSelectedAddressInfo] = useState<{
    address: string;
    network: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const { displayLoader, hideLoader } = useAuth();

  useEffect(() => {
    if (!modalVisible) return;

    setCountdown(8);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          setModalVisible(false);
          setShouldRefresh(Date.now().toString());
          callback?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [modalVisible]);

  const handleGenerateAddress = async (id: string) => {
    displayLoader();
    try {
      setIsGenerating((prev) => ({ ...prev, [id]: true }));
      setError(null);

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        console.error("No authentication token found");
        setError("Authentication required. Please login again.");
        setIsGenerating((prev) => ({ ...prev, [id]: false }));
        return;
      }

      console.log({ id, symbol });
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
        callback?.();
      }
    } catch (err: any) {
      showLogs("Error generating address:", err.response.data);
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
      callback?.();
    } finally {
      setIsGenerating((prev) => ({ ...prev, [id]: false }));
      hideLoader();
    }
  };

  const handleUseWalletAddress = (
    id: string,
    networkName: string,
    destination_tag: string
  ) => {
    const address =
      networks.find((network) => network.id === id)?.payment_address ||
      walletAddress[id];

    setSelectedNetwork?.(networkName);

    if (address) {
      storeSetWalletAddress(address);
      storeNetwork(id);

      setSelectedAddressInfo({
        address,
        network: networkName,
      });

      setDestinationTag?.(destination_tag);

      setModalVisible(false);

      if (onAddressSelected) {
        setTimeout(onAddressSelected, 100);
      }

      showSuccessToast({
        title: "Address selected and applied",
      });
    }
  };

  function handleCopy(item: string, label: string) {
    Clipboard.setStringAsync(item);
    showSuccessToast({
      title: `${label} Copied!`,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>SwiftPay {name} Wallet</Text>

      <View style={styles.networkCardRow}>
        <Text style={styles.networkCardText}>Name</Text>
        <Text style={styles.networkCardValue}>
          {balanceDetails?.name ?? "-"}
        </Text>
      </View>

      <View style={styles.networkCardRow}>
        <Text style={styles.networkCardText}>Currency code</Text>
        <Text style={styles.networkCardValue}>
          {balanceDetails?.currency ?? "-"}
        </Text>
      </View>

      <View style={styles.networkCardRow}>
        <Text style={styles.networkCardText}>Balance</Text>
        <Text style={styles.networkCardValue}>
          {balanceDetails?.balance ?? "-"}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Supported Networks Section */}
      <Text style={styles.sectionTitle} className="mt-4">
        Supported Networks
      </Text>
      <ScrollView>
        {networks.length === 0 && (
          <Text className="text-center my-3 text-[16px]">
            No networks found.
          </Text>
        )}
        {networks.length > 0 &&
          networks?.map((network) => (
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
                {network.payment_address ? (
                  <Text style={styles.walletAddress}>
                    {network.payment_address}
                  </Text>
                ) : walletAddressGenerated[network.id] ? (
                  <Text style={styles.walletAddress}>
                    {walletAddress[network.id]}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleGenerateAddress(network.id)}
                    disabled={isGenerating[network.id]}
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
                <Text style={styles.networkCardText}>Deposits Enabled</Text>
                <Text style={styles.networkCardValue}>
                  {network.deposits_enabled ? "Yes" : "No"}
                </Text>
              </View>

              <View style={styles.networkCardRow}>
                <Text style={styles.networkCardText}>Withdrawals Enabled</Text>
                <Text style={styles.networkCardValue}>
                  {network.withdraws_enabled ? "Yes" : "No"}
                </Text>
              </View>

              {network.destination_tag && (
                <View style={styles.networkCardRow}>
                  <Text style={styles.networkCardText}>Destination Tag</Text>
                  <Pressable
                    className="flex-row items-center gap-1"
                    onPress={() =>
                      handleCopy(
                        network.destination_tag ?? "",
                        "Destination Tag"
                      )
                    }
                  >
                    <Text style={styles.destTag}>
                      {network.destination_tag}
                    </Text>
                    <Feather
                      name="copy"
                      size={16}
                      color={COLORS.swiftPayBlue}
                    />
                  </Pressable>
                </View>
              )}

              {(network.payment_address ||
                walletAddressGenerated[network.id]) && (
                <>
                  {type === "buy" ? (
                    <TouchableOpacity
                      style={styles.useWalletAddressButton}
                      onPress={() =>
                        handleUseWalletAddress(
                          network.id,
                          network.name,
                          network.destination_tag!
                        )
                      }
                    >
                      <Text style={styles.useWalletAddressButtonText}>
                        Use Wallet Address
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.useWalletAddressButton}
                      onPress={() =>
                        handleCopy(
                          network.payment_address || "",
                          "Wallet Address"
                        )
                      }
                    >
                      <Text style={styles.useWalletAddressButtonText}>
                        Copy wallet address
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          ))}
      </ScrollView>

      {/* Modal for Showing Wallet Address */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        // onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require("../assets/icons/success.png")}
              style={styles.icon}
            />
            <Text style={styles.modalText}>Success</Text>
            <Text style={styles.modalAddress}>
              Your payment wallet address is being generated.
            </Text>
            <Text style={styles.modalAddress}>Please wait... {countdown}</Text>

            {/* <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>

      {/* Modal for Address Selected */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={useWalletModalVisible}
        onRequestClose={() => setUseWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require("../assets/icons/success.png")}
              style={styles.icon}
            />
            <Text style={styles.modalText}>Address Selected</Text>
            <Text style={styles.modalAddress}>
              {selectedAddressInfo?.address}
            </Text>
            <Text style={styles.modalAddress}>
              {selectedAddressInfo?.network}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setUseWalletModalVisible(true);
                onAddressSelected && onAddressSelected();
              }}
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
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 16,
    fontWeight: "600",
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
  destTag: {
    color: "#0000ff",
    fontSize: 15,
    fontWeight: "500",
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalAddress: {
    fontSize: 17,
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
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: "contain",
  },
  highlight: {
    color: "#0000ff",
  },
  errorContainer: {
    backgroundColor: "#ffeeee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffaaaa",
  },
  errorText: {
    color: "#cc0000",
    fontSize: 12,
  },
});

export default Networks;
