import Button from "@/components/ui/Button";
import { router } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

const AjoContribution = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/payments/3.png")}
        style={styles.image}
      />
      <Text style={styles.text}>Ajo Contribution</Text>
      <View style={styles.listContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/aj4.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Create daily, week, Monthly & yearly Ajo Contribution
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/bar.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Add and Manage Members to your Ajo Contribution
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/icons/card.png")}
            style={styles.icon}
          />
          <Text style={styles.listItem}>
            Create Personal or Business Ajo Contribution Account
          </Text>
        </View>
      </View>

      <Button
        text="Start Contribution"
        full
        onPress={() => router.push("/AjoContributionDashboard")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  text: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "700",
    color: "#333",
  },
  listContainer: {
    width: "100%",
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  listItem: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
  icon: {
    width: 35,
    height: 35,
  },
  button: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default AjoContribution;
