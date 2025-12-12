import { View, Text, SafeAreaView, FlatList } from "react-native";
import { useAjoSavingTransactionsHistory } from "@/hooks/useApi";
import LoadingComp from "@/components/Loading";
import Button from "@/components/ui/Button";
import { formatAmount, formatDateAgo } from "@/utils";
import { FontAwesome6 } from "@expo/vector-icons";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export default function AjoSavingsTransactionHistory({ id }: { id: string }) {
  const {
    data: history,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAjoSavingTransactionsHistory(id as string);

  if (isLoading || isFetching) {
    return <LoadingComp visible />;
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-[17px]">Could not fetch transactions</Text>
        <Button text="Retry" full onPress={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(history) => history.id}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <Card>
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-start gap-4">
              <View
                style={{
                  backgroundColor:
                    item.status === "successful"
                      ? "#bcf0da"
                      : item.status === "failed"
                      ? "#fbd5d5"
                      : "transparent",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <FontAwesome6
                  name="inbox"
                  size={24}
                  color={
                    item.status === "successful"
                      ? "#03543f"
                      : item.status === "failed"
                      ? "#9b1c1c"
                      : "black"
                  }
                />
              </View>
              <View>
                <Text className="text-[17px] font-semibold mb-2 max-w-[150px]">
                  {item.message}
                </Text>
                <Text className="text-gray-200">
                  {formatDateAgo(item.created_at)}
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-[17px] font-semibold mb-2 self-end">
                ₦{formatAmount(item.amount)}
              </Text>
              <Badge status={item.status} />
            </View>
          </View>
        </Card>
      )}
    />
  );
}
