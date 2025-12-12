import { _TSFixMe } from "@/utils";
import * as Notifications from "expo-notifications";

interface NotificationProps {
  title: string;
  body: string;
  sound?: string;
  trigger?: number;
  data?: Object;
}

export async function scheduleNotification({
  title,
  body,
  sound = "default",
  trigger = 4,
  data,
}: NotificationProps) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound,
        vibrate: [0, 250, 250, 250],
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: trigger,
      },
    });
  } catch (error) {
    console.log({ error });
  }
}
