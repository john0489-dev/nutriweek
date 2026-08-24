import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppContext } from "../context/AppContext";

export function PantryScreen() {
  const { pantryItems, addPantryItem, removePantryItem, regenerateMenu, isGeneratingMenu } =
    useAppContext();
  const [input, setInput] = useState("");

  function handleAdd() {
    if (!input.trim()) return;
    addPantryItem(input);
    setInput("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sua despensa</Text>
      <Text style={styles.subtitle}>
        Adicione os ingredientes que você já tem em casa. A IA vai priorizar
        eles ao montar (ou reotimizar) seu cardápio.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="ex: arroz, feijão, frango, tomate"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </Pressable>
      </View>

      <FlatList
        data={pantryItems}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum ingrediente adicionado ainda.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.pantryRow}>
            <Text style={styles.pantryItem}>{item}</Text>
            <Pressable onPress={() => removePantryItem(item)}>
              <Text style={styles.removeText}>remover</Text>
            </Pressable>
          </View>
        )}
      />

      {pantryItems.length > 0 && (
        <Pressable
          style={styles.regenerateButton}
          onPress={() => regenerateMenu("Priorize fortemente os itens da despensa.")}
          disabled={isGeneratingMenu}
        >
          <Text style={styles.regenerateButtonText}>
            {isGeneratingMenu
              ? "Otimizando cardápio..."
              : "Reotimizar cardápio com a despensa"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132" },
  subtitle: { fontSize: 13, color: "#4B5563", marginTop: 4, marginBottom: 16 },
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#0F5132",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  list: { paddingBottom: 12 },
  pantryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  pantryItem: { fontSize: 14, color: "#111827" },
  removeText: { fontSize: 12, color: "#991B1B", fontWeight: "600" },
  emptyText: { color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 20 },
  regenerateButton: {
    backgroundColor: "#0F5132",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  regenerateButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
