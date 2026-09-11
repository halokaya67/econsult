import { Stack } from "expo-router";
import type { DraftState } from "@/features/econsult/draft";
import { DraftProvider } from "@/features/econsult/DraftProvider";

// The real EConsultLayout mounts its own DraftProvider, which would shadow a test draft, so router
// tests register this layout under "econsult/_layout" with the preset draft instead. It declares no
// screens, so any partial route map renders without expo-router warnings; header options are not under test.
export function flowLayoutWith(draft?: DraftState) {
  return function TestFlowLayout() {
    return (
      <DraftProvider initial={draft}>
        <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }} />
      </DraftProvider>
    );
  };
}
