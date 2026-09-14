import type {
  CareTeamMember,
  CareTeamRole,
  PracticeEConsultConfig,
  Question,
} from "@/api/contracts";
import { devWarn } from "@/lib/devWarn";

export type Recipient = CareTeamMember;

// The shape the recipient screens narrow on; it lives with the helpers that read it rather than
// with the hook that happens to produce it.
export type RecipientsResult =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; recipients: Recipient[]; questions: Question[] };

export const UNKNOWN_RECIPIENT = "your practice";

const ROLE_LABELS: Record<CareTeamRole, string> = {
  gp: "GP",
  nurse: "Practice nurse",
  assistant: "Practice assistant",
  other: "Care team member",
};

export function roleLabel(role: CareTeamRole): string {
  return ROLE_LABELS[role];
}

export function joinRecipients(
  config: PracticeEConsultConfig,
  careTeam: CareTeamMember[],
): Recipient[] {
  const byId = new Map(careTeam.map((member) => [member.id, member]));
  return config.recipientIds.flatMap((id) => {
    const member = byId.get(id);
    if (member) return [member];
    devWarn(`Recipient ${id} is not in the care team of ${config.practiceId}`);
    return [];
  });
}

export function recipientNameFor(result: RecipientsResult, recipientId: string | null): string {
  if (result.status !== "ready") return UNKNOWN_RECIPIENT;
  return result.recipients.find((r) => r.id === recipientId)?.displayName ?? UNKNOWN_RECIPIENT;
}
