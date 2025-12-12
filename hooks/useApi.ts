import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ajoContributionApi,
  ajoSavingsApi,
  apiService,
  HoldingsHistoryResponse,
  InvestmentDetailsResponse,
  InvestmentHistoryResponse,
  PortfolioResponse,
} from "../services/api";
import { useAuthStore } from "../stores/useAuthStore";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";

interface AuthResponse {
  token: string;
  user: any; // Replace with proper user type when available
}

interface SendOTPResponse {
  message: string;
  isCodeSent: boolean;
}

interface VerifyOTPResponse {
  message: string;
  status: string;
}

interface OTPError extends Error {
  response?: {
    data?: {
      message?: string;
      errors?: {
        pin?: string[];
      };
    };
    status?: number;
  };
}

interface ForgotPasswordResponse {
  message: string;
}

// Auth Hooks
export const useLogin = () => {
  const { setToken, setUser } = useAuthStore();

  return useMutation({
    mutationFn: apiService.login,
    onSuccess: async (data: AuthResponse) => {
      await SecureStore.setItemAsync("userToken", data.token);
      setToken(data.token);
      setUser(data.user);
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: apiService.signup,
  });
};

// Profile Hooks
export const useProfile = () => {
  const { setUser } = useAuthStore();
  const { token } = useAuthStore(); // Get token from auth store instead of SecureStore

  return useQuery({
    queryKey: ["profile"],
    queryFn: apiService.getUserProfile,
    enabled: !!token,
    select: (data: any) => {
      setUser(data);
      return data;
    },
  });
};

// Networks & Airtime Hooks
export const useNetworks = () => {
  return useQuery({
    queryKey: ["networks"],
    queryFn: apiService.getNetworks,
  });
};

export const useConfirmPurchase = () => {
  return useMutation({
    mutationFn: apiService.confirmPurchase,
  });
};

export const useBuyAirtime = () => {
  return useMutation({
    mutationFn: apiService.buyAirtime,
  });
};

// Currency Rates Hooks
export const useCurrencyRates = () => {
  return useQuery<{
    status: string;
    message: string;
    data: {
      fiats: Record<
        string,
        {
          rate: number;
          logo: string;
        }
      >;
      crypto_currencies: Record<
        string,
        {
          price_in_usd: number;
          icon: string;
          name: string;
        }
      >;
    };
  }>({
    queryKey: ["currency-rates"],
    queryFn: apiService.getCurrencyRates,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useUpdateSwiftPayTag = () => {
  return useMutation({
    mutationFn: apiService.updateSwiftPayTag,
  });
};

export const useChangeSwiftPayTag = () => {
  return useMutation({
    mutationFn: apiService.changeSwiftPayTag,
  });
};

// OTP Hooks
export const useSendOTP = () => {
  return useMutation<SendOTPResponse, OTPError>({
    mutationFn: apiService.sendOTP,
  });
};

export const useVerifyOTP = () => {
  return useMutation<VerifyOTPResponse, OTPError, number>({
    mutationFn: (pin: number) => {
      // Additional validation before making the API call
      if (!Number.isInteger(pin) || pin.toString().length !== 6) {
        return Promise.reject(new Error("PIN must be a 6-digit number"));
      }
      return apiService.verifyOTP(pin);
    },
  });
};

export const useForgotPassword = () => {
  return useMutation<ForgotPasswordResponse, Error, string>({
    mutationFn: apiService.forgotPassword,
  });
};

interface Currency {
  id: number;
  code: string;
  name: string;
  exchange_rate: string;
  sell_status: string;
  priority: number;
}

interface TransactionHistory {
  id: number;
  currency_code: string;
  amount: number;
  status: string;
  created_at: string;
}

interface BureauResponse {
  success: boolean;
  data: {
    currencies: Currency[];
    history: TransactionHistory[];
  };
  message: string;
}

export const useBureauData = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://swiftpaymfb.com/api/bureau-da-change/sell-fx",
          {
            headers: {
              Authorization: `Bearer ${await SecureStore.getItemAsync(
                "userToken"
              )}`,
            },
          }
        );

        const result: BureauResponse = await response.json();
        console.log(response);

        if (result.success) {
          setCurrencies(result.data.currencies);
          setHistory(result.data.history);
        } else {
          setError(result.message);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch bureau data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { currencies, history, loading, error };
};

// Example hook to calculate Naira amount
export const useCalculateNairaAmount = (amount: number, uuid: number) => {
  const [nairaData, setNairaData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!amount || isNaN(amount)) return;
    (async () => {
      setLoading(true);
      try {
        const data = await apiService.calculateNairaAmount(amount, uuid);
        console.log(data);
        if (data.success) {
          setNairaData(data.data);
        } else {
          setError(data.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [amount, uuid]);

  return { nairaData, loading, error };
};

// Crypto Hooks
export const useCryptoDetails = (cryptoUuid: string) => {
  return useQuery({
    queryKey: ["cryptoDetails", cryptoUuid],
    queryFn: () => apiService.getCryptoDetails(cryptoUuid),
    enabled: !!cryptoUuid,
  });
};

export const useCalculateNaira = () => {
  return useMutation({
    mutationFn: (data: { amount: number; nairaRate: number }) =>
      apiService.calculateNairaAmount(data.amount, data.nairaRate),
  });
};

export const useCreateCryptoOrder = () => {
  return useMutation({
    mutationFn: apiService.createCryptoOrder,
  });
};

export const useSubmitCryptoOrder = () => {
  return useMutation({
    mutationFn: apiService.submitCryptoOrder,
  });
};

export const useCryptoData = () => {
  return useQuery({
    queryKey: ["cryptoData"],
    queryFn: apiService.getCryptoData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useHoldings = () => {
  return useQuery<any>({
    queryKey: ["holdings"],
    queryFn: () => (apiService as any).getHoldings(),
    refetchInterval: 60000,
  });
};

export const useHoldingsHistory = () => {
  return useQuery<HoldingsHistoryResponse>({
    queryKey: ["holdings-history"],
    queryFn: apiService.getHoldingsHistory,
  });
};

export const usePortfolio = () => {
  return useQuery<PortfolioResponse>({
    queryKey: ["investmentPortfolio"],
    queryFn: apiService.getInvestmentPortfolio,
    refetchInterval: 60000,
  });
};

export const useInvestmentPortfolio = () => {
  return useQuery<PortfolioResponse>({
    queryKey: ["investmentPortfolio"],
    queryFn: apiService.getInvestmentPortfolio,
  });
};

export const useInvestmentHistory = () => {
  return useQuery<InvestmentHistoryResponse>({
    queryKey: ["investmentHistory"],
    queryFn: apiService.getInvestmentHistory,
  });
};

export const useInvestmentDetails = (hashId: string) => {
  return useQuery<InvestmentDetailsResponse>({
    queryKey: ["investment", hashId],
    queryFn: () => apiService.getInvestmentDetails(hashId),
    enabled: !!hashId,
  });
};

// Investment Assets Hook
export const useInvestmentAssets = () => {
  return useQuery({
    queryKey: ["investmentAssets"],
    queryFn: apiService.getInvestmentAssets,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnMount: true, // Always fetch when component mounts initially
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchInterval: undefined, // Don't auto-refetch on interval
  });
};

// Investment Asset Details Hooks
export const useCryptoAssetDetails = (
  cryptoId: string | number | undefined
) => {
  return useQuery({
    queryKey: ["cryptoAssetDetails", cryptoId],
    queryFn: () =>
      apiService.getCryptoAssetDetails(cryptoId as string | number),
    enabled: !!cryptoId,
    refetchInterval: 60000, // Refetch every minute for updated price data
  });
};

export const useStockAssetDetails = (stockSymbol: string | undefined) => {
  return useQuery({
    queryKey: ["stockAssetDetails", stockSymbol],
    queryFn: () => apiService.getStockAssetDetails(stockSymbol as string),
    enabled: !!stockSymbol,
    refetchInterval: 60000, // Refetch every minute for updated price data
  });
};

// Ajo Savings Hooks
export const useAjoSavings = () => {
  return useQuery({
    queryKey: ["ajo-savings"],
    queryFn: ajoSavingsApi.getAjoSavings,
  });
};

export const useAjoSavingsHistory = () => {
  return useQuery({
    queryKey: ["ajo-savings-history"],
    queryFn: ajoSavingsApi.getAjoSavingsHistory,
  });
};

export const useAjoContribution = () => {
  return useQuery({
    queryKey: ["ajo-contribution"],
    queryFn: ajoContributionApi.getAjoContribution,
  });
};

export const useAjoSavingTransactionsHistory = (id: string) => {
  return useQuery({
    queryKey: ["ajo-transactions-history", id],
    queryFn: () => ajoSavingsApi.getAjoSavingsTransactionHistory(id),
    enabled: !!id,
  });
};
export const useReferralsPage = () => {
  return useQuery({
    queryKey: ["referral-page"],
    queryFn: apiService.getReferralPage,
  });
};
