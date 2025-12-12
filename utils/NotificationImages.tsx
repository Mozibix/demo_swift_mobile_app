import { ReactNode } from "react";
import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  AntDesign,
  Ionicons,
} from "@expo/vector-icons";
import { COLORS } from "@/constants/Colors";

// TypeScript interface for the object
export interface ServiceIcon {
  name?: string;
  link: string;
  icon?: ReactNode;
}

export interface ServiceIcons {
  [key: string]: ServiceIcon;
}

export const serviceIcons: ServiceIcons = {
  wallet_funded: {
    name: "Wallet Funded",
    link: "https://cdn-icons-png.flaticon.com/512/2583/2583344.png",
    icon: (
      <MaterialCommunityIcons
        name="wallet-plus-outline"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  airtime: {
    name: "Airtime",
    link: "https://cdn-icons-png.flaticon.com/512/3480/3480478.png",
    icon: (
      <Ionicons name="call-outline" size={20} color={COLORS.swiftPayBlue} />
    ),
  },
  data: {
    name: "Mobile Data",
    link: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
    icon: (
      <MaterialCommunityIcons
        name="router-network"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  cable: {
    name: "Cable TV",
    link: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png",
    icon: (
      <FontAwesome6 name="cable-car" size={20} color={COLORS.swiftPayBlue} />
    ),
  },
  electricity: {
    name: "Electricity",
    link: "https://cdn-icons-png.flaticon.com/512/3659/3659898.png",
    icon: (
      <MaterialIcons
        name="electric-bolt"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  foreign_to_local_transfer: {
    name: "Foreign to Local Transfer",
    link: "https://cdn-icons-png.flaticon.com/512/4776/4776394.png",
    icon: <Feather name="send" size={20} color={COLORS.swiftPayBlue} />,
  },
  local_to_foreign_transfer: {
    name: "Local to Foreign Transfer",
    link: "https://cdn-icons-png.flaticon.com/512/4776/4776394.png",
    icon: <Feather name="send" size={20} color={COLORS.swiftPayBlue} />,
  },
  holdings: {
    name: "Holdings",
    link: "https://cdn-icons-png.flaticon.com/512/3132/3132693.png",
    icon: (
      <FontAwesome5
        name="hand-holding-usd"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  investments: {
    name: "Investments",
    link: "https://cdn-icons-png.flaticon.com/512/3132/3132693.png",
    icon: <Feather name="trending-up" size={20} color={COLORS.swiftPayBlue} />,
  },
  bureau_de_change: {
    name: "Currency Exchange",
    link: "https://cdn-icons-png.flaticon.com/512/4776/4776394.png",
    icon: (
      <FontAwesome6
        name="circle-dollar-to-slot"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  crypto: {
    name: "Cryptocurrency",
    link: "https://cdn-icons-png.flaticon.com/512/5968/5968260.png",
    icon: <FontAwesome name="bitcoin" size={20} color={COLORS.swiftPayBlue} />,
  },
  gift_card: {
    name: "Gift Card",
    link: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    icon: (
      <MaterialCommunityIcons
        name="wallet-giftcard"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  bank_transfer: {
    name: "Bank Transfer",
    link: "https://cdn-icons-png.flaticon.com/512/2503/2503508.png",
    icon: (
      <MaterialCommunityIcons
        name="bank"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  swiftpay_transfer: {
    name: "Swift Transfer",
    link: "https://cdn-icons-png.flaticon.com/512/4776/4776394.png",
    icon: <Feather name="send" size={20} color={COLORS.swiftPayBlue} />,
  },
  save_with_interest: {
    name: "Savings with Interest",
    link: "https://cdn-icons-png.flaticon.com/512/4775/4775995.png",
    icon: (
      <MaterialCommunityIcons
        name="piggy-bank-outline"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  group_savings: {
    name: "Group Savings",
    link: "https://cdn-icons-png.flaticon.com/512/4775/4775995.png",
    icon: (
      <AntDesign name="addusergroup" size={20} color={COLORS.swiftPayBlue} />
    ),
  },
  ajo_savings: {
    name: "Ajo Savings",
    link: "https://cdn-icons-png.flaticon.com/512/4775/4775995.png",
    icon: (
      <MaterialCommunityIcons
        name="piggy-bank-outline"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  "buy-crypto": {
    name: "Crypto",
    link: "https://cdn-icons-png.flaticon.com/512/4775/4775995.png",
    icon: <FontAwesome name="bitcoin" size={20} color={COLORS.swiftPayBlue} />,
  },
  sell_crypto: {
    name: "Crypto",
    link: "https://cdn-icons-png.flaticon.com/512/4775/4775995.png",
    icon: <FontAwesome name="bitcoin" size={20} color={COLORS.swiftPayBlue} />,
  },
  ajo_contribution: {
    name: "Ajo Contribution",
    link: "https://cdn-icons-png.flaticon.com/512/4775/4775995.png",
    icon: (
      <MaterialCommunityIcons
        name="account-cash-outline"
        size={20}
        color={COLORS.swiftPayBlue}
      />
    ),
  },
  international_transfer: {
    name: "International Transfer",
    link: "https://cdn-icons-png.flaticon.com/512/4776/4776394.png",
    icon: <Feather name="send" size={20} color={COLORS.swiftPayBlue} />,
  },
  multiple_bank_transfer: {
    name: "Multiple Bank Transfers",
    link: "https://cdn-icons-png.flaticon.com/512/2503/2503508.png",
    icon: <Feather name="send" size={20} color={COLORS.swiftPayBlue} />,
  },
  multiple_swiftpay_transfer: {
    name: "Multiple Swift Transfers",
    link: "https://cdn-icons-png.flaticon.com/512/4776/4776394.png",
    icon: <Feather name="send" size={20} color={COLORS.swiftPayBlue} />,
  },
};

// Usage example:
export function getServiceIcon(serviceType: string): ServiceIcon {
  const defaultIcon = {
    name: "Unknown Service",
    link: "https://cdn-icons-png.flaticon.com/512/1178/1178479.png",
  };

  if (!serviceType) return defaultIcon;
  return serviceIcons[serviceType] || defaultIcon;
}
