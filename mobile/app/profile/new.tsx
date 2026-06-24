import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { ProfileForm } from "@/src/components/ProfileForm";
import { Screen } from "@/src/components/Screen";
import { shouldOfferHistoryImport } from "@/src/onboarding/historicalDoses";
import { useProfiles } from "@/src/stores/profilesStore";
import {
  hasNotificationPermission,
  requestNotificationPermission,
  rescheduleAll,
} from "@/src/reminders/notifications";
import { useVaccinations } from "@/src/stores/vaccinationsStore";

export default function NewProfile() {
  const router = useRouter();
  const add = useProfiles((s) => s.add);
  const select = useProfiles((s) => s.select);
  const isFirstProfile = useProfiles((s) => s.profiles.length === 0);

  function offerNotificationPrimer(onDone: () => void) {
    Alert.alert(
      "Få påminnelser om nästa dos?",
      "Vaccinloggen kan skicka en lokal notis innan en dos ska tas. Inget skickas till någon server — påminnelserna schemaläggs på din enhet. Du kan stänga av dem när som helst.",
      [
        { text: "Inte nu", style: "cancel", onPress: onDone },
        {
          text: "Slå på",
          onPress: async () => {
            const granted = await requestNotificationPermission();
            if (granted) {
              const profiles = useProfiles.getState().profiles;
              const vaccinations = useVaccinations.getState().vaccinations;
              await rescheduleAll(profiles, vaccinations);
            }
            onDone();
          },
        },
      ],
    );
  }

  return (
    <Screen scroll>
      <ProfileForm
        onSubmit={async (input) => {
          const wasFirst = isFirstProfile;
          const profile = await add(input);
          select(profile.id);

          const next = () => {
            if (shouldOfferHistoryImport(profile)) {
              router.replace(`/profile/${profile.id}/history-prompt`);
            } else {
              router.back();
            }
          };

          if (wasFirst && !(await hasNotificationPermission())) {
            offerNotificationPrimer(next);
          } else {
            next();
          }
        }}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
