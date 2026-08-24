import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "./types";
import { WeeklyMenuScreen } from "../screens/WeeklyMenuScreen";
import { PantryScreen } from "../screens/PantryScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  WeeklyMenu: "🍽️",
  Pantry: "🧺",
  Favorites: "❤️",
  History: "🕓",
  Profile: "👤",
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0F5132",
        tabBarIcon: () => (
          <Text style={{ fontSize: 16 }}>
            {TAB_ICONS[route.name as keyof MainTabParamList]}
          </Text>
        ),
        tabBarLabelStyle: { fontSize: 10 },
      })}
    >
      <Tab.Screen name="WeeklyMenu" component={WeeklyMenuScreen} options={{ title: "Cardápio" }} />
      <Tab.Screen name="Pantry" component={PantryScreen} options={{ title: "Despensa" }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favoritos" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "Histórico" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
}
