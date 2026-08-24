import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import { ProfileForm } from "../components/ProfileForm";
import type { ProfilePreferences } from "../types/menu";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileForm">;

export function ProfileFormScreen({ route, navigation }: Props) {
  const { profileId } = route.params ?? {};
  const { profiles, createProfile, editProfile } = useAppContext();
  const existing = profiles.find((p) => p.id === profileId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ProfilePreferences) {
    setSubmitting(true);
    setError(null);
    try {
      if (existing) {
        await editProfile(existing.id, values);
      } else {
        await createProfile(values);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{existing ? "Editar perfil" : "Novo perfil"}</Text>
      <Text style={styles.subtitle}>
        {existing
          ? "Atualize as preferências dessa pessoa."
          : "Adicione outra pessoa da casa com objetivo e restrições próprios."}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <ProfileForm
        initialValues={existing}
        submitLabel={existing ? "Salvar alterações" : "Criar perfil"}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132" },
  subtitle: { fontSize: 13, color: "#4B5563", marginTop: 4, marginBottom: 8 },
  error: {
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
});
