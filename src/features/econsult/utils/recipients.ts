import type { UseQueryResult } from "@tanstack/react-query";
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

type Results = [UseQueryResult<PracticeEConsultConfig>, UseQueryResult<CareTeamMember[]>];

// A stale list beats no list, so cached data wins over a failed refetch. The error card is for a
// first load that never landed: a read that failed with nothing to show.
export function combineRecipients([config, team]: Results): RecipientsResult {
  const hasConfigFailed = config.isError && !config.data;
  const hasTeamFailed = team.isError && !team.data;
  if (hasConfigFailed || hasTeamFailed) {
    return {
      status: "error",
      retry: () => {
        if (config.isError) void config.refetch();
        if (team.isError) void team.refetch();
      },
    };
  }
  if (!config.data || !team.data) return { status: "loading" };
  const recipients = joinRecipients(config.data, team.data);
  if (recipients.length === 0) return { status: "empty" };
  return { status: "ready", recipients, questions: config.data.questions };
}

export function recipientNameFor(result: RecipientsResult, recipientId: string | null): string {
  if (result.status !== "ready") return UNKNOWN_RECIPIENT;
  return result.recipients.find((r) => r.id === recipientId)?.displayName ?? UNKNOWN_RECIPIENT;
}
