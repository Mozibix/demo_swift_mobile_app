import { create } from "zustand";

interface WalletState {
  balance: number;
  currency: string;
  walletAddress: string | null;
  network: string | null;
  isBalanceHidden: boolean;
  setBalance: (balance: number) => void;
  setCurrency: (currency: string) => void;
  setWalletAddress: (address: string | null) => void;
  setNetwork: (network: string | null) => void;
  toggleBalanceVisibility: () => void;
  clearStoredAddress: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  currency: "NGN",
  walletAddress: null,
  network: null,
  isBalanceHidden: false,
  setBalance: (balance) => set({ balance }),
  setCurrency: (currency) => set({ currency }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setNetwork: (network) => set({ network: network }),
  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceHidden: !state.isBalanceHidden })),
  clearStoredAddress: () => set(() => ({ walletAddress: null, network: null })),
}));

export default useWalletStore;
