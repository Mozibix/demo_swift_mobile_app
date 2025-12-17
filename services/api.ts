import axios, { AxiosError } from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import * as SecureStore from "expo-secure-store";
import { ReactNode } from "react";
import { _TSFixMe } from "@/utils";
import { showLogs } from "@/utils/logger";
import { User } from "@/context/AuthContext";

export const API_BASE_URL = "https://swiftpaymfb.com/api";

// Base API configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await SecureStore.deleteItemAsync("userToken");
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Types
export interface Network {
  id: number;
  name: string;
  img_url: string;
  vtu_code: string;
  airtime_biller_code: string | null;
  airtime_item_code: string | null;
  data_biller_code: string | null;
  created_at: string;
  updated_at: string;
  dataPlans: DataPlan[];
}

export interface DataPlan {
  id: number;
  name: string;
  price: number;
  validity: string;
}

export interface UserProfile {
  wallet_balance: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image: string | null;
  phone: string;
  username: string;
  // Add other profile fields as needed
}

export interface RecentTransfer {
  id: number;
  amount: number;
  description: string;
  beneficiary_id: number;
  created_at: string;
  updated_at: string;
  username: string;
  name: string;
  profile_photo: string;
}

export interface SwiftPayUser {
  id: number;
  username: string;
  email: string;
  name: string;
  profile_photo?: string;
  first_name?: string;
  last_name?: string;
}

export interface BankUser {
  account_name: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  amount: string;
  fee: number;
  description: string;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
  slug: string;
}

export interface BankTransferResponse {
  data: any;
  success: string;
  reference: string;
  hash_id: string;
}

export interface BankVerificationResponse {
  data: any;
  status: string;
  account_name: string;
  account_number: string;
  bank_code: string;
  isABeneficiary: boolean;
}

export interface BanksResponse {
  banks: Bank[];
  recentTransfers: BankTransfer[];
  beneficiary?: {
    bank_account_number: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    isABeneficiary: boolean;
  };
}

export interface BankTransfer {
  id: number;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
  amount: number;
  created_at: string;
}

export interface GiftCardCountry {
  id: number;
  iso_name: string;
  name: string;
  currency_code: string;
  currency_name: string;
  flag_url: string;
}

export interface GiftCardProduct {
  productId: number;
  productName: string;
  currencyCode: string;
  denominations: number[];
  recipientCurrencyCode: string;
  minRecipientAmount: number;
  maxRecipientAmount: number;
  brand: string;
  countryCode: string;
  fixedRecipientDenominations: boolean;
  senderFee: number;
}

export interface GiftCardDetails {
  productId: string;
  productName: string;
  denominationType: string;
  minRecipientDenomination: number;
  maxRecipientDenomination: number;
  senderFee: number;
}

export interface GiftCardValidation {
  price: number;
  feeAmount: number;
  totalAmount: number;
}

// Types for Bureau De Change
export interface CurrencyDetails {
  code: string;
  price: number;
  volume: number;
  fee: number;
  form_fields: string[];
}

export interface CurrencyValidation {
  naira_amount: number;
  fee_amount: number;
  total_amount: number;
}

export interface BureauDeChangeOrder {
  user_id: number;
  currency_name: string;
  currency_code: string;
  amount: number;
  naira_amount: number;
  status: string;
  order_number: string;
  data: Record<string, any>;
}

export interface Currency {
  id: number;
  code: string;
  rate: number;
  status: string;
}

export interface CurrencyHistory {
  id: number;
  user_id: number;
  currency_code: string;
  amount: number;
  created_at: string;
}

export interface SellCurrencyDetails {
  data: any;
  fee: number;
  currency: {
    id: number;
    currency: string;
    code: string;
    rate: number;
    price: number;
    volume: number;
    status: string;
    logo_url: string;
    currency_symbol: string;
    sell_price: number;
    limit: number;
    sell_status: string;
  };
  form_fields: Array<{
    type: string;
    label: string;
    required: boolean;
  }>;
  banks: Array<{
    id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    description: string;
    swift_code: string;
  }>;
}

export interface BuyOrSellCurrencyOrder {
  currency_id: number;
  currency_amount: number;
  pin: number;
  data: Record<string, any>;
}

// Crypto API Types
export interface CryptoDetails {
  currency: any;
  dollarRate: number;
  nairaRate: number;
  fee: number;
  quidaxWalletAddress: any;
  quidaxWallet: any;
  networks: any[];
}

export interface CryptoOrder {
  feeAmount: number;
  cryptoFee: number;
  cryptoFeeInNaira: number;
  totalAmount: number;
}

export interface HoldingHistory {
  id: number;
  asset_name: string;
  asset_symbol: string;
  asset_type: string;
  asset_amount: number;
  amount: number;
  naira_start_rate: number;
  status: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface HoldingsHistoryResponse {
  success: boolean;
  data: HoldingHistory[];
}

export interface Investment {
  asset_icon_url: string | undefined;
  id: number;
  asset_name: string;
  asset_symbol: string;
  asset_type: string;
  amount_invested: number;
  current_rate?: number;
  current_earnings?: number;
  status: string;
  end_date?: string;
  amount_earned?: number;
  change_percentage?: number;
}

export interface PortfolioResponse {
  status: string;
  data: {
    investments: Investment[];
    total_asset: number;
  };
}

export interface InvestmentHistoryResponse {
  status: string;
  data: Investment[];
}

export interface InvestmentDetailsResponse {
  status: string;
  data: {
    investment: Investment;
    crypto?: {
      symbol: string;
      name: string;
      current_rate: number;
      historical_changes: number[];
    };
    stock?: {
      symbol: string;
      name: string;
      price: number;
      market_cap: string;
      change_percent: string;
      high: number;
      low: number;
    };
    naira_to_dollar?: number;
    possible_earnings: number;
    earnings: number;
    historical_dates: string[];
  };
}

export type MultipleTransferPageResponse = {
  status: string;
  message: string;
  data: {
    fixed_bank_transfer_fee: number;
    percentage_bank_transfer_fee: number;
    banks: {
      id: number;
      code: string;
      name: string;
    }[];
  };
};

export interface MultipleTransferResponse {
  status: string;
  message: string;
  data: {
    accounts: string;
    type: string;
    total_amount: string;
    user_id: number;
    status: string;
    reference: string;
    source_link: string | null;
    updated_at: string;
    created_at: string;
    id: number;
  };
}

interface SwiftPayTransferAccount {
  id: string;
  name: string;
  amount: string;
  description: string;
}

export interface Transfer {
  id: number;
  user_id: number;
  reference: string;
  status: string;
  amount: number;
  fee: number;
  description: string;
  type: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  created_at: string;
  updated_at: string;
  transfer_id: string | null;
  bulk_transfer_id: string | null;
  source_link: string | null;
  hash_id: string;
}

export type Favorite = {
  id: number;
  user_id: number;
  acct_name: string;
  bank_name: string;
  acct_number: string;
  bank_code: string;
  type: string;
  swiftpay_username: string | null;
  created_at: string;
  updated_at: string;
};

export type SwiftpayFavorite = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  name: string;
  profile_photo: string;
  hash_id: string;
};

export type TransferDataResponse = {
  status: string;
  message: string;
  data: {
    fixed_transfer_fee: number;
    percentage_transfer_fee: number;
    recent_tranfers: Record<string, Transfer>;
    recent_transfers: User[];
    banks: {
      id: number;
      code: string;
      name: string;
      category: string;
      cbnCode: string;
      logo: string;
      batchNumber: string;
    }[];
  };
};

type GroupSavingsMember = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
  profile_image: string | null;
  email_verified_at: string | null;
  account_status: string;
  is_bvn_verified: boolean;
  bvn: string | null;
  bvn_reference: string | null;
  kyc_status: string;
  nin: string | null;
  phone: string;
  otp_reference: string | null;
  is_otp_verified: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  is_verified: number;
  virtual_account_number: string;
  virtual_bank_name: string;
  quidax_id: string;
  quidax_sn: string;
  quidax_email: string | null;
  card_token: string | null;
  card_token_email: string | null;
  level: string;
  transaction_volume: string;
  ajo_contribution_wallet: number;
  platform: string;
  deleted_at: string | null;
  is_owing_ajo_contribution: number;
  if_level_changed: boolean;
  name: string;
  profile_photo: string;
  hash_id: string;
  pivot: {
    group_savings_id: number;
    user_id: number;
    role: string;
    status: string;
  };
};

type GroupSavings = {
  id: number;
  name: string;
  type: string;
  description: string;
  balance: number;
  status: string;
  target_amount: number | null;
  end_date: string;
  member_target_amount: number;
  created_at: string;
  updated_at: string;
  readable_end_date: string;
  hash_id: string;
  members: GroupSavingsMember[];
};

export type GroupInvitationResponse = {
  status: string;
  message: string;
  data: {
    group_savings: GroupSavings;
  };
};

export type Holding = {
  id: number;
  user_id: number;
  asset_name: string;
  asset_symbol: string;
  asset_type: "fiat" | "crypto" | string;
  asset_amount: number;
  amount: number;
  amount_earned: number | null;
  naira_start_rate: number;
  naira_end_rate: number | null;
  end_date: string;
  status: "active" | "completed" | "cancelled" | string;
  icon_url: string;
  created_at: string;
  updated_at: string;
  current_rate: number;
};

// Custom error type
export class APIError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = "APIError";
  }
}

// Generic error handler
const handleApiError = (error: any): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new APIError(
      axiosError.response?.data?.message ||
        axiosError.message ||
        "An error occurred",
      axiosError.response?.status,
      axiosError.response?.data
    );
  }
  throw new APIError(error.message || "An unexpected error occurred");
};

// API Functions
export const apiService = {
  // Auth
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: UserProfile }> => {
    try {
      const response = await api.post("/login", credentials);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  signup: async (data: any) => {
    const response = await api.post("/register", data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/logout");
    return response.data;
  },

  getUserProfile: async () => {
    const response = await api.get("/user");
    return response.data.data;
  },

  getIncompleteSteps: async () => {
    const response = await api.get("/incomplete-steps");
    return response.data.data;
  },

  getBankDetails: async () => {
    try {
      const response = await api.get("/bank-details");
      return response.data;
    } catch (error: _TSFixMe) {
      showLogs("getBankDetails error", error.response);
    }
  },

  verifyUserPin: async (pin: string) => {
    const response = await api.get(`/verify-pin?pin=${pin}`);
    return response.data;
  },

  getNetworks: async () => {
    const response = await api.get("/bills/airtime-data");
    return response.data;
  },

  confirmPurchase: async (data: { phone: string; amount: number }) => {
    const response = await api.post("/confirm-purchase", data);
    return response.data;
  },

  buyAirtime: async (data: {
    phone: string;
    airtime_amount: number;
    cost: number;
    network_code: string;
  }) => {
    const response = await api.post("/bills/buy-airtime", data);
    return response.data;
  },

  // Currency Rates
  getCurrencyRates: async () => {
    const response = await api.get("/currency-rates");
    return response.data;
  },

  // SwiftPay Transfers
  getRecentTransfers: async () => {
    const response = await api.get("/swiftpay-transfer");
    return response.data.data;
  },

  getInterestSavings: async () => {
    try {
      const response = await api.get("/interest-savings");
      return response.data;
    } catch (error) {
      console.log("Get Interest Savings Error:", error);
      throw error;
    }
  },

  setUser: async (username: string) => {
    const response = await api.post("/swiftpay/set-user", { username });
    return response.data;
  },

  confirmTransfer: async (data: {
    username: string;
    amount: number;
    description: string;
  }) => {
    const response = await api.post("/swiftpay/confirm-transfer", data);
    return response.data;
  },

  transfer: async (data: {
    username: string;
    amount: number;
    description: string;
    pin: string;
  }) => {
    const response = await api.post("/swiftpay/transfer", data);
    return response.data;
  },

  getBanks: async (): Promise<BanksResponse> => {
    const response = await api.get("/bank-transfer");
    return response.data;
  },

  verifyBankAccount: async (
    bank_code: string,
    account_number: string
  ): Promise<BankVerificationResponse> => {
    try {
      const response = await api.get(
        `/bank-transfer/verify-customer?bank_code=${bank_code}&account_number=${account_number}`
      );

      // console.log("Bank Verification Response:", { response });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bankTransfer: async (data: {
    bank_code: string;
    bank_account_number: string;
    amount: number;
    description?: string;
    pin?: number;
    bank_name: string;
    account_name: string;
    ifAddtoBeneficiary?: boolean;
    total_amount: number;
    fee_amount: number;
    source_link?: string | null;
  }): Promise<BankTransferResponse> => {
    try {
      // Adjust the payload to match the expected format
      const payload = {
        bank_code: data.bank_code,
        amount: data.amount.toString(),
        total_amount: data.total_amount.toString(),
        fee_amount: data.fee_amount.toString(),
        account_number: data.bank_account_number,
        account_name: data.account_name,
        description: data.description || "Bank Transfer",
        bank_name: data.bank_name,
        source_link: data.source_link || null,
        pin: data.pin?.toString(),
      };

      const response = await api.post("/bank-transfer/transfer-money", payload);
      return response.data;
    } catch (error) {
      console.log("Bank Transfer Error:", error);
      throw handleApiError(error);
    }
  },

  multipleBankTransfer: async (
    payload: MultipleTransferPayload
  ): Promise<any> => {
    try {
      const response = await api.post(`/multiple-bank-transfer`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Gift Card APIs
  getGiftCardCountries: async (query?: string): Promise<any> => {
    try {
      const response = await api.get(
        `/gift-cards/countries${query ? `?query=${query}` : ""}`
      );

      return response.data;
    } catch (error) {
      console.log("Gift Card Countries Error:", error);
      throw handleApiError(error);
    }
  },

  getGiftCardProducts: async (countryCode: string, query?: string) => {
    try {
      const response = await api.get(
        `/gift-cards/products${
          query
            ? `?country_code=${countryCode}&query=${query}`
            : `?country_code=${countryCode}`
        }`
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        console.log("Gift Card Products Error:", (error as any).response.data);
      } else {
        console.log("Gift Card Products Error:", error);
      }
      throw handleApiError(error);
    }
  },

  getGiftCardProduct: async (productId: string) => {
    try {
      const response = await api.get(
        `/gift-cards/products/show?product_id=${productId}`
      );

      return response.data;
    } catch (error) {
      console.log("Gift Card Product Error:", error);
      throw handleApiError(error);
    }
  },

  checkGiftCardPrice: async (
    productId: string,
    amount: number | string,
    quantity: number
  ) => {
    try {
      const response = await api.get(
        `/gift-cards/products/check-price?product_id=${productId}&amount=${amount}&quantity=${quantity}`
      );

      return response.data;
    } catch (error) {
      console.log("Check Gift Card Price Error:", error);
      throw handleApiError(error);
    }
  },

  getGiftCardDetails: async (productId: string) => {
    try {
      const response = await api.get(`/gift-cards/${productId}`);

      return response.data;
    } catch (error) {
      console.log("Gift Card Details Error:", error);
      throw handleApiError(error);
    }
  },

  validateGiftCardOrder: async (data: {
    amount: number;
    quantity: number;
    name: string;
    email: string;
    gift_card: any;
  }) => {
    try {
      const response = await api.post("/gift-cards/validate-order", data);

      return response.data;
    } catch (error) {
      console.log("Validate Gift Card Order Error:", error);
      throw handleApiError(error);
    }
  },

  submitGiftCardOrder: async (data: {
    price: number;
    pin: string;
    gift_card: any;
    amount: number;
    quantity: number;
    name: string;
    email: string;
  }) => {
    try {
      const response = await api.post("/gift-cards/submit-order", data);

      return response.data;
    } catch (error) {
      console.log("Submit Gift Card Order Error:", error);
      throw handleApiError(error);
    }
  },

  updateSwiftPayTag: async (username: string) => {
    const response = await api.post("/swiftpay-tag", { username });
    return response.data;
  },

  changeSwiftPayTag: async (username: string) => {
    const response = await api.post("/user/change-swiftpay-tag", { username });
    return response.data;
  },

  // OTP Functions
  sendOTP: async () => {
    const response = await api.post("/otp/send");
    return response.data;
  },

  triggerOTP: async () => {
    const response = await api.post("/onboarding/resend-otp");
    return response.data;
  },

  verifyOTP: async (pin: number) => {
    // Validate that pin is a 6-digit number
    if (!Number.isInteger(pin) || pin.toString().length !== 6) {
      throw new Error("PIN must be a 6-digit number");
    }
    const response = await api.post("/otp/validate", { pin });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post("/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.log("Forgot Password Error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.log(error.response);
      }
      throw handleApiError(error);
    }
  },

  // Crypto API Functions

  // Crypto API Functions
  getCryptoDetails: async (cryptoUuid: string): Promise<CryptoDetails> => {
    try {
      const response = await api.get(`/bureau-da-change/buy-now/${cryptoUuid}`);
      return response.data.data;
    } catch (error) {
      // console.log("Get Crypto Details Error:", error);
      if (axios.isAxiosError(error) && error.response) {
        // console.log(error.response);
      }
      throw handleApiError(error);
    }
  },

  getBuyCryptoPage: async (
    crypto_id: number
  ): Promise<BuyCryptoPageResponse> => {
    try {
      const response = await api.get(
        `/crypto-exchange/buy-crypto-page?crypto_id=${crypto_id}`
      );
      // showLogs("Buy Crypto Page Response:", response.data);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        // console.log("Get Buy Crypto Page Error:", error.response);
      } else {
        // console.log("Get Buy Crypto Page Error:", error);
      }
      throw handleApiError(error);
    }
  },

  calculateNairaAmount: async (amount: number, nairaRate: number) => {
    try {
      const response = await api.post(
        "/bureau-da-change/calculate-Naira-Amount",
        {
          amount,
          nairaRate,
        }
      );
      // console.log("Calculate Naira Amount Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.log("Calculate Naira Amount Error:", error);
      throw handleApiError(error);
    }
  },

  createCryptoOrder: async (data: {
    amount: number;
    nairaAmount: number;
    currency_code?: string;
    crypto_network: string;
  }): Promise<CryptoOrder> => {
    try {
      const response = await api.get(
        `/crypto-exchange/create-buy-order?crypto_amount=${
          data.amount
        }&amount_in_naira=${data.nairaAmount}&currency_code=${
          data.currency_code || "usdt"
        }&crypto_network=${data.crypto_network}`
      );
      // console.log("Create Crypto Order Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.log("Create Crypto Order Error:", error);
      throw handleApiError(error);
    }
  },

  submitCryptoOrder: async (data: {
    pin: number;
    wallet_address: string;
    crypto_amount: number;
    amount_in_naira: number;
    crypto_fee_in_naira: number;
    destination_tag: string | null;
    total: number;
    currency_id?: number;
    crypto_network: string;
    crypto_fee: number;
    crypto_rate: number;
  }) => {
    try {
      const response = await api.post(
        `/crypto-exchange/submit-buy-order`,
        data
      );
      return response.data;
    } catch (error) {
      console.log("Submit Crypto Order Error:", error);
      throw handleApiError(error);
    }
  },

  getCryptoData: async () => {
    try {
      const response = await api.get("/crypto-exchange/buy-page");
      return response.data.data;
    } catch (error) {
      console.log("Get Crypto Data Error:", error);
      throw handleApiError(error);
    }
  },

  getSellPageData: async (): Promise<CryptoSellPageResponse> => {
    try {
      const response = await api.get("/crypto-exchange/sell-page");
      return response.data;
    } catch (error) {
      console.log("Get Crypto Sell Page Data Error:", error);
      throw handleApiError(error);
    }
  },

  getHoldings: async (): Promise<any> => {
    const response = await api.get("/holdings");
    return response.data;
  },
  getHoldingsHistory: async (): Promise<HoldingsHistoryResponse> => {
    const response = await api.get("/holdings/history");
    return response.data;
  },

  // Portfolio
  getInvestmentPortfolio: async (): Promise<PortfolioResponse> => {
    const response = await api.get("/investments");
    return response.data;
  },

  getInvestmentHistory: async (): Promise<InvestmentHistoryResponse> => {
    const response = await api.get("/investments/history");
    return response.data;
  },

  getInvestmentDetails: async (
    hashId: string
  ): Promise<InvestmentDetailsResponse> => {
    const response = await api.get(`/investments/${hashId}`);
    return response.data;
  },

  // Investment Assets
  getInvestmentAssets: async () => {
    try {
      const response = await api.get("/investments/assets");
      return response.data;
    } catch (error) {
      console.log("Get Investment Assets Error:", error);
      throw handleApiError(error);
    }
  },

  getCryptoAssetDetails: async (cryptoId: string | number) => {
    try {
      const response = await api.get(
        `/investments/assets/crypto-details?crypto_id=${cryptoId}`
      );
      return response.data;
    } catch (error) {
      console.log("Get Crypto Asset Details Error:", error);
      throw handleApiError(error);
    }
  },

  getStockAssetDetails: async (stockSymbol: string) => {
    try {
      const response = await api.get(
        `/investments/assets/stock-details?stock_symbol=${stockSymbol}`
      );
      return response.data;
    } catch (error) {
      console.log("Get Stock Asset Details Error:", error);
      throw handleApiError(error);
    }
  },

  // Investment Assets
  // getInvestmentAssets: async () => {
  //   try {
  //     const response = await api.get("/investments/assets");
  //     return response.data;
  //   } catch (error) {
  //     console.log("Get Investment Assets Error:", error);
  //     throw handleApiError(error);
  //   }
  // },
  // getInvestmentAssets: async () => {
  //   try {
  //     const response = await api.get("/investments/assets");
  //     return response.data;
  //   } catch (error) {
  //     console.log("Get Investment Assets Error:", error);
  //     throw handleApiError(error);
  //   }
  // },

  verifySwiftpayUser: async (username: string) => {
    const response = await api.get(
      `/swiftpay-transfer/verify-user?username=${username}`
    );
    return response.data;
  },

  getBankTransferBeneficiaries: async () => {
    const response = await api.get("/bank-transfer/beneficiaries");
    return response.data;
  },

  swiftPayTransferBeneficiaries: async () => {
    const response = await api.get("swiftpay-transfer/beneficiaries");
    return response.data;
  },

  toggleBankFavorite: async (transfer_id: number) => {
    const response = await api.post(
      "/bank-transfer/beneficiaries/toggle-favorite",
      {
        transfer_id,
      }
    );
    return response.data;
  },

  toggleSwiftpayFavorite: async (user_id: number) => {
    const response = await api.post(
      "/swiftpay-transfer/beneficiaries/toggle-favorite",
      {
        user_id,
      }
    );
    return response.data;
  },

  markNotificationAsRead: async (notification_id: string) => {
    const response = await api.post(
      `/notifications/mark-as-read/${notification_id}`
    );
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await api.post("/notifications/mark-all-as-read");
    return response.data;
  },

  transferToSwiftpay: async (data: {
    username: string;
    amount: string;
    description: string;
    pin: string;
    source_link: string | null;
  }) => {
    const response = await api.post("/swiftpay-transfer/transfer-money", data);
    return response.data;
  },

  groupSavingsData: async () => {
    const response = await api.get("/group-savings");
    // console.log("Group savings: ", response.data);
    return response.data;
  },

  groupSavingsInvite: async (
    invite_code: string
  ): Promise<GroupInvitationResponse> => {
    try {
      const response = await api.get(`/group-savings/invite/${invite_code}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  responseToInvite: async (data: {
    group_savings_id: string;
    response: "accept" | "decline";
  }) => {
    try {
      const response = await api.post("/group-savings/invite/respond", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  makeMemberGroupAdmin: async (data: {
    group_savings_id: string;
    user_id: number;
  }) => {
    try {
      const response = await api.post("/group-savings/make-member-admin", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  removeMemberFromGroup: async (data: {
    group_savings_id: string;
    user_id: number;
    reason: string;
  }) => {
    try {
      const response = await api.post("/group-savings/remove-member", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  groupSavingsHistory: async () => {
    const response = await api.get("/group-savings/history");
    // console.log("Group savings: ", response.data);
    return response.data;
  },

  CreateGroupSavingData: async () => {
    const response = await api.get("/group-savings/create");
    // console.log("Group savings: ", response.data);
    return response.data;
  },

  CreateGroupSavingStore: async (data: {
    name: string;
    type: string;
    description: string;
    end_date: string;
    target_amount: number | null;
    member_target_amount: number | null;
  }) => {
    const response = await api.post("/group-savings/store", data);
    return response.data;
  },

  groupSavingsdDetailsApi: async (id: any) => {
    const response = await api.get(`/group-savings/show/${id}`);
    // console.log("Group savings: ", response.data);
    return response.data;
  },

  AddMoneyGroupSaving: async (data: {
    group_savings_id: number;
    pin: string;
    amount: number;
  }) => {
    const response = await api.post("/group-savings/add-money", data);
    return response.data;
  },

  multipleSwiftpayTransfer: async (data: {
    total_amount: string;
    pin: string;
    swiftpay_accounts: SwiftPayTransferAccount[];
  }): Promise<MultipleTransferResponse> => {
    try {
      const response = await api.post("/multiple-swiftpay-transfer", data);
      return response.data;
    } catch (error: _TSFixMe) {
      console.log(error.response.data);

      throw handleApiError(error);
    }
  },

  storeUserPushToken: async (token: string, device_name: string) => {
    const response = await api.post("/store-notification-token", {
      token,
      device_name,
    });
    return response.data;
  },

  getNotifications: async function () {
    try {
      const response = await api.get("/notifications?page=1");
      return response.data;
    } catch (error) {
      console.log("getNotifications Error:", error);
      throw handleApiError(error);
    }
  },

  getMultipleTransferPage: async (): Promise<MultipleTransferPageResponse> => {
    try {
      const response = await api.get("/multiple-transfer");
      return response.data;
    } catch (error) {
      console.log("getMultipleTransferPage Error:", error);
      throw handleApiError(error);
    }
  },

  getBankTransferDataPage: async (): Promise<TransferDataResponse> => {
    try {
      const response = await api.get("/bank-transfer");
      // showLogs("getBankTransferData", response.data);

      return response.data;
    } catch (error) {
      // console.log("getMultipleTransferPage Error:", error);
      throw handleApiError(error);
    }
  },

  getSwifyPayTransferData: async (): Promise<TransferDataResponse> => {
    try {
      const response = await api.get("/swiftpay-transfer");
      // showLogs("getSwifyPayTransferData", response.data);
      return response.data;
    } catch (error) {
      console.log("getSwifyPayTransferData Error:", error);
      throw handleApiError(error);
    }
  },

  // Send Abroad API Functions
  getSendAbroadPage: async (): Promise<SendAbroadPageResponse> => {
    try {
      const response = await api.get("/send-abroad-page");
      return response.data;
    } catch (error) {
      console.log("Send Abroad Page Error:", error);
      throw handleApiError(error);
    }
  },

  getTransferAbroadPage: async (): Promise<TransferAbroadPageResponse> => {
    try {
      const response = await api.get("/transfer-abroad-page");
      // console.log("Transfer Abroad Page Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Transfer Abroad Page Error:", error);
      throw handleApiError(error);
    }
  },

  getSendAfricaPage: async (): Promise<SendAfricaPageResponse> => {
    try {
      const response = await api.get("/send-to-africa");
      // console.log("Send Abroad Page Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Send Abroad Page Error:", error);
      throw handleApiError(error);
    }
  },

  getReferralPage: async (): Promise<ReferralPageResponse> => {
    try {
      const response = await api.get("/referral-page");
      return response.data;
    } catch (error) {
      console.log("Transfer Abroad Page Error:", error);
      throw handleApiError(error);
    }
  },

  getElectricityHistory: async (): Promise<ElectricityHistory> => {
    try {
      const response = await api.get("/bills/electricity/history");
      return response.data;
    } catch (error) {
      console.log("getElectricityHistory Error:", error);
      throw handleApiError(error);
    }
  },

  getCableHistory: async (): Promise<CableHistory> => {
    try {
      const response = await api.get("/bills/cable/history");
      return response.data;
    } catch (error) {
      console.log("getCableHistory Error:", error);
      throw handleApiError(error);
    }
  },

  transferMoneyAbroad: async (data: TransferAbroadRequest): Promise<any> => {
    try {
      const response = await api.post("/transfer-money-abroad", data);
      return response.data;
    } catch (error: _TSFixMe) {
      console.log("Transfer Money Abroad Error:", error.response.data);
      throw handleApiError(error);
    }
  },
};

// Bureau De Change API Functions
export const bureauDeChangeApi = {
  // Buy Currency Endpoints
  getBuyRatesAndHistory: async () => {
    const response = await api.get("/bureau-da-change/buy-page");
    console.log(response);
    return response.data;
  },

  getBuyCurrencyPage: async (currencyId: number) => {
    const response = await api.get(
      `/bureau-da-change/buy-currency-page?currency_id=${currencyId}`
    );
    return response.data;
  },

  getCurrencyDetails: async (
    currencyCode: string
  ): Promise<CurrencyDetails> => {
    try {
      const response = await api.get(
        `/bureau-da-change/buy-fx/${currencyCode}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  validateAmount: async (data: { amount: number; currency_code: string }) => {
    const response = await api.post(
      "/bureau-da-change/buy-fx/validate-amount",
      data
    );
    return response.data;
  },

  submitBuyOrder: async (data: {
    currency_id: number;
    currency_amount: number;
    pin: number;
    data: Record<string, any>;
  }) => {
    const response = await api.post(
      "/bureau-da-change/submit-buy-fx-order",
      data
    );
    return response.data;
  },

  // Sell Currency Endpoints
  getSellRatesAndHistory: async () => {
    const response = await api.get("/bureau-da-change/sell-fx");
    return response.data;
  },

  getSellCurrencyDetails: async (currencyCode: string) => {
    const response = await api.get(`/bureau-da-change/sell-fx/${currencyCode}`);
    return response.data;
  },

  calculateNairaAmount: async (data: {
    amount: number;
    currency_code: string;
  }) => {
    const response = await api.post(
      "/bureau-da-change/sell-fx/calculate-naira-amount",
      data
    );
    return response.data;
  },

  submitSellOrder: async (data: {
    currency_code: string;
    amount: number;
    pin: number;
    dynamicFields?: Record<string, any>;
  }) => {
    const response = await api.post(
      "/bureau-da-change/sell-fx/submit-order",
      data
    );
    return response.data;
  },

  checkCurrencyAvailability: async (currency_code: string) => {
    const response = await api.post("/bureau-da-change/sell-fx/buy", {
      currency_code,
    });
    return response.data;
  },

  getSellCurrencyPage: async (
    currencyId: number
  ): Promise<SellCurrencyDetails> => {
    try {
      const response = await api.get(
        `/bureau-da-change/sell-currency-page?currency_id=${currencyId}`
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  submitSellCurrencyOrder: async (orderData: BuyOrSellCurrencyOrder) => {
    try {
      const response = await api.post(
        "/bureau-da-change/submit-sell-fx-order",
        orderData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  submitBuyCurrencyOrder: async (orderData: BuyOrSellCurrencyOrder) => {
    try {
      const response = await api.post(
        "/bureau-da-change/submit-buy-fx-order",
        orderData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log("err block");
      throw handleApiError(error);
    }
  },

  getSellPage: async (): Promise<SellPageResponse> => {
    try {
      const response = await api.get("/bureau-da-change/sell-page");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Ajo Savings API Functions
export const ajoSavingsApi = {
  getAjoSavings: async () => {
    try {
      const response = await api.get("/ajo-savings");
      return response.data;
    } catch (error) {
      console.log("Get Ajo Savings Error:", error);
      throw handleApiError(error);
    }
  },

  getAjoSavingsHistory: async () => {
    try {
      const response = await api.get("/ajo-savings/history");
      return response.data;
    } catch (error) {
      console.log("Get Ajo Savings History Error:", error);
      throw handleApiError(error);
    }
  },

  getAjoSavingsTransactionHistory: async (id: string) => {
    try {
      const response = await api.get(
        `/ajo-savings/transactions?ajo_savings_id=${id}`
      );
      return response.data.data;
    } catch (error) {
      console.log("Get Ajo Savings History Error:", error);
      throw handleApiError(error);
    }
  },

  paybackAjoSavings: async (savings_id: string) => {
    try {
      const response = await api.post(`/ajo-savings/payback`, {
        ajo_savings_id: savings_id,
      });
      return response.data;
    } catch (error: _TSFixMe) {
      showLogs("paybackAjoSavings:", error.response);
      throw handleApiError(error);
    }
  },
};

// Ajo contribution Api
export const ajoContributionApi = {
  getAjoContribution: async () => {
    try {
      const response = await api.get("/ajo-contribution");
      return response.data;
    } catch (error) {
      console.log("Get Ajo Contribution Error:", error);
      throw handleApiError(error);
    }
  },
  joinAjoGroup: async (groupId: string): Promise<any> => {
    try {
      const response = await api.post("ajo-contributions/join/accept", {
        ajo_contribution_id: groupId,
      });

      return response.data;
    } catch (error) {
      console.log("Join Ajo Group Error:", error);
      throw handleApiError(error);
    }
  },
};

// Crypto API Functions
export const cryptoExchangeApi = {
  // Sell Crypto Endpoints
  getSellCryptoPage: async (cryptoId: string | number): Promise<any> => {
    try {
      const response = await api.get(
        `/crypto-exchange/sell-crypto-page?crypto_id=${cryptoId}`
      );
      // console.log("Sell Crypto Page Response:", response.data);
      return response.data;
    } catch (error: _TSFixMe) {
      console.log("Get Sell Crypto Page Error:", error?.response?.data);
      throw handleApiError(error);
    }
  },

  generatePaymentAddress: async (data: {
    network: string;
    currency_code: string;
  }): Promise<any> => {
    try {
      const response = await api.post(
        "/crypto-exchange/generate-payment-address",
        data
      );
      // console.log("Generate Payment Address Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Generate Payment Address Error:", error);
      throw handleApiError(error);
    }
  },

  submitSellOrder: async (data: {
    crypto_amount: number;
    amount_in_naira: number;
    total: number;
    currency_id: number;
    pin: number;
    crypto_rate: number;
  }): Promise<any> => {
    try {
      const response = await api.post(
        "/crypto-exchange/submit-sell-order",
        data
      );
      // console.log("Submit Sell Order Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Submit Sell Order Error:", error);
      throw handleApiError(error);
    }
  },

  // Buy Crypto Endpoints from existing code
  // ...existing code...
};

export const KYCApi = {
  submitStepOne: async (data: KYCStepOneDeets): Promise<any> => {
    try {
      const response = await api.post("/kyc/submit-step-1", data);
      // console.log("submitStepOne Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.log("submitStepOne Response:", error.response.data);
      throw handleApiError(error);
    }
  },
  submitStepTwo: async (data: FormData): Promise<any> => {
    try {
      const response = await api.post("/kyc/submit-step-2", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      showLogs("submitStepTwo Response:", response.data);
      return response.data;
    } catch (error: any) {
      showLogs("submitStepTwo Response:", error.response.data);
      throw handleApiError(error);
    }
  },
  submitStepThree: async (data: FormData): Promise<any> => {
    try {
      const response = await api.post("/kyc/submit-step-3", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      showLogs("submitStepThree Response:", response.data);
      return response.data;
    } catch (error: any) {
      showLogs("submitStepThree Response:", error.response.data);
      throw handleApiError(error);
    }
  },
};

export interface KYCStepOneDeets {
  first_name: string;
  last_name: string;
  other_names: string;
  date_of_birth: string;
  address: string;
  occupation: string;
  gender: string;
  bvn: string;
}

export interface SellPageCurrency {
  id: number;
  currency: string;
  code: string;
  rate: number;
  price: number;
  volume: number | null;
  status: string;
  logo: string | null;
  currency_symbol: string;
  sell_price: number | null;
  limit: number | null;
  sell_status: string | null;
  logo_url: string;
}

export interface SellPageHistory {
  price: ReactNode;
  quantity: ReactNode;
  orderNo: ReactNode;
  id: number;
  user_id: number;
  order_number: string;
  currency_name: string;
  currency_code: string;
  amount: number;
  naira_amount: number;
  status: string;
  status_message: string | null;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SellPageResponse {
  status: string;
  message: string;
  data: {
    currencies: SellPageCurrency[];
    history: SellPageHistory[];
  };
}

export interface BuyCryptoPageResponse {
  status: string;
  message: string;
  data: {
    currency: {
      id: number;
      uuid: string;
      name: string;
      symbol: string;
      icon: string;
      changes: string[];
      price_in_usd: number;
      change_percentage: number;
      status: string;
      created_at: string;
      updated_at: string;
    };
    swiftpay_fee: number;
    quidax_wallet_address: {
      id: number;
      user_id: number;
      currency_code: string;
      address: string;
      network: string;
      created_at: string;
      updated_at: string;
    };
    naira_rate: number;
    quidax_wallet: {
      id: string;
      name: string;
      currency: string;
      balance: string;
      locked: string;
      staked: string;
      user: {
        id: string;
        sn: string;
        email: string;
        reference: string | null;
        first_name: string;
        last_name: string;
        display_name: string | null;
        created_at: string;
        updated_at: string;
      };
      blockchain_enabled: boolean;
      default_network: string;
      networks: Array<{
        id: string;
        name: string;
        deposits_enabled: boolean;
        withdraws_enabled: boolean;
      }>;
      deposit_address: string;
      destination_tag: string | null;
    };
    networks: Array<{
      id: string;
      name: string;
      deposits_enabled: boolean;
      withdraws_enabled: boolean;
      payment_address: string | null;
    }>;
  };
}

export type MultipleTransferPayload = {
  total_amount: string;
  pin: string;
  bank_accounts: {
    account_name: string;
    account_number: string;
    bank_name: string;
    bank_code: string;
    amount: string;
    description?: string;
    fee?: number;
  }[];
};

export interface CryptoSellPageResponse {
  status: string;
  message: string;
  data: {
    dollarRate: number;
    currencies: Array<{
      id: number;
      uuid: string;
      name: string;
      symbol: string;
      icon: string;
      changes: string[];
      price_in_usd: number;
      change_percentage: number;
      status: string;
      created_at: string;
      updated_at: string;
    }>;
    history: Array<{
      id: number;
      user_id: number;
      crypto_name: string;
      crypto_symbol: string;
      amount_in_naira: number;
      amount_in_crypto: number;
      status: string;
      created_at: string;
      updated_at: string;
      wallet_address: string;
      quotation_id: string;
      crypto_network: string | null;
    }>;
  };
}

// Types for Send Abroad
export interface SendAbroadPageResponse {
  status: string;
  message: string;
  data: {
    wallet_balance: number;
    transaction_volume: number;
    recent_transactions: AbroadTransaction[];
    exchange_rate: number;
  };
}

export interface SendAfricaPageResponse {
  status: string;
  message: string;
  data: {
    totalVolume: number;
    dollarRate: number;
    transfers: AfricaTransaction[];
  };
}

export interface TransferAbroadPageResponse {
  status: string;
  message: string;
  data: {
    fixed_fee: number;
    percentage_fee: number;
    currencies: {
      [key: string]: string[];
    };
    currency_logos: {
      [key: string]: string;
    };
    domiciliary_banks: {
      [key: string]: string;
    };
    int_transfer_rates: Array<{
      id: number;
      currency: string;
      rate: number;
      created_at: string;
      updated_at: string;
    }>;
  };
}

interface ReferralPivot {
  referred_by: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  amount: number;
  status: "claimed" | "pending" | string;
}

interface ReferralUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
  profile_image: string;
  email_verified_at: string | null;
  account_status: "active" | "deleted" | string;
  is_bvn_verified: boolean;
  bvn: string | null;
  bvn_reference: string | null;
  kyc_status: "verified" | "unverified" | string;
  nin: string | null;
  phone: string;
  otp_reference: string | null;
  is_otp_verified: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  is_verified: number; // 0 or 1
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  quidax_id: string | null;
  quidax_sn: string | null;
  card_token: string | null;
  card_token_email: string | null;
  level: string;
  transaction_volume: string;
  ajo_contribution_wallet: number;
  platform: string;
  deleted_at: string | null;
  is_owing_ajo_contribution: number;
  if_level_changed: boolean;
  name: string;
  profile_photo: string;
  hash_id: string;
  pivot: ReferralPivot;
}

interface ReferralData {
  referral_bonus_amount: number;
  referral_link: string;
  ajo_savings_referral_code: string;
  amount_earned: number;
  referrals: ReferralUser[];
}

type ElectricityHistory = {
  status: "success" | "error" | string;
  message: string;
  data: ElectricityHistoryData[];
};

type CableHistory = {
  status: "success" | "error" | string;
  message: string;
  data: CableHistoryData[];
};

export type CableHistoryData = {
  id: number;
  user_id: number;
  card_number: string;
  phone: string;
  provider_code: string;
  package_code: string;
  customer_name: string;
  created_at: string;
  updated_at: string;
};

export type ElectricityHistoryData = {
  id: number;
  user_id: string;
  meter_number: string;
  phone: string;
  provider_code: string;
  provider_name: string;
  package_code: string;
  customer_name: string;
  customer_address: string;
  created_at: string;
  updated_at: string;
};

type ReferralPageResponse = {
  status: "success" | "error" | string;
  message: string;
  data: ReferralData;
};

export interface AbroadTransaction {
  id: number;
  name: string;
  phone: string;
  amount: string;
  status: string;
  statusColor: string;
  date: string;
}
export interface AfricaTransaction {
  reference: string;
  account_name: string;
  type: string;
  amount: string;
  status: string;
  profile_pic: string;
  date: string;
}

export interface TransferAbroadRequest {
  amount: number;
  total_fee: number;
  total_amount: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  swift_code: string;
  routing_number: string;
  selectedCurrency: string;
  country: string;
  description: string;
  postal_code?: string;
  street_name?: string;
  street_number?: string;
  city?: string;
  pin: number;
}
