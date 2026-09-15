export type DraftPhoto =
  | { status: "preparing"; pickId: string }
  | {
      status: "ready";
      pickId: string;
      uri: string;
      width: number;
      height: number;
      mimeType?: string;
    };

export type ReadyPhoto = Extract<DraftPhoto, { status: "ready" }>;

export type AttachmentStatus = "none" | "attached" | "failed";

// The send's id and its photo outcome are one fact, so neither can be recorded without the other.
// The key stands for the payload a draft would send, which is why it retires with that phase.
export type Submission =
  | { phase: "draft"; idempotencyKey: string | null }
  | { phase: "sent"; econsultId: string; attachment: AttachmentStatus };

export type SentSubmission = Extract<Submission, { phase: "sent" }>;

export type DraftState = {
  recipientId: string | null;
  answers: Readonly<Record<string, string>>;
  message: string;
  photo: DraftPhoto | null;
  submission: Submission;
};

export type DraftAction =
  | { type: "recipientSelected"; recipientId: string }
  | { type: "answerChanged"; questionId: string; value: string }
  | { type: "messageChanged"; message: string }
  // The uri is the picker's own copy of the photo in the cache. The reducer has no use for it; the
  // provider tracks it so the file goes when the flow ends.
  | { type: "photoPickStarted"; pickId: string; uri: string }
  | {
      type: "photoReady";
      pickId: string;
      uri: string;
      width: number;
      height: number;
      mimeType?: string;
    }
  | { type: "photoRemoved" }
  | { type: "submitStarted"; idempotencyKey: string }
  | { type: "econsultCreated"; econsultId: string }
  // The outcome names the e-consult whose photo settled, so the reducer never has to ask whether
  // there is one.
  | { type: "attachmentSettled"; econsultId: string; attachment: AttachmentStatus };

export const initialDraft: DraftState = {
  recipientId: null,
  answers: {},
  message: "",
  photo: null,
  submission: { phase: "draft", idempotencyKey: null },
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

// The key stands for one payload, so an edit before the e-consult exists retires it and the next
// Send mints a fresh one; once the create has landed there is no key left for anything to reuse.
function submissionAfterEdit(submission: Submission): Submission {
  return submission.phase === "sent" ? submission : { phase: "draft", idempotencyKey: null };
}

// The first Send mints the key and every later one finds it already there, so no retry can create a
// second e-consult.
function submissionAfterSendStart(submission: Submission, idempotencyKey: string): Submission {
  if (submission.phase !== "draft" || submission.idempotencyKey !== null) return submission;
  return { phase: "draft", idempotencyKey };
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "recipientSelected":
      return {
        ...state,
        recipientId: action.recipientId,
        submission: submissionAfterEdit(state.submission),
      };
    case "answerChanged":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
        submission: submissionAfterEdit(state.submission),
      };
    case "messageChanged":
      return {
        ...state,
        message: action.message,
        submission: submissionAfterEdit(state.submission),
      };
    case "photoPickStarted":
      return { ...state, photo: { status: "preparing", pickId: action.pickId } };
    case "photoReady":
      return applyPhotoReady(state, action);
    case "photoRemoved":
      return { ...state, photo: null };
    case "submitStarted":
      return {
        ...state,
        submission: submissionAfterSendStart(state.submission, action.idempotencyKey),
      };
    case "econsultCreated":
      return {
        ...state,
        submission: { phase: "sent", econsultId: action.econsultId, attachment: "none" },
      };
    case "attachmentSettled": {
      const { econsultId, attachment } = action;
      return { ...state, submission: { phase: "sent", econsultId, attachment } };
    }
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

export function sentSubmission(state: DraftState): SentSubmission | null {
  return state.submission.phase === "sent" ? state.submission : null;
}

// A chosen recipient is enough to guard: the flow past step 1 always has one, and an untouched
// step 1 has nothing to ask about.
export function shouldGuardLeaving(state: DraftState): boolean {
  return (state.recipientId !== null || hasUnsentContent(state)) && sentSubmission(state) === null;
}
