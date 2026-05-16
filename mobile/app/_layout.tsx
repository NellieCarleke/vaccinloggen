import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";

import { runMigrations } from "@/src/db/migrations";
import { rescheduleAll } from "@/src/reminders/notifications";
import { bootstrapSchedules } from "@/src/schedules/remote-refresh";
import { useProfiles } from "@/src/stores/profilesStore";
import { useTrips } from "@/src/stores/tripsStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { useTheme } from "@/src/theme/useTheme";
import { LockGate } from "@/src/components/LockGate";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* if splash already hid, ignore */
});

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const profiles = useProfiles((s) => s.profiles);
  const vaccinations = useVaccinations((s) => s.vaccinations);
  const profilesLoaded = useProfiles((s) => s.loaded);
  const vaccinationsLoaded = useVaccinations((s) => s.loaded);
  const loadProfiles = useProfiles((s) => s.load);
  const loadVaccinations = useVaccinations((s) => s.load);
  const loadTrips = useTrips((s) => s.load);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Bootstrap schedules FIRST — applies any cached remote refresh so
        // derive logic and historical-doses see the latest version. Also
        // kicks off a background fetch for next launch's cache.
        await bootstrapSchedules();
        await runMigrations();
        await Promise.all([loadProfiles(), loadVaccinations(), loadTrips()]);
      } finally {
        if (!cancelled) {
          setBootstrapped(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfiles, loadVaccinations, loadTrips]);

  // Reschedule local notifications whenever the user's data changes.
  // Debounced via the dependency array — only runs when references change.
  useEffect(() => {
    if (!profilesLoaded || !vaccinationsLoaded) return;
    void rescheduleAll(profiles, vaccinations);
  }, [profiles, vaccinations, profilesLoaded, vaccinationsLoaded]);

  if (!bootstrapped) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LockGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
            headerBackTitle: "Hem",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ headerShown: false, title: "Hem" }}
          />
          <Stack.Screen
            name="profile/new"
            options={{ title: "Ny profil", presentation: "modal" }}
          />
          <Stack.Screen
            name="profile/[id]"
            options={{ title: "" }}
          />
          <Stack.Screen
            name="profile/[id]/edit"
            options={{ title: "Redigera profil", presentation: "modal" }}
          />
          <Stack.Screen
            name="profile/[id]/history-prompt"
            options={{ title: "Vaccinationshistorik", presentation: "modal" }}
          />
          <Stack.Screen
            name="vaccination/new"
            options={{ title: "Ny vaccination", presentation: "modal" }}
          />
          <Stack.Screen
            name="vaccination/[id]"
            options={{ title: "" }}
          />
          <Stack.Screen
            name="vaccination/[id]/edit"
            options={{ title: "Redigera vaccination", presentation: "modal" }}
          />
          <Stack.Screen
            name="trip/new"
            options={{ title: "Ny resa", presentation: "modal" }}
          />
          <Stack.Screen
            name="trip/[id]"
            options={{ title: "" }}
          />
          <Stack.Screen
            name="profile/[id]/share"
            options={{ title: "Dela", presentation: "modal" }}
          />
          <Stack.Screen
            name="import"
            options={{ title: "Importera", presentation: "modal" }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: "Inställningar" }}
          />
        </Stack>
      </LockGate>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
