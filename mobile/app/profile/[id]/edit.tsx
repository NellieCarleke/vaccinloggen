import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ProfileForm } from "@/src/components/ProfileForm";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { useProfiles } from "@/src/stores/profilesStore";
import { t } from "@/src/i18n/sv";

export default function EditProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfiles((s) => s.profiles.find((p) => p.id === id));
  const update = useProfiles((s) => s.update);
  const remove = useProfiles((s) => s.remove);

  if (!profile) {
    return (
      <Screen>
        <Text tone="muted">Profilen hittades inte.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ProfileForm
        initial={profile}
        onSubmit={async (input) => {
          await update(profile.id, input);
          router.back();
        }}
        onCancel={() => router.back()}
        onDelete={() => {
          Alert.alert(
            t("profile.delete"),
            t("profile.deleteConfirm"),
            [
              { text: t("profile.cancel"), style: "cancel" },
              {
                text: t("profile.delete"),
                style: "destructive",
                onPress: async () => {
                  await remove(profile.id);
                  // Pop twice to leave the detail page that no longer exists.
                  router.dismissAll();
                },
              },
            ],
          );
        }}
      />
    </Screen>
  );
}
