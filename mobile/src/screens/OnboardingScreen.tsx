import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import type { Goal, UserProfile } from "../types/menu";
import { GOAL_LABELS } from "../types/menu";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const GOAL_OPTIONS: Goal[] = [
  "emagrecer",
  "manter_peso",
  "ganhar_massa",
  "comer_mais_saudavel",
];

const COMMON_RESTRICTIONS = [
  "vegetariano",
  "vegano",
  "sem_gluten",
  "sem_lactose",
  "low_carb",
];

export function OnboardingScreen({ navigation }: Props) {
  const { saveProfile } = useAppContext();

  const [goal, setGoal] = useState<Goal>("comer_mais_saudavel");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [allergiesText, setAllergiesText] = useState("");
  const [dislikedText, setDislikedText] = useState("");
  const [householdSize, setHouseholdSize] = useState("1");
  const [weeklyBudget, setWeeklyBudget] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleRestriction(item: string) {
    setRestrictions((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  }

  async function handleFinish() {
    setSaving(true);
    const profile: UserProfile = {
      goal,
      restrictions,
      allergies: allergiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      dislikedFoods: dislikedText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      householdSize: Math.max(1, parseInt(householdSize, 10) || 1),
      weeklyBudgetBRL: weeklyBudget ? Number(weeklyBudget) : undefined,
    };
    try {
      await saveProfile(profile);
      navigation.replace("MainTabs", { screen: "WeeklyMenu" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Bem-vindo ao NutriWeek</Text>
        <Text style={styles.subtitle}>
          Conte um pouco sobre você para gerarmos cardápios semanais
          otimizados por nutrição e custo.
        </Text>

        <Text style={styles.sectionLabel}>Qual seu objetivo?</Text>
        <View style={styles.chipRow}>
          {GOAL_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[styles.chip, goal === option && styles.chipSelected]}
              onPress={() => setGoal(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  goal === option && styles.chipTextSelected,
                ]}
              >
                {GOAL_LABELS[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Restrições alimentares</Text>
        <View style={styles.chipRow}>
          {COMMON_RESTRICTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.chip,
                restrictions.includes(option) && styles.chipSelected,
              ]}
              onPress={() => toggleRestriction(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  restrictions.includes(option) && styles.chipTextSelected,
                ]}
              >
                {option.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Alergias (separadas por vírgula)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: amendoim, camarão"
          value={allergiesText}
          onChangeText={setAllergiesText}
        />

        <Text style={styles.sectionLabel}>
          Alimentos que não gosta (separados por vírgula)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="ex: quiabo, fígado"
          value={dislikedText}
          onChangeText={setDislikedText}
        />

        <Text style={styles.sectionLabel}>Quantas pessoas na casa?</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={householdSize}
          onChangeText={setHouseholdSize}
        />

        <Text style={styles.sectionLabel}>
          Orçamento semanal para alimentação (opcional, em R$)
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="ex: 250"
          value={weeklyBudget}
          onChangeText={setWeeklyBudget}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={handleFinish}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Salvando..." : "Continuar"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F5132" },
  subtitle: { fontSize: 14, color: "#4B5563", marginTop: 6, marginBottom: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: {
    backgroundColor: "#0F5132",
    borderColor: "#0F5132",
  },
  chipText: { fontSize: 13, color: "#374151" },
  chipTextSelected: { color: "#FFFFFF", fontWeight: "600" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: "#0F5132",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
