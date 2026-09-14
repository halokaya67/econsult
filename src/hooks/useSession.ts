import { useMemo } from "react";
import type { PatientSession } from "@/api/contracts";
import { useDevSettings } from "@/providers/DevSettingsProvider";

// The session would come from authentication; the brief says to fake it and keep it switchable.
const PATIENT = { patientId: "pat-0001", displayName: "Ria de Boer" };

export function useSession(): PatientSession {
  const { settings } = useDevSettings();
  return useMemo(() => ({ ...PATIENT, practiceId: settings.practiceId }), [settings.practiceId]);
}
