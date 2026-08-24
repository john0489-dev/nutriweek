import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAppContext } from "../context/AppContext";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { MealDetailScreen } from "../screens/MealDetailScreen";
import { MainTabNavigator } from "./MainTabNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoadingStorage, profile } = useAppContext();

  if (isLoadingStorage) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#0F5132" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={profile ? "MainTabs" : "Onboarding"}
      screenOptions={{ headerTintColor: "#0F5132" }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MealDetail"
        component={MealDetailScreen}
        options={{ title: "Detalhes da refeição" }}
      />
    </Stack.Navigator>
  );
}
