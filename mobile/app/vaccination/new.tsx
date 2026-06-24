import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { VaccinationForm } from "@/src/components/VaccinationForm";
import { createAttachment } from "@/src/db/attachments";
import { deriveExpectedDoses } from "@/src/reminders/derive";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { formatDateLong } from "@/src/utils/dates";

export default function NewVaccination() {
  const router = useRouter();
  const { profileId, prefillCode, prefillDose } = useLocalSearchParams<{
    profileId: string;
    prefillCode?: string;
    prefillDose?: string;
  }>();
  const add = useVaccinations((s) => s.add);
  const allVaccinations = useVaccinations((s) => s.vaccinations);

  if (!profileId) {
    return (
      <Screen>
        <Text tone="error">Saknar profileId.</Text>
      </Screen>
    );
  }

  const dose = prefillDose ? parseInt(prefillDose, 10) : undefined;

  return (
    <Screen scroll>
      <VaccinationForm
        profileId={profileId}
        prefillCode={prefillCode}
        prefillDose={Number.isFinite(dose as number) ? dose : undefined}
        allowAttachments
        existingVaccinations={allVaccinations}
        onSubmit={async (input, attachments) => {
          const v = await add(input);
          for (const att of attachments) {
            await createAttachment({
              vaccinationId: v.id,
              kind: att.kind,
              path: att.path,
            });
          }

          // Compute the next expected dose for this same vaccine, if any —
          // helps users understand the series timeline without leaving them
          // wondering "did anything else just happen?".
          const profile = useProfiles
            .getState()
            .profiles.find((p) => p.id === profileId);
          const allVacs = useVaccinations.getState().vaccinations;
          if (profile && profile.remindersEnabled !== false) {
            const upcoming = deriveExpectedDoses(profile, allVacs, new Date());
            const nextSame = upcoming.find((d) => d.code === v.vaccineCode);
            if (nextSame) {
              Alert.alert(
                "Dos registrerad",
                `Nästa dos rekommenderas ${formatDateLong(nextSame.dueDate)}. Påminnelse är inställd.`,
                [{ text: "OK", onPress: () => router.back() }],
              );
              return;
            }
          }
          router.back();
        }}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
