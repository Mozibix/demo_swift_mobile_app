import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";
import { triggerWarningHaptic } from "@/utils";
import * as Application from "expo-application";
import remoteConfig from "@react-native-firebase/remote-config";
import {
  IS_ANDROID_DEVICE,
  IS_IOS_DEVICE,
  remoteConfigKeys,
} from "@/constants";
import { useGlobals } from "./GlobalContext";
import Constants from "expo-constants";

export type UserInactivityContextState = {
  shouldShowBlurView: boolean;
  setShouldShowBlurView: Dispatch<SetStateAction<boolean>>;
};

const UserInactivityContext = createContext<UserInactivityContextState>(
  {} as UserInactivityContextState,
);

export function useUserInactivityContext() {
  return useContext(UserInactivityContext);
}

export default function UserInactivityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const appState = useRef(AppState.currentState);
  const {
    setOTAUpdateAvailable,
    setAppUpdateAvailable,
    setIsForceUpdateEnabled,
    setIsCryptoEnabled,
    setIsHoldingsEnabled,
    setIsInvestmentsEnabled,
    refreshString,
  } = useGlobals();

  useEffect(() => {
    initializeRemoteConfig();
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return function () {
      subscription.remove();
    };
  }, [refreshString]);

  async function initializeRemoteConfig() {
    const productionVersion = Application.nativeApplicationVersion;
    const localVersion = Constants.expoConfig?.version;

    try {
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 0,
      });

      await remoteConfig().setDefaults({
        CURRENT_APP_VERSION_IOS: "1.0.0",
        CURRENT_APP_VERSION_ANDROID: "1.0.0",
        IS_VERSION_CHECK_ENABLED: true,
        IS_FORCE_UPDATE_ENABLED: true,
        IS_CRYPTO_ENABLED: false,
        IS_CRYPTO_ENABLED_ANDROID: false,
        IS_HOLDINGS_ENABLED_ANDROID: false,
        IS_INVESTMENT_ENABLED_ANDROID: false,
        SHOW_POPOPS: true,
      });

      const fetchedRemotely = await remoteConfig().fetchAndActivate();

      if (fetchedRemotely) {
        console.log("Configs were retrieved from the backend and activated.");
      } else {
        console.log(
          "No new configs fetched, using previously activated values.",
        );
      }

      const remoteAppVersionKey = IS_IOS_DEVICE
        ? remoteConfigKeys.iosVersion
        : remoteConfigKeys.androidVersion;

      const isVersionCheckEnabled = remoteConfig()
        .getValue(remoteConfigKeys.versionCheckEnabled)
        .asBoolean();

      const isForceUpdateEnabled = remoteConfig()
        .getValue(remoteConfigKeys.forceUpateEnabled)
        .asBoolean();

      const isCryptoEnabledIOS = remoteConfig()
        .getValue(remoteConfigKeys.isCryptoEnabledIOS)
        .asBoolean();

      const isCryptoEnabledAndroid = remoteConfig()
        .getValue(remoteConfigKeys.isCryptoEnabledAndroid)
        .asBoolean();

      const isHoldingsEnabledIOS = remoteConfig()
        .getValue(remoteConfigKeys.isHoldingsEnabledIOS)
        .asBoolean();

      const isHoldingsEnabledAndroid = remoteConfig()
        .getValue(remoteConfigKeys.isHoldingsEnabledAndroid)
        .asBoolean();

      const isInvestmentEnabledIOS = remoteConfig()
        .getValue(remoteConfigKeys.isInvestmentEnabledIOS)
        .asBoolean();

      const isInvestmentEnabledAndroid = remoteConfig()
        .getValue(remoteConfigKeys.isInvestmentEnabledAndroid)
        .asBoolean();

      const remoteAppVersion = remoteConfig()
        .getValue(remoteAppVersionKey)
        .asString();

      if (isVersionCheckEnabled) {
        if (
          remoteAppVersion !== productionVersion
          // ||remoteAppVersion !== localVersion
        ) {
          console.log("Update available via store:", remoteAppVersion);
          if (isForceUpdateEnabled) {
            setIsForceUpdateEnabled(true);
          } else {
            setIsForceUpdateEnabled(false);
          }
          setAppUpdateAvailable(true);
        } else {
          setAppUpdateAvailable(false);
        }
      }

      if (IS_ANDROID_DEVICE) {
        setIsCryptoEnabled(isCryptoEnabledAndroid);
        setIsHoldingsEnabled(isHoldingsEnabledAndroid);
        setIsInvestmentsEnabled(isInvestmentEnabledAndroid);
      } else {
        setIsCryptoEnabled(isCryptoEnabledIOS);
        setIsHoldingsEnabled(isHoldingsEnabledIOS);
        setIsInvestmentsEnabled(isInvestmentEnabledIOS);
      }
    } catch (error) {
      console.error("Failed to initialize remote config:", error);
    }
  }

  function handleAppStateChange(nextAppState: any) {
    checkForUpdatesAsync();

    appState.current = nextAppState;
  }

  async function checkForUpdatesAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        triggerWarningHaptic();
        setOTAUpdateAvailable(true);
      } else {
        setOTAUpdateAvailable(false);
      }
    } catch (error) {
      console.log(`Error fetching latest Expo update: ${error}`);
    }
  }

  return children;
}
