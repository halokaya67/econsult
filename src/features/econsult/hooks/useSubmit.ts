import { useMutation } from "@tanstack/react-query";
import { useServices } from "@/providers/ServicesProvider";
import { submitEConsult, type SubmitInput, type SubmitOutcome } from "../api/submit";

// "always": a send must never sit paused behind a wrong offline flag; the timeout is the authority.
export function useSubmit(onCreated: (econsultId: string) => void) {
  const services = useServices();
  return useMutation<SubmitOutcome, Error, SubmitInput>({
    mutationFn: (input) => submitEConsult(services, input, onCreated),
    networkMode: "always",
    retry: 0,
  });
}
