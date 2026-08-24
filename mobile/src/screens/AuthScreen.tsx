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
import { useAuth } from "../context/AuthContext";

export function AuthScreen() {
  const { login, register, isSubmitting, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    clearAuthError();
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch {
      // erro já fica exposto via authError
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>NutriWeek</Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Entre para ver seus cardápios."
            : "Crie sua conta para começar."}
        </Text>

        <Text style={styles.sectionLabel}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="voce@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.sectionLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {authError && <Text style={styles.error}>{authError}</Text>}

        <Pressable
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={isSubmitting || !email || !password}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.switchModeButton}
          onPress={() => {
            clearAuthError();
            setMode((m) => (m === "login" ? "register" : "login"));
          }}
        >
          <Text style={styles.switchModeText}>
            {mode === "login"
              ? "Não tem conta? Criar uma agora"
              : "Já tem conta? Entrar"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "800", color: "#0F5132", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  error: {
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#0F5132",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  switchModeButton: { marginTop: 18, alignItems: "center" },
  switchModeText: { color: "#0F5132", fontWeight: "600", fontSize: 13 },
});
