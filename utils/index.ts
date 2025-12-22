import { IS_IOS_DEVICE } from "@/constants";
import { CommonActions } from "@react-navigation/native";
import { type ClassValue, clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { twMerge } from "tailwind-merge";
import { showSuccessToast } from "@/components/ui/Toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getFileInfo(image: any) {
  const fileInfo = await FileSystem.getInfoAsync(image);
  const fileUri = fileInfo.uri;
  const fileName = fileUri.split("/").pop();
  const fileType = fileName?.split(".").pop();
  const mimeType = `image/${fileType}`;

  return { fileUri, fileName, mimeType };
}

export const formatBalance = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function getErrorMessage(error: any) {
  const errorFields = error?.response?.data?.errors || error?.data?.errors;
  if (errorFields) {
    const firstFieldKey = errorFields ? Object.keys(errorFields)[0] : null;
    const firstErrorMessage = firstFieldKey
      ? errorFields[firstFieldKey]?.[0]
      : null;

    return firstErrorMessage;
  } else {
    return "Something went wrong, Please try again";
  }
}

export function formatAmountMinimal(amount: number) {
  return new Intl.NumberFormat().format(amount);
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type _TSFixMe = any;

export function formatDate(rawDate: string | Date) {
  const date = new Date(rawDate);

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const formattedDate = date.toLocaleString("en-US", options).replace(",", "");
  return formattedDate;
}

export function formatSource(source: string) {
  if (!source) return "-";
  return source
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatTopic(topic: string) {
  if (!topic) return "Notification";
  return topic
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
export function getInitials(name: string) {
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0][0];
  return names
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
}

export const profileBadges = {
  green: require("../assets/icons/green-badge.png"),
  gold: require("../assets/icons/gold-badge.png"),
  blue: require("../assets/icons/blue-badge.png"),
  black: require("../assets/icons/black-badge.png"),
};

export function shortenText(text: string, maxLength: number = 25) {
  if (text?.length > maxLength) {
    return text?.slice(0, maxLength) + "...";
  }
  return text;
}

export function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateAgo(date: string) {
  dayjs.extend(relativeTime);
  return dayjs(date).fromNow();
}

export function formatDateAgoAlt(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function hasDatePassed(dateString: string) {
  const inputDate = new Date(dateString);
  const now = new Date();

  return inputDate.getTime() < now.getTime();
}

export function hasDateNotArrived(dateString: string): boolean {
  const inputDate = new Date(dateString);
  const now = new Date();

  return inputDate.getTime() > now.getTime();
}

export default function copyToClipboard(value: string, label: string) {
  Clipboard.setStringAsync(value);
  showSuccessToast({
    title: `${label} copied to clipboard!`,
  });
}

export function formatKey(key: string) {
  let formatted = key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (s) => s.toUpperCase());

  if (formatted.length > 25) {
    formatted = formatted.substring(0, 25) + "...";
  }

  return formatted;
}

export function maybeFormatValue(value: string) {
  const date = new Date(value);
  const isValidDate = !isNaN(date.getTime());

  if (isValidDate && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  }

  if (value.length > 20) {
    return value.substring(0, 20) + "...";
  }

  return value;
}

export function navigationWithReset(
  navigation: _TSFixMe,
  route: string,
  params?: Record<string, any>
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: route, params }],
    })
  );
}

export function triggerHaptic() {
  IS_IOS_DEVICE
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : Haptics.selectionAsync();
}

export function triggerWarningHaptic() {
  IS_IOS_DEVICE
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function triggErrrorHaptic() {
  IS_IOS_DEVICE
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export const GOOGLE_VISION_API_KEY = "AIzaSyD040vf11rE9-aq8zwRyrHe894TFGJf__M";

export const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Levenshtein distance for fuzzy matching
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(shorter, longer);
  return (longer.length - editDistance) / longer.length;
};

const getEditDistance = (s1: string, s2: string): number => {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
};
