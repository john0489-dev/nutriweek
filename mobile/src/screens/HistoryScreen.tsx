import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "History">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HistoryScreen({ navigation }: Props) {
  const { history, isLoadingHistory } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de cardápios</Text>
      <Text style={styles.subtitle}>Cardápios gerados anteriormente, do mais recente ao mais antigo.</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        refreshing={isLoadingHistory}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum cardápio gerado ainda. Vá na aba Cardápio e toque em "Gerar cardápio".
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("HistoryDetail", { historyId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.cardProfile}>{item.profileName}</Text>
            </View>
            <Text style={styles.cardSummary} numberOfLines={2}>
              {item.summary}
            </Text>
            <View style={styles.cardMetrics}>
              <Text style={styles.metric}>💰 R$ {item.estimatedWeeklyCostBRL.toFixed(2)}</Text>
              <Text style={styles.metric}>🔥 {Math.round(item.avgDailyCalories)} kcal/dia</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132" },
  subtitle: { fontSize: 13, color: "#4B5563", marginTop: 4, marginBottom: 16 },
  list: { paddingBottom: 24 },
  emptyText: { color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardDate: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  cardProfile: { fontSize: 12, color: "#0F5132", fontWeight: "700" },
  cardSummary: { fontSize: 13, color: "#374151", marginTop: 6, marginBottom: 8 },
  cardMetrics: { flexDirection: "row", gap: 14 },
  metric: { fontSize: 12, color: "#111827", fontWeight: "600" },
});
