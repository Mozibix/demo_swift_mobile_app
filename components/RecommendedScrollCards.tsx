import { StyleSheet, Text, View, FlatList } from "react-native";
import React from "react";

interface DataOffer {
  id: string;
  plan: string;
  amount: string;
  strikedAmount: string;
  status: string;
}

const data: DataOffer[] = [
  {
    id: "1",
    plan: "3GB/2days/50%Off",
    amount: "400.00",
    strikedAmount: "800.00",
    status: "Sold Out",
  },
  {
    id: "2",
    plan: "5GB/3days/30%Off",
    amount: "600.00",
    strikedAmount: "900.00",
    status: "Sold Out",
  },
  {
    id: "3",
    plan: "10GB/7days/40%Off",
    amount: "1200.00",
    strikedAmount: "2000.00",
    status: "Sold Out",
  },
  {
    id: "4",
    plan: "10GB/7days/40%Off",
    amount: "1200.00",
    strikedAmount: "2000.00",
    status: "Available",
  },
  // Add more data items as needed
];

const RecommendedCards: React.FC = () => {
  const renderItem = ({ item }: { item: DataOffer }) => (
    <View style={styles.card}>
      <Text style={styles.plan}>{item.plan}</Text>
      <View style={styles.amountContainer}>
        <Text style={styles.naira}>₦</Text>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text style={styles.strikedAmount}>{item.strikedAmount}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.status,
            {
              backgroundColor:
                item.status === "Available" ? "#0cbc8b" : "#cdb9fb",
            }, // Green for 'Available', purple for others
          ]}
        ></View>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>Recommended Data Offers</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContainer}
      />
    </View>
  );
};

export default RecommendedCards;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 30,
    left: 5,
  },
  card: {
    backgroundColor: "#d9f7f7",
    padding: 10,
    width: 200,
    borderRadius: 15,
    alignItems: "flex-start",
    marginRight: 10,
  },
  plan: {
    fontWeight: "600",
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  naira: {
    fontWeight: "500",
    fontSize: 20,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
  },
  strikedAmount: {
    color: "#666",
    textDecorationLine: "line-through",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  status: {
    height: 8,
    width: 115,
    backgroundColor: "#cdb9fb", // Default color for other statuses
    borderRadius: 15,
    marginRight: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
  flatListContainer: {
    paddingHorizontal: 10, // Optional: for padding on left and right
  },
});
