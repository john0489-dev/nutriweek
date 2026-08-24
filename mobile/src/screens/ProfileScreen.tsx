import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { GOAL_LABELS } from "../types/menu";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { profiles, activeProfileId, setActiveProfileId, removeProfile } = useAppContext();
  const { user, logout } = useAuth();

  function confirmDelete(id: string, name: string) {
    if (profiles.length <= 1) {
      Alert.alert("Não é possível excluir", "Você precisa manter ao menos um perfil.");
      return;
    }
    Alert.alert("Excluir perfil", `Excluir o perfil de ${name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => removeProfile(id).catch((err) => Alert.alert("Erro", err.message)),
      },
    ]);
  }

  function confirmLogout() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfis da casa</Text>
      {user && <Text style={styles.accountEmail}>Conta: {user.email}</Text>}

      {profiles.map((profile) => (
        <Pressable
          key={profile.id}
          style={[styles.card, profile.id === activeProfileId && styles.cardActive]}
          onPress={() => setActiveProfileId(profile.id)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>
              {profile.name} {profile.id === activeProfileId ? "· ativo" : ""}
            </Text>
            {profile.isPrimary && <Text style={styles.primaryBadge}>principal</Text>}
          </View>
          <Text style={styles.cardGoal}>{GOAL_LABELS[profile.goal]}</Text>
          <Text style={styles.cardDetail}>
            {profile.restrictions.length ? profile.restrictions.join(", ") : "sem restrições"}
          </Text>
          <View style={styles.cardActions}>
            <Pressable
              onPress={() => navigation.navigate("ProfileForm", { profileId: profile.id })}
            >
              <Text style={styles.actionText}>Editar</Text>
            </Pressable>
            <Pressable onPress={() => confirmDelete(profile.id, profile.name)}>
              <Text style={styles.actionTextDanger}>Excluir</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}

      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate("ProfileForm", {})}
      >
        <Text style={styles.addButtonText}>+ Adicionar pessoa da casa</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={confirmLogout}>
        <Text style={styles.logoutButtonText}>Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132", marginBottom: 4 },
  accountEmail: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardActive: { borderColor: "#0F5132" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  primaryBadge: {
    fontSize: 11,
    color: "#0F5132",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: "600",
  },
  cardGoal: { fontSize: 13, color: "#374151", marginTop: 4 },
  cardDetail: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 16, marginTop: 10 },
  actionText: { fontSize: 13, color: "#0F5132", fontWeight: "600" },
  actionTextDanger: { fontSize: 13, color: "#991B1B", fontWeight: "600" },
  addButton: {
    borderWidth: 1,
    borderColor: "#0F5132",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  addButtonText: { color: "#0F5132", fontWeight: "700", fontSize: 14 },
  logoutButton: { marginTop: 24, alignItems: "center" },
  logoutButtonText: { color: "#991B1B", fontWeight: "600", fontSize: 13 },
});
