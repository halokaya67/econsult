import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { draftReducer, initialDraft, type DraftAction, type DraftState } from "./draft";

type DraftContextValue = { draft: DraftState; dispatch: Dispatch<DraftAction> };

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: DraftState;
}) {
  const [draft, dispatch] = useReducer(draftReducer, initial ?? initialDraft);
  const value = useMemo(() => ({ draft, dispatch }), [draft]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const value = useContext(DraftContext);
  if (value === null) throw new Error("useDraft must be used inside DraftProvider");
  return value;
}
