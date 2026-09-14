import { useMutation } from "@tanstack/react-query";
import type { PhotoFile } from "@/api/transport";
import { useServices } from "@/providers/ServicesProvider";
import { retryAttachment } from "../api/submit";
import type { AttachmentStatus } from "../state/draft";

// "always": a retry the patient asked for must never sit paused behind a wrong offline flag; the
// upload's own timeout is the authority.
export function useRetryAttachment() {
  const services = useServices();
  return useMutation<AttachmentStatus, Error, { econsultId: string; photo: PhotoFile }>({
    mutationFn: ({ econsultId, photo }) => retryAttachment(services, econsultId, photo),
    networkMode: "always",
    retry: 0,
  });
}
