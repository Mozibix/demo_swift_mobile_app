import { Platform } from "react-native";

export const DEFAULT_PIN = "xxxx";
export const IS_IOS_DEVICE = Platform.OS === "ios";
export const IS_ANDROID_DEVICE = Platform.OS === "android";
export const DEFAULT_PHOTO = "https://swiftpaymfb.com/default.png";
export const WEB_URL = "https://swiftpaymfb.com";
export const APP_SCHEME = "com.swiftpay.swiftpaymfb";
export const APPLE_APP_ID = "6746058675";

export const remoteConfigKeys = {
  versionCheckEnabled: "IS_VERSION_CHECK_ENABLED",
  forceUpateEnabled: "IS_FORCE_UPDATE_ENABLED",
  androidVersion: "CURRENT_APP_VERSION_ANDROID",
  iosVersion: "CURRENT_APP_VERSION_IOS",
  isCryptoEnabledIOS: "IS_CRYPTO_ENABLED",
  isCryptoEnabledAndroid: "IS_CRYPTO_ENABLED_ANDROID",
  isHoldingsEnabledAndroid: "IS_HOLDINGS_ENABLED_ANDROID",
  isInvestmentEnabledAndroid: "IS_INVESTMENT_ENABLED_ANDROID",
  isHoldingsEnabledIOS: "IS_HOLDINGS_ENABLED_IOS",
  isInvestmentEnabledIOS: "IS_INVESTMENT_ENABLED_IOS",
  showPopops: "SHOW_POPOPS",
};

export const storeUrls = {
  android: `https://play.google.com/store/apps/details?id=${APP_SCHEME}`,
  ios: `https://apps.apple.com/ng/app/id${APPLE_APP_ID}`,
};
