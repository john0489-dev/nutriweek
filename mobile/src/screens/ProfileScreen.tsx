import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../context/AppContext";
import { GOAL_LABELS } from "../types/menu";

export function ProfileScreen() {
  const { profile } = useAppContext();

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Nenhum perfil salvo ainda. Complete o onboarding primeiro.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Seu perfil</Text>

      <Field label="Objetivo" value={GOAL_LABELS[profile.goal]} />
      <Field
        label="Restrições"
        value={profile.restrictions.length ? profile.restrictions.join(", ") : "nenhuma"}
      />
      <Field
        label="Alergias"
        value={profile.allergies.length ? profile.allergies.join(", ") : "nenhuma"}
      />
      <Field
        label="Não gosta de"
        value={profile.dislikedFoods.length ? profile.dislikedFoods.join(", ") : "nada informado"}
      />
      <Field label="Pessoas na casa" value={String(profile.householdSize)} />
      <Field
        label="Orçamento semanal"
        value={
          profile.weeklyBudgetBRL
            ? `R$ ${profile.weeklyBudgetBRL.toFixed(2)}`
            : "não informado"
        }
      />

      <Text style={styles.note}>
        Em uma próxima versão, esta tela vai permitir editar o perfil
        diretamente (por ora, edite pelo onboarding).
      </Text>
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132", marginBottom: 16 },
  field: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  fieldLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  fieldValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
  note: { fontSize: 12, color: "#9CA3AF", marginTop: 16, fontStyle: "italic" },
  emptyText: { padding: 20, color: "#6B7280", textAlign: "center" },
});
