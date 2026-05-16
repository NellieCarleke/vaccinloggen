import { useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { TripForm } from "@/src/components/TripForm";
import { useTrips } from "@/src/stores/tripsStore";

export default function NewTrip() {
  const router = useRouter();
  const add = useTrips((s) => s.add);

  return (
    <Screen scroll>
      <TripForm
        onSubmit={async (input) => {
          const trip = await add(input);
          // Replace modal with detail (so back goes to home, not the form)
          router.dismissAll();
          router.push(`/trip/${trip.id}`);
        }}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
