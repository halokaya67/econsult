import { queryOptions } from "@tanstack/react-query";
import type { Services } from "@/api/services";

// Keys include the practice id so switching practice never serves another practice's cache.
export const practiceKeys = {
  config: (practiceId: string) => ["practice", practiceId, "config"] as const,
  careTeam: (practiceId: string) => ["practice", practiceId, "careTeam"] as const,
};

export function configQuery(services: Services, practiceId: string) {
  return queryOptions({
    queryKey: practiceKeys.config(practiceId),
    queryFn: () => services.getPracticeConfig(practiceId),
  });
}

export function careTeamQuery(services: Services, practiceId: string) {
  return queryOptions({
    queryKey: practiceKeys.careTeam(practiceId),
    queryFn: () => services.getCareTeam(practiceId),
  });
}
