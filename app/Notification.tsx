import LoadingComp from "@/components/Loading";
import { IS_ANDROID_DEVICE } from "@/constants";
import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { _TSFixMe, cn, formatDate, formatTopic } from "@/utils";
import { showLogs } from "@/utils/logger";
import { getServiceIcon, serviceIcons } from "@/utils/NotificationImages";
import { AntDesign, Fontisto, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { Fragment, useEffect, useState } from "react";
import { LegendList } from "@legendapp/list";

import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface NotificationInterface {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    message: string;
    link: string;
    topic: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemProps {
  id: string;
  isRead: boolean;
  topic: string;
  content: string;
  created_at: string;
}

const Notification = () => {
  const router = useRouter();
  const [Loading, setLoading] = useState(false);
  const [AllNotifications, setAllNotifications] = useState<
    NotificationInterface[]
  >([]);
  const { setShouldRefetch } = useAuth();
  const { displayLoader, hideLoader } = useAuth();

  const [nextPageApi, setNextPageApi] = useState(
    `https://swiftpaymfb.com/api/notifications?page=1`
  );

  async function GetNotifications() {
    try {
      setLoading(true);
      displayLoader();

      let intigrate = await axios({
        url: nextPageApi,
        method: "get",
        headers: {
          Authorization: `Bearer ${await SecureStore.getItemAsync(
            "userToken"
          )}`,
          "Content-Type": "application/json",
        },
      });

      let data = intigrate.data.data;

      setAllNotifications((prev) => {
        const newData = data.notifications.data;
        const uniqueData = newData.filter(
          (n: _TSFixMe) => !prev.some((p) => p.id === n.id)
        );
        return [...prev, ...uniqueData];
      });
      setNextPageApi(data?.notifications?.next_page_url);
      setShouldRefetch(Date.now().toString());
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "unable to verify",
        text2: "Try again",
        position: "top",
      });
      console.log(err.response.data);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }

  useEffect(() => {
    GetNotifications();
  }, []);

  async function markAsRead(id: string) {
    try {
      await apiService.markNotificationAsRead(id);
      setAllNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setShouldRefetch(Date.now().toString());
    } catch (error) {
      showLogs("markAsRead error", error);
    }
  }

  async function markAllAsRead() {
    try {
      await apiService.markAllNotificationsAsRead();
      setAllNotifications((prev) =>
        prev.map((n) =>
          n.read_at === null ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setShouldRefetch(Date.now().toString());
    } catch (error) {
      showLogs("markAsRead error", error);
    }
  }

  const unreadNotifications = Array.isArray(AllNotifications)
    ? AllNotifications.filter((n) => n.read_at === null)
    : [];

  function Item({ id, isRead, topic, content, created_at }: ItemProps) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.rateItem}
        onPress={() => markAsRead(id)}
        className={cn(
          !isRead &&
            "bg-[#ebf5ff] rounded-lg p-2 border-l-2 border-swiftPayBlue"
        )}
      >
        <View className="h-[40px] w-[40px] bg-[#c3ddfd] rounded-full items-center justify-center">
          {serviceIcons[topic]?.icon ? (
            <>{serviceIcons[topic]?.icon}</>
          ) : (
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.swiftPayBlue}
            />
          )}
        </View>
        <View style={styles.rateItemContent}>
          <Text style={styles.rateText}>{formatTopic(topic)}</Text>
          <Text style={styles.rateValue}>{content}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Fontisto name="date" size={11} color="black" />
            <Text style={styles.date}>{formatDate(created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View className={IS_ANDROID_DEVICE ? "mt-4" : "mx-5"}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          {unreadNotifications.length > 0 ? (
            <TouchableOpacity activeOpacity={0.7} onPress={markAllAsRead}>
              <Text className="text-swiftPayBlue font-semibold">
                Mark All as Read
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="mr-10" />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.section}>
            {/* {AllNotifications.length > 0
              ? AllNotifications.map((i) => (
                  <Item
                    key={i.id}
                    id={i?.id}
                    isRead={i.read_at != null}
                    topic={i.data?.topic}
                    content={i.data.message}
                    created_at={i.created_at}
                  />
                ))
              : Loading == false && <Text>No Notifications</Text>} */}

            <FlatList
              data={AllNotifications}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Item
                  key={item.id}
                  id={item?.id}
                  isRead={item.read_at != null}
                  topic={item.data?.topic}
                  content={item.data.message}
                  created_at={item.created_at}
                />
              )}
              ListEmptyComponent={() => (
                <Fragment>
                  {!Loading ? (
                    <View className="flex-1 justify-center items-center mt-[100px]">
                      <Ionicons
                        name="notifications-off-outline"
                        size={80}
                        color={COLORS.swiftPayBlue}
                      />
                      <Text className="text-[19px] mt-3 font-semibold">
                        No Notifications yet
                      </Text>
                      <Text className="text-[14px] mt-1 text-gray-200">
                        All your notifications will appear here
                      </Text>
                    </View>
                  ) : null}
                </Fragment>
              )}
            />

            {Loading == false && nextPageApi && AllNotifications.length > 0 ? (
              <Pressable
                style={{ alignItems: "center" }}
                onPress={GetNotifications}
              >
                <Text style={{ color: "blue" }}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  rateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  rateItemContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    padding: 8,
    flex: 1,
  },
  rateIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
    borderRadius: 50,
    // tintColor:'black',
  },
  rateText: {
    fontSize: 16,
    fontWeight: "700",
  },
  rateValue: {
    fontSize: 13,
    fontWeight: "400",
    color: "#444",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    fontWeight: "400",
    color: "#888",
    marginTop: 2,
  },
});

export default Notification;
