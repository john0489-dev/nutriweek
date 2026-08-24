import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Meal } from "../types/menu";

export type MainTabParamList = {
  WeeklyMenu: undefined;
  Pantry: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  MealDetail: { dayLabel: string; meal: Meal };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
