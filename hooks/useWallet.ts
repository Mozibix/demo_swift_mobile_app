import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { useWalletStore } from "../stores/useWalletStore";

export const useWalletBalance = () => {
  const { setBalance } = useWalletStore();

  interface WalletBalanceResponse {
    balance: number;
  }

  return useQuery<WalletBalanceResponse>({
    queryKey: ["wallet-balance"],
    queryFn: async (): Promise<WalletBalanceResponse> => {
      const response = await api.get("/api/wallet/balance");
      return response.data;
    },
    onSuccess: (data) => {
      setBalance(data.balance);
    },
  });
};

export const useGenerateWallet = () => {
  const { setWalletAddress } = useWalletStore();

  return useMutation({
    mutationFn: async (data: { email: string; bvn: string }) => {
      const response = await api.post("/api/create-virtual-account", data);
      return response.data;
    },
    onSuccess: (data) => {
      setWalletAddress(data.account_number);
    },
  });
};
