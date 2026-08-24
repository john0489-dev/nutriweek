import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Meal } from "../types/menu";
import { MEAL_TYPE_LABELS } from "../types/menu";

interface Props {
  meal: Meal;
  onPress: () => void;
}

export function MealCard({ meal, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.mealType}>{MEAL_TYPE_LABELS[meal.type]}</Text>
        <Text style={styles.cost}>R$ {meal.estimatedCostBRL.toFixed(2)}</Text>
      </View>
      <Text style={styles.name}>{meal.name}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {meal.description}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.macro}>{Math.round(meal.calories)} kcal</Text>
        <Text style={styles.macro}>P {Math.round(meal.proteinG)}g</Text>
        <Text style={styles.macro}>C {Math.round(meal.carbsG)}g</Text>
        <Text style={styles.macro}>G {Math.round(meal.fatG)}g</Text>
        <Text style={styles.macro}>⏱ {meal.prepTimeMinutes}min</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mealType: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F5132",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cost: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  macro: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
});
