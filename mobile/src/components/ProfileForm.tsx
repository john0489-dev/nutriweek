import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Goal, ProfilePreferences } from "../types/menu";
import { GOAL_LABELS } from "../types/menu";

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

interface Props {
  initialValues?: Partial<ProfilePreferences>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: ProfilePreferences) => void;
  /** Mostra o campo de nome (ex: "João", "Maria") — útil quando há múltiplos perfis na casa. */
  showNameField?: boolean;
}

export function ProfileForm({
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
  showNameField = true,
}: Props) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [goal, setGoal] = useState<Goal>(initialValues?.goal ?? "comer_mais_saudavel");
  const [restrictions, setRestrictions] = useState<string[]>(
    initialValues?.restrictions ?? []
  );
  const [allergiesText, setAllergiesText] = useState(
    (initialValues?.allergies ?? []).join(", ")
  );
  const [dislikedText, setDislikedText] = useState(
    (initialValues?.dislikedFoods ?? []).join(", ")
  );
  const [householdSize, setHouseholdSize] = useState(
    String(initialValues?.householdSize ?? 1)
  );
  const [weeklyBudget, setWeeklyBudget] = useState(
    initialValues?.weeklyBudgetBRL ? String(initialValues.weeklyBudgetBRL) : ""
  );

  function toggleRestriction(item: string) {
    setRestrictions((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  }

  function handleSubmit() {
    onSubmit({
      name: name.trim() || "Você",
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
    });
  }

  return (
    <View>
      {showNameField && (
        <>
          <Text style={styles.sectionLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: João, Maria..."
            value={name}
            onChangeText={setName}
          />
        </>
      )}

      <Text style={styles.sectionLabel}>Qual o objetivo?</Text>
      <View style={styles.chipRow}>
        {GOAL_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, goal === option && styles.chipSelected]}
            onPress={() => setGoal(option)}
          >
            <Text style={[styles.chipText, goal === option && styles.chipTextSelected]}>
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
            style={[styles.chip, restrictions.includes(option) && styles.chipSelected]}
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

      <Text style={styles.sectionLabel}>Alimentos que não gosta (separados por vírgula)</Text>
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

      <Text style={styles.sectionLabel}>Orçamento semanal para alimentação (opcional, em R$)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="ex: 250"
        value={weeklyBudget}
        onChangeText={setWeeklyBudget}
      />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.primaryButtonText}>
          {submitting ? "Salvando..." : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  chipSelected: { backgroundColor: "#0F5132", borderColor: "#0F5132" },
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
