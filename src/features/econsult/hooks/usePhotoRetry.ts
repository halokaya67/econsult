import { useRef, useState } from "react";
import { announce } from "@/lib/announce";
import { runOnce } from "@/lib/inFlight";
import { useRetryAttachment } from "./useRetryAttachment";
import { readyPhoto } from "../state/draft";
import { useDraft } from "../state/DraftProvider";
import { sendErrorCopy } from "../utils/errorCopy";
import { photoFileFor } from "../utils/photo";

export const PHOTO_STILL_FAILED =
  "The photo still couldn't be attached. You can try again or continue without it.";

// mutateAsync rejects on anything the upload does not report as a photo outcome, so the rejection
// is caught here and shown from the mutation's own error state instead of going unhandled. The
// caller passes the id of the e-consult it is showing, which is the only one a retry may upload to.
export function usePhotoRetry(econsultId: string) {
  const { draft, dispatch } = useDraft();
  const retry = useRetryAttachment();
  const [hasRetryFailed, setHasRetryFailed] = useState(false);
  // isPending only reaches React a macrotask later, so without this a second tap in the same tick
  // would upload the photo twice.
  const isInFlight = useRef(false);
  const photo = readyPhoto(draft);

  async function run() {
    if (!photo) return;
    setHasRetryFailed(false);
    try {
      const attachment = await retry.mutateAsync({ econsultId, photo: photoFileFor(photo) });
      dispatch({ type: "attachmentSettled", econsultId, attachment });
      // An upload the API rejects resolves as an outcome rather than throwing, so this branch is
      // the only place a repeated failure becomes visible.
      if (attachment === "failed") {
        setHasRetryFailed(true);
        announce(PHOTO_STILL_FAILED);
      }
    } catch (error) {
      // The alert is already mounted and is not a live region, so announcing is what speaks the
      // new line, once, on both platforms.
      announce(sendErrorCopy(error));
    }
  }

  return {
    start: () => void runOnce(isInFlight, run),
    isPending: retry.isPending,
    error: retry.error,
    hasRetryFailed,
  };
}
