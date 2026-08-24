import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import { MealCard } from "../components/MealCard";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "WeeklyMenu">,
  NativeStackScreenProps<RootStackParamList>
>;

export function WeeklyMenuScreen({ navigation }: Props) {
  const { activeProfile, menu, isGeneratingMenu, menuError, regenerateMenu } =
    useAppContext();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const selectedDay = menu?.days[selectedDayIndex];

  async function handleShareMenu() {
    if (!menu) return;
    const shoppingListText = menu.shoppingList
      .map((i) => `- ${i.quantity} de ${i.name}`)
      .join("\n");
    try {
      await Share.share({
        message: `Cardápio da semana (NutriWeek)\n\n${menu.summary}\n\nCusto estimado: R$ ${menu.estimatedWeeklyCostBRL.toFixed(2)}\nMédia: ${Math.round(menu.avgDailyCalories)} kcal/dia\n\nLista de compras:\n${shoppingListText}`,
      });
    } catch {
      // usuário cancelou
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cardápio da semana</Text>
          {activeProfile && <Text style={styles.profileLabel}>Perfil: {activeProfile.name}</Text>}
        </View>
        <Pressable
          style={styles.generateButton}
          onPress={() => regenerateMenu()}
          disabled={isGeneratingMenu}
        >
          {isGeneratingMenu ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.generateButtonText}>
              {menu ? "Gerar novamente" : "Gerar cardápio"}
            </Text>
          )}
        </Pressable>
      </View>

      {!activeProfile && (
        <Text style={styles.warning}>
          Complete seu perfil para gerar um cardápio personalizado.
        </Text>
      )}

      {menuError && <Text style={styles.error}>{menuError}</Text>}

      {menu && (
        <>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{menu.summary}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryMetric}>
                💰 R$ {menu.estimatedWeeklyCostBRL.toFixed(2)}/semana
              </Text>
              <Text style={styles.summaryMetric}>
                🔥 {Math.round(menu.avgDailyCalories)} kcal/dia
              </Text>
            </View>
            <Pressable style={styles.shareLink} onPress={handleShareMenu}>
              <Text style={styles.shareLinkText}>Compartilhar cardápio e lista de compras</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabs}
            contentContainerStyle={{ gap: 8 }}
          >
            {menu.days.map((day, index) => (
              <Pressable
                key={day.dayLabel}
                style={[
                  styles.dayTab,
                  index === selectedDayIndex && styles.dayTabSelected,
                ]}
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
                  navigation.navigate("MealDetail", {
                    dayLabel: selectedDay.dayLabel,
                    meal,
                    fromCurrentMenu: true,
                  })
                }
              />
            ))}
          </ScrollView>
        </>
      )}

      {!menu && !isGeneratingMenu && activeProfile && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Você ainda não tem um cardápio gerado. Toque em "Gerar cardápio"
            para que a IA monte sua semana com base no seu perfil e na sua
            despensa.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132" },
  profileLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  generateButton: {
    backgroundColor: "#0F5132",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 130,
    alignItems: "center",
  },
  generateButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  warning: {
    color: "#92400E",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  error: {
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  summaryBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  summaryText: { fontSize: 13, color: "#374151", marginBottom: 8 },
  summaryRow: { flexDirection: "row", gap: 16 },
  summaryMetric: { fontSize: 13, fontWeight: "700", color: "#0F5132" },
  shareLink: { marginTop: 10 },
  shareLinkText: { fontSize: 12, color: "#0F5132", fontWeight: "600" },
  dayTabs: { flexGrow: 0, marginBottom: 12 },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  dayTabSelected: { backgroundColor: "#0F5132" },
  dayTabText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  dayTabTextSelected: { color: "#FFFFFF" },
  mealsList: { paddingBottom: 24 },
  emptyState: { paddingVertical: 40, alignItems: "center" },
  emptyStateText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    paddingHorizontal: 20,
  },
});
