import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import { MealCard } from "../components/MealCard";
import type { MenuHistoryDetail } from "../types/menu";

type Props = NativeStackScreenProps<RootStackParamList, "HistoryDetail">;

export function HistoryDetailScreen({ route, navigation }: Props) {
  const { historyId } = route.params;
  const { loadHistoryDetail } = useAppContext();
  const [detail, setDetail] = useState<MenuHistoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    loadHistoryDetail(historyId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."));
  }, [historyId, loadHistoryDetail]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F5132" />
      </View>
    );
  }

  const selectedDay = detail.response.days[selectedDayIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.profileLabel}>Perfil: {detail.profileName}</Text>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>{detail.response.summary}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryMetric}>
            💰 R$ {detail.response.estimatedWeeklyCostBRL.toFixed(2)}/semana
          </Text>
          <Text style={styles.summaryMetric}>
            🔥 {Math.round(detail.response.avgDailyCalories)} kcal/dia
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabs}
        contentContainerStyle={{ gap: 8 }}
      >
        {detail.response.days.map((day, index) => (
          <Pressable
            key={day.dayLabel}
            style={[styles.dayTab, index === selectedDayIndex && styles.dayTabSelected]}
            onPress={() => setSelectedDayIndex(index)}
          >
            <Text
              style={[
                styles.dayTabText,
                index === selectedDayIndex && styles.dayTabTextSelected,
              ]}
            >
              {day.dayLabel}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.mealsList}>
        {selectedDay?.meals.map((meal, i) => (
          <MealCard
            key={`${meal.type}-${i}`}
            meal={meal}
            onPress={() =>
              navigation.navigate("MealDetail", { dayLabel: selectedDay.dayLabel, meal })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  error: { color: "#991B1B", fontSize: 14, textAlign: "center" },
  profileLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 8 },
  summaryBox: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 12 },
  summaryText: { fontSize: 13, color: "#374151", marginBottom: 8 },
  summaryRow: { flexDirection: "row", gap: 16 },
  summaryMetric: { fontSize: 13, fontWeight: "700", color: "#0F5132" },
  dayTabs: { flexGrow: 0, marginBottom: 12 },
  dayTab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#E5E7EB" },
  dayTabSelected: { backgroundColor: "#0F5132" },
  dayTabText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  dayTabTextSelected: { color: "#FFFFFF" },
  mealsList: { paddingBottom: 24 },
});
