export type DraftPhoto =
  | { status: "preparing"; pickId: string }
  | { status: "ready"; pickId: string; uri: string; width: number; height: number };

export type ReadyPhoto = Extract<DraftPhoto, { status: "ready" }>;

export type AttachmentStatus = "none" | "attached" | "failed";

export type DraftState = {
  recipientId: string | null;
  answers: Readonly<Record<string, string>>;
  message: string;
  photo: DraftPhoto | null;
  idempotencyKey: string | null;
  econsultId: string | null;
  attachment: AttachmentStatus;
};

export type DraftAction =
  | { type: "recipientSelected"; recipientId: string }
  | { type: "answerChanged"; questionId: string; value: string }
  | { type: "messageChanged"; message: string }
  | { type: "photoPickStarted"; pickId: string }
  | { type: "photoReady"; pickId: string; uri: string; width: number; height: number }
  | { type: "photoRemoved" }
  | { type: "submitStarted"; idempotencyKey: string }
  | { type: "econsultCreated"; econsultId: string }
  | { type: "attachmentSettled"; attachment: AttachmentStatus };

export const initialDraft: DraftState = {
  recipientId: null,
  answers: {},
  message: "",
  photo: null,
  idempotencyKey: null,
  econsultId: null,
  attachment: "none",
};

// A late result only counts for the pick the draft is still waiting on.
function applyPhotoReady(
  state: DraftState,
  action: Extract<DraftAction, { type: "photoReady" }>,
): DraftState {
  if (state.photo?.pickId !== action.pickId) return state;
  const { type: _type, ...photo } = action;
  return { ...state, photo: { status: "ready", ...photo } };
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "recipientSelected":
      return { ...state, recipientId: action.recipientId };
    case "answerChanged":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case "messageChanged":
      return { ...state, message: action.message };
    case "photoPickStarted":
      return { ...state, photo: { status: "preparing", pickId: action.pickId } };
    case "photoReady":
      return applyPhotoReady(state, action);
    case "photoRemoved":
      return { ...state, photo: null };
    case "submitStarted":
      return { ...state, idempotencyKey: state.idempotencyKey ?? action.idempotencyKey };
    case "econsultCreated":
      return { ...state, econsultId: action.econsultId };
    case "attachmentSettled":
      return { ...state, attachment: action.attachment };
  }
}

export function hasUnsentContent(state: DraftState): boolean {
  return state.message.trim().length > 0 || state.photo !== null;
}

export function isPhotoPreparing(state: DraftState): boolean {
  return state.photo?.status === "preparing";
}

export function readyPhoto(state: DraftState): ReadyPhoto | null {
  return state.photo?.status === "ready" ? state.photo : null;
}

export function shouldGuardLeaving(state: DraftState): boolean {
  return hasUnsentContent(state) && state.econsultId === null;
}
