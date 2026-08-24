import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { MEAL_TYPE_LABELS } from "../types/menu";

type Props = NativeStackScreenProps<RootStackParamList, "MealDetail">;

export function MealDetailScreen({ route }: Props) {
  const { dayLabel, meal } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.day}>
        {dayLabel} · {MEAL_TYPE_LABELS[meal.type]}
      </Text>
      <Text style={styles.title}>{meal.name}</Text>
      <Text style={styles.description}>{meal.description}</Text>

      <View style={styles.macroRow}>
        <MacroPill label="kcal" value={Math.round(meal.calories)} />
        <MacroPill label="Proteína" value={`${Math.round(meal.proteinG)}g`} />
        <MacroPill label="Carbo" value={`${Math.round(meal.carbsG)}g`} />
        <MacroPill label="Gordura" value={`${Math.round(meal.fatG)}g`} />
      </View>

      <InfoRow label="Tempo de preparo" value={`${meal.prepTimeMinutes} min`} />
      <InfoRow
        label="Custo estimado"
        value={`R$ ${meal.estimatedCostBRL.toFixed(2)}`}
      />

      <Text style={styles.sectionTitle}>Ingredientes</Text>
      {meal.ingredients.map((ing, i) => (
        <Text key={i} style={styles.listItem}>
          • {ing.quantity} de {ing.name}
          {meal.usesPantryItems.includes(ing.name) ? "  (da sua despensa)" : ""}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Modo de preparo</Text>
      {meal.instructions.map((step, i) => (
        <Text key={i} style={styles.listItem}>
          {i + 1}. {step}
        </Text>
      ))}
    </ScrollView>
  );
}

function MacroPill({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.macroPill}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 20, paddingBottom: 40 },
  day: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F5132",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 8 },
  description: { fontSize: 14, color: "#4B5563", marginBottom: 16 },
  macroRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  macroPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    flex: 1,
  },
  macroValue: { fontSize: 15, fontWeight: "800", color: "#0F5132" },
  macroLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 8,
  },
  listItem: { fontSize: 14, color: "#374151", marginBottom: 6, lineHeight: 20 },
});
