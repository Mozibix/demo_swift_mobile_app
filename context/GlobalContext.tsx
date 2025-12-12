import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

interface GlobalContextType {
  hasSeenPopup: boolean;
  setHasSeenPopup: Dispatch<SetStateAction<boolean>>;
  OTAUpdateAvailable: boolean;
  setOTAUpdateAvailable: Dispatch<SetStateAction<boolean>>;
  appUpdateAvailable: boolean;
  setAppUpdateAvailable: Dispatch<SetStateAction<boolean>>;
  isForceUpdateEnabled: boolean;
  setIsForceUpdateEnabled: Dispatch<SetStateAction<boolean>>;
  isCryptoEnabled: boolean;
  setIsCryptoEnabled: Dispatch<SetStateAction<boolean>>;
  isHoldingsEnabled: boolean;
  setIsHoldingsEnabled: Dispatch<SetStateAction<boolean>>;
  isInvestmentsEnabled: boolean;
  setIsInvestmentsEnabled: Dispatch<SetStateAction<boolean>>;
  refreshString: string;
  setRefreshString: Dispatch<SetStateAction<string>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenPopup, setHasSeenPopup] = useState(false);
  const [OTAUpdateAvailable, setOTAUpdateAvailable] = useState(false);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false);
  const [isForceUpdateEnabled, setIsForceUpdateEnabled] = useState(false);
  const [isHoldingsEnabled, setIsHoldingsEnabled] = useState(false);
  const [isInvestmentsEnabled, setIsInvestmentsEnabled] = useState(false);
  const [isCryptoEnabled, setIsCryptoEnabled] = useState(false);
  const [refreshString, setRefreshString] = useState("");

  return (
    <GlobalContext.Provider
      value={{
        hasSeenPopup,
        setHasSeenPopup,
        OTAUpdateAvailable,
        setOTAUpdateAvailable,
        appUpdateAvailable,
        setAppUpdateAvailable,
        isForceUpdateEnabled,
        setIsForceUpdateEnabled,
        isCryptoEnabled,
        setIsCryptoEnabled,
        isHoldingsEnabled,
        setIsHoldingsEnabled,
        isInvestmentsEnabled,
        setIsInvestmentsEnabled,
        refreshString,
        setRefreshString,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobals() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobals must be used within an GlobalProvider");
  }
  return context;
}
