import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useAppContext } from "../context/AppContext";
import { MealCard } from "../components/MealCard";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Favorites">,
  NativeStackScreenProps<RootStackParamList>
>;

export function FavoritesScreen({ navigation }: Props) {
  const { favorites, isLoadingFavorites } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Refeições favoritas</Text>
      <Text style={styles.subtitle}>
        Pratos que você marcou com ❤ — a IA prioriza esses sabores em cardápios futuros.
      </Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        refreshing={isLoadingFavorites}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhuma refeição favoritada ainda. Abra o detalhe de uma refeição e toque em ❤.
          </Text>
        }
        renderItem={({ item }) => (
          <MealCard
            meal={item.meal}
            onPress={() =>
              navigation.navigate("MealDetail", { dayLabel: "Favorito", meal: item.meal })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F5132" },
  subtitle: { fontSize: 13, color: "#4B5563", marginTop: 4, marginBottom: 16 },
  list: { paddingBottom: 24 },
  emptyText: { color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 40 },
});
