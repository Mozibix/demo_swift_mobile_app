import { useGlobals } from "@/context/GlobalContext";
import { AntDesign } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type ExchangeProps = {
  navigation: {
    goBack: () => void;
  };
};

const BuyCryptoScreen: React.FC<ExchangeProps> = ({ navigation }) => {
  const handleOptionPress = (route: Href) => {
    router.push(route);
  };

  const { isCryptoEnabled } = useGlobals();

  const options = [
    {
      id: "1",
      title: "Bureau De Change",
      description:
        "Buy and exchange at amazing rates, and get your hard currency in cash or via Bank transfer.",
      image: require("../assets/icons/dollar.png"),
      route: "/BureauDeChange" as Href,
    },
    ...(isCryptoEnabled
      ? [
          {
            id: "2",
            title: "Buy Cryptocurrency",
            description:
              "Make your Crypto purchase swiftly, paste your wallet address and we’ll do the rest. Our SwiftPay to Peer (S - P) Crypto exchange is fast and secured.",
            image: require("../assets/icons/crypto.png"),
            route: "/BuyTrading" as Href,
          },
        ]
      : []),
    {
      id: "3",
      title: "Buy Gift Cards",
      description:
        "Buy Gift Cards swiftly at affordable rates. Fast, easy & reliable.",
      image: require("../assets/icons/gift.png"),
      route: "/SelectCountry" as Href,
    },
  ];

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof options)[0];
    index: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(200 * index + 1)}>
      <TouchableOpacity
        style={styles.optionContainer}
        onPress={() => handleOptionPress(item.route)}
      >
        <Image source={item.image} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInUp.delay(400)}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Money Exchange</Text>
        <View style={styles.placeholder} />
      </Animated.View>
      <FlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 100,
  },
  placeholder: {
    width: 50, // Same width as the backButton to keep alignment
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, // Allow text to take remaining space and center
  },
  listContainer: {
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  textContainer: {
    marginLeft: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
    maxWidth: "95%",
  },
});

export default BuyCryptoScreen;
