import { triggerHaptic, triggErrrorHaptic } from "@/utils";
import Toast, { ToastPosition } from "react-native-toast-message";

type BaseToastProps = {
  title?: string;
  desc?: string;
  position?: ToastPosition;
};

export function showSuccessToast({
  title = "",
  desc,
  position = "top",
}: BaseToastProps) {
  triggerHaptic();
  return Toast.show({
    type: "success",
    text1: title,
    text2: desc,
    position: position,
    topOffset: 50,
  });
}

export function showErrorToast({
  title,
  desc,
  position = "top",
}: BaseToastProps) {
  triggErrrorHaptic();
  return Toast.show({
    type: "error",
    text1: title,
    text2: desc,
    position: position,
    topOffset: 50,
    visibilityTime: 4000,
  });
}

export function showInfoToast({
  title,
  desc,
  position = "top",
}: BaseToastProps) {
  return Toast.show({
    type: "info",
    text1: title,
    text2: desc,
    position: position,
    topOffset: 50,
  });
}
