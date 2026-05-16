import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useProfiles } from "../stores/profilesStore";
import { useTheme } from "../theme/useTheme";
import { radii, spacing } from "../theme/tokens";
import { Avatar } from "./Avatar";
import { Text } from "./Text";

export function FamilyBar() {
  const { colors } = useTheme();
  const router = useRouter();
  const profiles = useProfiles((s) => s.profiles);
  const selectedId = useProfiles((s) => s.selectedId);
  const select = useProfiles((s) => s.select);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {profiles.map((p) => {
        const active = p.id === selectedId;
        return (
          <Pressable
            key={p.id}
            onPress={() => select(p.id)}
            style={styles.item}
          >
            <View
              style={[
                styles.avatarRing,
                {
                  borderColor: active ? colors.primary : "transparent",
                },
              ]}
            >
              <Avatar name={p.name} imageUri={p.avatarPath} size={56} />
            </View>
            <Text
              variant="caption"
              tone={active ? "accent" : "secondary"}
              numberOfLines={1}
              style={styles.name}
            >
              {p.name}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => router.push("/profile/new")}
        style={styles.item}
      >
        <View
          style={[
            styles.addBtn,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
          ]}
        >
          <Plus size={24} color={colors.textSecondary} />
        </View>
        <Text variant="caption" tone="muted" style={styles.name}>
          Lägg till
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  item: { alignItems: "center", width: 72 },
  avatarRing: {
    borderRadius: radii.pill,
    borderWidth: 3,
    padding: 2,
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  name: { marginTop: spacing.xs, maxWidth: 70, textAlign: "center" },
});
