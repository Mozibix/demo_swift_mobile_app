import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router, useNavigation } from "expo-router";
import { showLogs } from "@/utils/logger";
import { showErrorToast } from "@/components/ui/Toast";
import { _TSFixMe, getErrorMessage, navigationWithReset } from "@/utils";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

export type UserLevel = "green" | "gold" | "black" | "blue";

export interface User {
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
  is_verified: 0 | 1;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  quidax_id: string | null;
  quidax_sn: string | null;
  quidax_email?: string | null;
  card_token: string | null;
  card_token_email: string | null;
  level: UserLevel;
  transaction_volume: string;
  ajo_contribution_wallet: number;
  platform: "web" | "mobile" | string;
  deleted_at: string | null;
  is_owing_ajo_contribution: 0 | 1;
  if_level_changed: boolean;
  name: string;
  profile_photo: string;
  hash_id: string;
  kyc: KYCDeets;
}

interface KYCDeets {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  other_names: string;
  date_of_birth: string;
  address: string;
  document_type: string;
  document_number: string;
  gender: "male" | "female" | string;
  occupation: string;
  document_front_image: string;
  document_back_image: string;
  face_cam_image: string;
  created_at: string;
  updated_at: string;
}

interface LoginResponse {
  data: any;
  message: string;
  user?: User;
  token?: string;
  incomplete_steps?: { action: string; message: string }[];
  next_step_url?: string;
}

interface ModalContent {
  image: string;
  title: string;
  description: string;
  route: string;
  buttonText: string;
}

interface AuthContextType {
  login: (
    email: string,
    password: string,
    ignore_otp?: boolean,
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  handleIncompleteSetup: (data: _TSFixMe) => void;
  tokenCheck: boolean;
  selectedModalContent: ModalContent;
  setSelectedModalContent: Dispatch<SetStateAction<ModalContent>>;
  hasOnboarded: boolean;
  shouldRefetch: string;
  setShouldRefetch: Dispatch<SetStateAction<string>>;
  showLoader: boolean;
  displayLoader: VoidFunction;
  hideLoader: VoidFunction;
  getUserProfile: VoidFunction;
  verifyPin: (pin: string) => Promise<boolean>;
  isKYCVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const modalContents = [
  {
    image: "https://swiftpaymfb.com/savings%20-modal%20image.png",
    title: "Personal Savings",
    description: "Save with interest and get up to 20% increase annually.",
    route: "/(tabs)/savings",
    buttonText: "Save Now",
  },
  {
    image:
      "https://res.cloudinary.com/dwdsjbetu/image/upload/v1748890190/image_12_baxync.png",
    title: "Refer & Earn",
    description: "Refer & get paid up to ₦5,000 in cash",
    route: "/SendAfricaReceiveMoney",
    buttonText: "Refer Now",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tokenCheck, setTokenCheck] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(Date.now().toString());
  const [showLoader, setShowLoader] = useState(false); // TODO: Move this out of auth context
  const navigation = useNavigation();
  const [selectedModalContent, setSelectedModalContent] =
    useState<ModalContent>(modalContents[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * modalContents.length);
    setSelectedModalContent(modalContents[randomIndex]);
  }, []);

  function displayLoader() {
    setShowLoader(true);
  }

  function hideLoader() {
    setShowLoader(false);
  }

  const handleIncompleteSetup = (response: LoginResponse, password = "") => {
    if (
      response.incomplete_steps?.some((step) => step.action === "create_pin")
    ) {
      navigationWithReset(navigation, "TransactionPinSetup");
      return;
    } else if (
      response.incomplete_steps?.some(
        (step) => step.action === "create_swiftpay_tag",
      )
    ) {
      navigationWithReset(navigation, "ChangeSwiftpayTag");
      return;
    } else if (
      response.incomplete_steps?.some(
        (step) => step.action === "otp_verification",
      )
    ) {
      // router.replace("/(tabs)");
      navigationWithReset(navigation, "AuthVerification", {
        password,
      });
      return;
    } else {
      navigationWithReset(navigation, "(tabs)");
    }
  };

  const login = async (
    email: string,
    password: string,
    ignore_otp: boolean = false,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<LoginResponse>(
        "https://swiftpaymfb.com/api/login",
        { email, password, ignore_otp },

        {
          headers: {
            // Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      // showLogs("response", response.data);

      const data = response.data.data;
      await AsyncStorage.setItem("biometricEmail", email);
      await SecureStore.setItemAsync("otpToken", data.token);
      await SecureStore.setItemAsync("userToken", data.token);

      if (data.incomplete_steps && data.incomplete_steps.length > 0) {
        handleIncompleteSetup(data, password);
      } else {
        if (ignore_otp) {
          if (data.user) {
            await SecureStore.setItemAsync(
              "userData",
              JSON.stringify(data.user),
            );
            setUser(data.user);
          }

          await SecureStore.setItemAsync("biometricEmail", email);
          await SecureStore.setItemAsync("biometricPassword", password);
          await AsyncStorage.setItem("biometricEmail", email);
          navigationWithReset(navigation, "(tabs)");
        } else {
          navigationWithReset(navigation, "AuthVerification", {
            password,
          });
        }
      }
    } catch (err: any) {
      showLogs("err", err.response);
      const firstError = getErrorMessage(err);

      if (err.response?.status === 422) {
        setError(Object.values(err.response.data.errors).flat().join("\n"));
        showErrorToast({
          title:
            err.response.data.message ||
            firstError ||
            Object.values(err.response.data.errors).flat().join("\n") ||
            "",
          desc: "Login failed",
        });
      } else if (err.response?.status === 401) {
        setError("Invalid email or password");
        showErrorToast({
          title: "Invalid email or password",
        });
      } else {
        setError(
          err.response?.data?.message || "An error occurred during login",
        );
        showErrorToast({
          title: err.response?.data?.message || firstError || "",
          desc: "An error occurred during login, Please try again",
        });
      }
      console.log(err.response);
      throw err;
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  async function verifyPin(pin: string) {
    try {
      const response = await apiService.verifyUserPin(pin);
      return response.status === "success";
    } catch (error: _TSFixMe) {
      showLogs("verifyPin error", error.response);
      return false;
    }
  }

  async function getUserProfile() {
    try {
      const userData = await apiService.getUserProfile();
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));
      await AsyncStorage.setItem("UserDetails", JSON.stringify(userData));
      setShouldRefetch(Date.now().toString());
      setUser(userData);
    } catch (error: _TSFixMe) {
      // showLogs("getUserProfile error", error.response);
    }
  }

  function isKYCVerified() {
    if (user?.kyc_status === "verified") return true;
    return false;
  }

  useEffect(() => {
    async function getActiveUser() {
      console.log("getActiveUser ran");
      const user = await SecureStore.getItemAsync("userData");
      const token = await SecureStore.getItemAsync("userToken");
      const userHasOnboarded = await AsyncStorage.getItem("userHasOnboardedSP");
      showLogs("userHasOnboarded", userHasOnboarded);
      if (token) {
        setTokenCheck(true);
      }
      if (userHasOnboarded === "true") {
        setHasOnboarded(true);
      }
      if (user) {
        setUser(JSON.parse(user));
      }
    }
    getActiveUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        isLoading,
        error,
        user,
        setUser,
        handleIncompleteSetup,
        tokenCheck,
        hasOnboarded,
        showLoader,
        displayLoader,
        hideLoader,
        verifyPin,
        getUserProfile,
        shouldRefetch,
        setShouldRefetch,
        selectedModalContent,
        setSelectedModalContent,
        isKYCVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
