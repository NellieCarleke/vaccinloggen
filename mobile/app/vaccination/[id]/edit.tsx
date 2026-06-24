import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { VaccinationForm } from "@/src/components/VaccinationForm";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { t } from "@/src/i18n/sv";

export default function EditVaccination() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vaccination = useVaccinations((s) =>
    s.vaccinations.find((v) => v.id === id),
  );
  const allVaccinations = useVaccinations((s) => s.vaccinations);
  const update = useVaccinations((s) => s.update);
  const remove = useVaccinations((s) => s.remove);

  if (!vaccination) {
    return (
      <Screen>
        <Text tone="muted">Vaccinationen hittades inte.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <VaccinationForm
        profileId={vaccination.profileId}
        initial={vaccination}
        existingVaccinations={allVaccinations}
        onSubmit={async (input) => {
          await update(vaccination.id, input);
          router.back();
        }}
        // Edit mode: existing attachments are managed in the detail view.
        onCancel={() => router.back()}
        onDelete={() => {
          Alert.alert(
            t("vaccination.deleteConfirmTitle"),
            t("vaccination.deleteConfirmBody"),
            [
              { text: t("profile.cancel"), style: "cancel" },
              {
                text: t("profile.delete"),
                style: "destructive",
                onPress: async () => {
                  await remove(vaccination.id);
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
