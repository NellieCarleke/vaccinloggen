import { useRouter } from "expo-router";
import { ProfileForm } from "@/src/components/ProfileForm";
import { Screen } from "@/src/components/Screen";
import { shouldOfferHistoryImport } from "@/src/onboarding/historicalDoses";
import { useProfiles } from "@/src/stores/profilesStore";

export default function NewProfile() {
  const router = useRouter();
  const add = useProfiles((s) => s.add);
  const select = useProfiles((s) => s.select);

  return (
    <Screen scroll>
      <ProfileForm
        onSubmit={async (input) => {
          const profile = await add(input);
          select(profile.id);
          if (shouldOfferHistoryImport(profile)) {
            // Replace this modal with the history prompt so back goes to home.
            router.replace(`/profile/${profile.id}/history-prompt`);
          } else {
            router.back();
          }
        }}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
