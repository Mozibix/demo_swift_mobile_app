import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useGlobals } from "@/context/GlobalContext";

const Bills = () => {
  const scrollViewRef = useRef<ScrollView>(null); // Explicitly typed as ScrollView
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { isCryptoEnabled } = useGlobals();

  const images = [
    require("../../assets/Bills/1.png"),
    ...(isCryptoEnabled ? [require("../../assets/Bills/2.png")] : []),
    require("../../assets/Bills/3.png"),
    require("../../assets/Bills/4.png"),
    require("../../assets/Bills/5.png"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => {
        const nextIndex = prevIndex === images.length - 1 ? 0 : prevIndex + 1;
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * 300,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 6000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backbutton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={20} color={"#fff"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Bills</Text>
        <Text style={styles.placeholder}></Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/Electricity")}
          >
            <Image
              source={require("../../assets/Bills/electricity.png")}
              style={styles.icon}
            />
            <Text style={styles.label}>Electricity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/Tv")}
          >
            <Image
              source={require("../../assets/Bills/tv.png")}
              style={styles.icon}
            />
            {/* <Text style={styles.label}>TV & Internet</Text> */}
            <Text style={styles.label}>TV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/AirtimeData")}
          >
            <Image
              source={require("../../assets/Bills/phone.png")}
              style={styles.icon}
            />
            <Text style={styles.label}>Airtime & Data</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/ComingSoon")}
          >
            <Image
              source={require("../../assets/Bills/betting.png")}
              style={styles.icon}
            />
            <Text style={styles.label}>Betting</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true} // Enable snapping between slides
        contentContainerStyle={styles.slider}
      >
        {images.map((image, index) => (
          <Image key={index} source={image} style={styles.slideImage} />
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default Bills;

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  headerText: {
    fontSize: 20,
  },
  header: {
    alignItems: "center",
    marginTop: "10%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backbutton: {
    backgroundColor: "#0000ff",
    padding: 5,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  placeholder: {
    width: 60,
  },
  card: {
    backgroundColor: "#fff",
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  mainContent: {
    alignItems: "center",
    marginTop: "20%",
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 20,
  },
  slideImage: {
    resizeMode: "contain",
    width: 300,
    height: 200,
    alignSelf: "center",
  },
  slider: {
    marginTop: "10%",
    flexDirection: "row",
    gap: 10,
  },
});
