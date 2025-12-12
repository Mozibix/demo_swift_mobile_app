import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  // Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useCurrencyRates } from "@/hooks/useApi";
import { Image } from "expo-image";
import { IS_ANDROID_DEVICE } from "@/constants";
import LoadingComp from "@/components/Loading";
import { navigationWithReset } from "@/utils";
import { useGlobals } from "@/context/GlobalContext";

interface RateItemProps {
  title: string;
  rate: string;
  logo: string;
}

const RateItem: React.FC<RateItemProps> = ({ title, rate, logo }) => (
  <View className="flex-row items-center bg-gray-100 p-4 rounded-lg mb-3">
    <Image
      source={{ uri: logo }}
      className="w-12 h-12 mr-4 rounded-lg"
      style={{ width: 48, height: 48, borderRadius: 4, marginRight: 16 }}
      defaultSource={require("../assets/icons/currency.png")}
    />
    <View className="flex-1">
      <Text className="text-lg font-bold text-gray-800">{title}</Text>
      <Text className="text-base text-gray-600">{rate}</Text>
    </View>
  </View>
);

interface CryptoItemProps {
  symbol: string;
  name: string;
  rate: string;
  icon: string;
}

const CryptoItem: React.FC<CryptoItemProps> = ({
  symbol,
  name,
  rate,
  icon,
}) => (
  <View className="flex-row items-center bg-gray-100 p-4 rounded-lg mb-3">
    <Image
      source={{ uri: icon }}
      className="w-12 h-12 mr-4 rounded-full"
      style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
      // defaultSource={require("../assets/icons/currency.png")}
    />
    <View className="flex-1">
      <Text className="text-lg font-bold text-gray-800">
        {symbol} - {name}
      </Text>
      <Text className="text-base text-gray-600">{rate}</Text>
    </View>
  </View>
);

const Rates = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { data, isLoading, error } = useCurrencyRates();
  const { isCryptoEnabled } = useGlobals();

  if (isLoading) {
    return <LoadingComp visible />;
  }

  if (error instanceof Error) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <View className="bg-red-50 p-6 rounded-xl w-full items-center">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <AntDesign name="exclamationcircleo" size={32} color="#EF4444" />
          </View>
          <Text className="text-xl font-bold text-red-800 mb-2">Oops!</Text>
          <Text className="text-red-600 text-center mb-4">{error.message}</Text>
          <TouchableOpacity
            className="bg-red-500 py-3 px-6 rounded-lg"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : navigationWithReset(navigation, "(tabs)")
            }
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const fiats = data?.data?.fiats || {};
  const cryptoCurrencies = data?.data?.crypto_currencies || {};

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ paddingTop: IS_ANDROID_DEVICE ? 45 : 10 }}>
        <View className="relative flex-row items-center justify-center mb-5">
          <TouchableOpacity
            className="absolute left-4 bg-gray-100 p-1 rounded-full"
            onPress={() => router.push("/(tabs)")}
          >
            <AntDesign name="arrowleft" color="#000" size={24} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-center">Exchange Rates</Text>
        </View>
        <Text className="text-base text-gray-600 text-center max-w-[90%]">
          {isCryptoEnabled
            ? "Real-time conversion rates for currencies and cryptocurrencies"
            : "Real-time conversion rates for currencies"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20 }}
      >
        <View className="px-5 mb-4">
          <View className="mb-6">
            <Text className="text-xl font-semibold mb-4 text-gray-800">
              Currency Pairs
            </Text>
            {Object.entries(fiats).map(([currency, data]) => (
              <RateItem
                key={currency}
                title={`${currency} to NGN`}
                rate={`1 ${currency} = ${data.rate.toLocaleString()} NGN`}
                logo={data.logo}
              />
            ))}
          </View>

          {isCryptoEnabled && (
            <View>
              <Text className="text-xl font-semibold mb-4 text-gray-800">
                Cryptocurrency
              </Text>
              {Object.entries(cryptoCurrencies).map(([symbol, data]) => (
                <CryptoItem
                  key={symbol}
                  symbol={symbol}
                  name={data.name}
                  rate={`$${data.price_in_usd.toLocaleString()}`}
                  icon={data.icon}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Rates;
