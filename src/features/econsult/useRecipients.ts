import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type { CareTeamMember, PracticeEConsultConfig, Question } from "@/api/contracts";
import { useServices, useSession } from "@/lib/devSettings";
import { careTeamQuery, configQuery } from "./queries";
import { joinRecipients, type Recipient } from "./recipients";

export type RecipientsResult =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; recipients: Recipient[]; questions: Question[] };

type Results = [UseQueryResult<PracticeEConsultConfig>, UseQueryResult<CareTeamMember[]>];

// Error wins over stale data: a failed refetch must show the error, not last time's list.
export function combineRecipients([config, team]: Results): RecipientsResult {
  if (config.isError || team.isError) {
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

export function useRecipients(): RecipientsResult {
  const services = useServices();
  const { practiceId } = useSession();
  return useQueries({
    queries: [configQuery(services, practiceId), careTeamQuery(services, practiceId)],
    combine: combineRecipients,
  });
}
