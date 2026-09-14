import { useQueries } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { useServices } from "@/providers/ServicesProvider";
import { careTeamQuery, configQuery } from "../api/queries";
import { combineRecipients, type RecipientsResult } from "../utils/recipients";

export function useRecipients(): RecipientsResult {
  const services = useServices();
  const { practiceId } = useSession();
  return useQueries({
    queries: [configQuery(services, practiceId), careTeamQuery(services, practiceId)],
    combine: combineRecipients,
  });
}
