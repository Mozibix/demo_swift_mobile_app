import { User } from "@/context/AuthContext";
import {
  apiService,
  Favorite,
  SwiftpayFavorite,
  Transfer,
} from "@/services/api";
import { _TSFixMe } from "@/utils";
import { showLogs } from "@/utils/logger";
import { useEffect } from "react";
import { create } from "zustand";

export interface Bank {
  id: number;
  code: string;
  name: string;
  category: string;
  cbnCode: string;
  logo: string;
  batchNumber: string;
}

interface DataState {
  fixed_transfer_fee: number;
  percentage_transfer_fee: number;
  recent_transfers: Transfer[];
  bank_favorites: Favorite[];
  swiftpay_favorites: SwiftpayFavorite[];
  recent_transfers_swiftPay: User[];
  banks: Bank[];
  getBankTransferData: () => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  fixed_transfer_fee: 0,
  percentage_transfer_fee: 0,
  recent_transfers: [],
  bank_favorites: [],
  swiftpay_favorites: [],
  recent_transfers_swiftPay: [],
  banks: [],

  getBankTransferData: async () => {
    try {
      const response = await apiService.getBankTransferDataPage();
      const swift_response = await apiService.getSwifyPayTransferData();
      const beneficiaries = await apiService.getBankTransferBeneficiaries();
      const swiftpay_beneficiaries =
        await apiService.swiftPayTransferBeneficiaries();

      if (response?.data) {
        const {
          fixed_transfer_fee,
          percentage_transfer_fee,
          recent_tranfers,
          banks,
        } = response.data;

        if (beneficiaries?.data) {
          set({
            bank_favorites: beneficiaries.data.favorites,
          });
        }

        if (swiftpay_beneficiaries?.data) {
          set({
            swiftpay_favorites: swiftpay_beneficiaries.data.favorites,
          });
        }

        set({
          fixed_transfer_fee,
          percentage_transfer_fee,
          recent_transfers: Object.values(recent_tranfers),
          banks,
        });
      }

      if (swift_response?.data) {
        set({
          recent_transfers_swiftPay: swift_response.data
            .recent_transfers as _TSFixMe,
        });
      }
    } catch (error: _TSFixMe) {
      console.error("Failed to fetch transfer data:", error);
    }
  },
}));

export default useDataStore;
