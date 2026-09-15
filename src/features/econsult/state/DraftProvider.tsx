import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { draftReducer, initialDraft, readyPhoto, type DraftAction, type DraftState } from "./draft";
import { discardPhotoFiles } from "../utils/photo";

type DraftContextValue = { draft: DraftState; dispatch: Dispatch<DraftAction> };

const DraftContext = createContext<DraftContextValue | null>(null);

// The two photo events each name a file in the cache: the picker's copy, then the downscaled JPEG.
function photoFileUri(action: DraftAction): string | null {
  return action.type === "photoPickStarted" || action.type === "photoReady" ? action.uri : null;
}

function photoFilesOf(draft: DraftState): Set<string> {
  const photo = readyPhoto(draft);
  return new Set(photo === null ? [] : [photo.uri]);
}

export function DraftProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: DraftState;
}) {
  const [draft, dispatch] = useReducer(draftReducer, initial ?? initialDraft);
  const photoFiles = useRef(photoFilesOf(initial ?? initialDraft));

  const trackAndDispatch = useCallback((action: DraftAction) => {
    const uri = photoFileUri(action);
    if (uri !== null) photoFiles.current.add(uri);
    dispatch(action);
  }, []);

  // The flow's layout mounts this provider, so unmounting it is the patient leaving by Done,
  // Discard or Home; every photo file the draft named during its life goes with it.
  useEffect(() => {
    const files = photoFiles.current;
    return () => discardPhotoFiles(files);
  }, []);

  const value = useMemo(() => ({ draft, dispatch: trackAndDispatch }), [draft, trackAndDispatch]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const value = useContext(DraftContext);
  if (value === null) throw new Error("useDraft must be used inside DraftProvider");
  return value;
}
