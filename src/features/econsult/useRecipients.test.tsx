import type { UseQueryResult } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { CareTeamMember, PracticeEConsultConfig } from "@/api/contracts";
import { hookWrapper } from "@/test/providers";
import { combineRecipients, useRecipients } from "./useRecipients";

type ConfigResult = UseQueryResult<PracticeEConsultConfig>;
type TeamResult = UseQueryResult<CareTeamMember[]>;

function fakeResult<T>(overrides: Partial<UseQueryResult<T>>): UseQueryResult<T> {
  return { isError: false, data: undefined, refetch: jest.fn(), ...overrides } as UseQueryResult<T>;
}

const CONFIG: PracticeEConsultConfig = {
  practiceId: "prc-0421",
  recipientIds: ["ct-11"],
  questions: [],
};
const TEAM: CareTeamMember[] = [{ id: "ct-11", displayName: "Dr. J. de Vries", role: "gp" }];

describe("combineRecipients", () => {
  test("is loading while either request has no data", () => {
    const result = combineRecipients([
      fakeResult<PracticeEConsultConfig>({ data: CONFIG }),
      fakeResult<CareTeamMember[]>({}),
    ]);

    expect(result.status).toBe("loading");
  });

  test("is an error when either request failed, even with stale data, and retry refetches the failed one", () => {
    const refetch = jest.fn();
    const config = fakeResult<PracticeEConsultConfig>({ data: CONFIG, isError: true, refetch });
    const team = fakeResult<CareTeamMember[]>({ data: TEAM });

    const result = combineRecipients([config as ConfigResult, team as TeamResult]);

    expect(result.status).toBe("error");
    if (result.status === "error") result.retry();
    expect(refetch).toHaveBeenCalled();
    expect(team.refetch).not.toHaveBeenCalled();
  });

  test("retry refetches only the care team when that is the failed request", () => {
    const refetch = jest.fn();
    const config = fakeResult<PracticeEConsultConfig>({ data: CONFIG });
    const team = fakeResult<CareTeamMember[]>({ isError: true, refetch });

    const result = combineRecipients([config as ConfigResult, team as TeamResult]);

    if (result.status === "error") result.retry();
    expect(refetch).toHaveBeenCalled();
    expect(config.refetch).not.toHaveBeenCalled();
  });

  test("is empty when no recipient id matches the care team", () => {
    const result = combineRecipients([
      fakeResult<PracticeEConsultConfig>({ data: { ...CONFIG, recipientIds: [] } }),
      fakeResult<CareTeamMember[]>({ data: TEAM }),
    ]);

    expect(result.status).toBe("empty");
  });

  test("is ready with the joined recipients and the questions", () => {
    const result = combineRecipients([
      fakeResult<PracticeEConsultConfig>({ data: CONFIG }),
      fakeResult<CareTeamMember[]>({ data: TEAM }),
    ]);

    expect(result).toEqual({ status: "ready", recipients: TEAM, questions: [] });
  });
});

describe("useRecipients", () => {
  test("goes from loading to ready with the fixture practice", async () => {
    const { result } = renderHook(() => useRecipients(), { wrapper: hookWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    if (result.current.status === "ready") {
      expect(result.current.recipients.map((r) => r.id)).toEqual(["ct-11", "ct-12", "ct-19"]);
      expect(result.current.questions).toHaveLength(2);
    }
  });

  test("reports an error when the config request fails", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { faults: { config: "server" } } }),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  test("reports an error when the care team request fails", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { faults: { careTeam: "server" } } }),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  test("reports empty for a practice without recipients", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { practiceId: "prc-0000" } }),
    });

    await waitFor(() => expect(result.current.status).toBe("empty"));
  });
});
