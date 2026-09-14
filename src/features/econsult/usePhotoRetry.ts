import { useRef, useState } from "react";
import { announce } from "@/lib/announce";
import { photoFileFor } from "@/lib/photo";
import { readyPhoto } from "./draft";
import { useDraft } from "./DraftProvider";
import { sendErrorCopy } from "./errorCopy";
import { useRetryAttachment } from "./useSubmit";

export const PHOTO_STILL_FAILED =
  "The photo still couldn't be attached. You can try again or continue without it.";

// mutateAsync rejects on anything the upload does not report as a photo outcome, so the rejection
// is caught here and shown from the mutation's own error state instead of going unhandled.
export function usePhotoRetry() {
  const { draft, dispatch } = useDraft();
  const retry = useRetryAttachment();
  const [hasRetryFailed, setHasRetryFailed] = useState(false);
  // isPending only reaches React a macrotask later, so without this a second tap in the same tick
  // would upload the photo twice.
  const isInFlight = useRef(false);
  const photo = readyPhoto(draft);
  const { econsultId } = draft;

  async function run() {
    if (isInFlight.current || !photo || !econsultId) return;
    setHasRetryFailed(false);
    isInFlight.current = true;
    try {
      const attachment = await retry.mutateAsync({ econsultId, photo: photoFileFor(photo) });
      dispatch({ type: "attachmentSettled", attachment });
      // An upload the API rejects resolves as an outcome rather than throwing, so this branch is
      // the only place a repeated failure becomes visible.
      if (attachment === "failed") {
        setHasRetryFailed(true);
        announce(PHOTO_STILL_FAILED);
      }
    } catch (error) {
      // The alert is already mounted, so iOS only speaks the new line when it is announced.
      announce(sendErrorCopy(error));
    } finally {
      isInFlight.current = false;
    }
  }

  return {
    start: () => void run(),
    isPending: retry.isPending,
    error: retry.error,
    hasRetryFailed,
  };
}
