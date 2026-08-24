import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import { AuthScreen } from "../screens/AuthScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { MealDetailScreen } from "../screens/MealDetailScreen";
import { ProfileFormScreen } from "../screens/ProfileFormScreen";
import { HistoryDetailScreen } from "../screens/HistoryDetailScreen";
import { MainTabNavigator } from "./MainTabNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#0F5132" />
    </View>
  );
}

export function RootNavigator() {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const { isLoadingProfiles, profiles } = useAppContext();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (isLoadingProfiles) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={profiles.length ? "MainTabs" : "Onboarding"}
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
      <Stack.Screen
        name="ProfileForm"
        component={ProfileFormScreen}
        options={{ title: "Perfil" }}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={{ title: "Cardápio anterior" }}
      />
    </Stack.Navigator>
  );
}
