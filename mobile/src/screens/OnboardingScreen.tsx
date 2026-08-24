import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import { ProfileForm } from "../components/ProfileForm";
import type { ProfilePreferences } from "../types/menu";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export function OnboardingScreen({ navigation }: Props) {
  const { createProfile } = useAppContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ProfilePreferences) {
    setSubmitting(true);
    setError(null);
    try {
      await createProfile(values);
      navigation.replace("MainTabs", { screen: "WeeklyMenu" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSubmitting(false);
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
          otimizados por nutrição e custo. Depois você pode adicionar outras
          pessoas da casa com preferências diferentes.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <ProfileForm
          submitLabel="Continuar"
          submitting={submitting}
          onSubmit={handleSubmit}
          showNameField
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F5132" },
  subtitle: { fontSize: 14, color: "#4B5563", marginTop: 6, marginBottom: 12 },
  error: {
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
});
