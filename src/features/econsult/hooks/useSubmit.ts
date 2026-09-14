import { useMutation } from "@tanstack/react-query";
import type { PhotoFile } from "@/api/transport";
import { useServices } from "@/providers/ServicesProvider";
import {
  retryAttachment,
  submitEConsult,
  type SubmitInput,
  type SubmitOutcome,
} from "../api/submit";
import type { AttachmentStatus } from "../state/draft";

// "always": a send must never sit paused behind a wrong offline flag; the timeout is the authority.
export function useSubmit(onCreated: (econsultId: string) => void) {
  const services = useServices();
  return useMutation<SubmitOutcome, Error, SubmitInput>({
    mutationFn: (input) => submitEConsult(services, input, onCreated),
    networkMode: "always",
    retry: 0,
  });
}

export function useRetryAttachment() {
  const services = useServices();
  return useMutation<AttachmentStatus, Error, { econsultId: string; photo: PhotoFile }>({
    mutationFn: ({ econsultId, photo }) => retryAttachment(services, econsultId, photo),
    networkMode: "always",
    retry: 0,
  });
}
