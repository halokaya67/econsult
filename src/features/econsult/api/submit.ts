import type { Answer, CreateEConsultRequest, PatientSession } from "@/api/contracts";
import type { Services } from "@/api/services";
import { isApiError, type PhotoFile } from "@/api/transport";
import { devWarn } from "@/lib/devWarn";
import { newId } from "@/lib/ids";
import { readyPhoto, type AttachmentStatus, type DraftState } from "../state/draft";
import { photoFileFor } from "../utils/photo";

export type SubmitInput = {
  session: PatientSession;
  recipientId: string;
  message: string;
  answers: Readonly<Record<string, string>>;
  photo: PhotoFile | null;
  idempotencyKey: string;
};

export type SubmitOutcome = { econsultId: string; attachment: AttachmentStatus };

// The first send allocates the key; every retry reuses the one the reducer kept, so a retry can
// never create a second e-consult.
export function idempotencyKeyFor(draft: DraftState): string {
  const { submission } = draft;
  if (submission.phase !== "draft" || submission.idempotencyKey === null) return newId();
  return submission.idempotencyKey;
}

export function submitInputFor(
  draft: DraftState,
  session: PatientSession,
  recipientId: string,
  idempotencyKey: string,
): SubmitInput {
  const photo = readyPhoto(draft);
  return {
    session,
    recipientId,
    message: draft.message,
    answers: draft.answers,
    photo: photo ? photoFileFor(photo) : null,
    idempotencyKey,
  };
}

export function toAnswers(answers: Readonly<Record<string, string>>): Answer[] {
  return Object.entries(answers)
    .filter(([, value]) => value.trim().length > 0)
    .map(([questionId, value]) => ({ questionId, value: value.trim() }));
}

export function toCreateRequest(input: SubmitInput): CreateEConsultRequest {
  return {
    patientId: input.session.patientId,
    recipientId: input.recipientId,
    body: input.message.trim(),
    answers: toAnswers(input.answers),
  };
}

// An API failure on the upload is an outcome the patient sees ("sent, photo not attached");
// anything else is a bug and must surface.
async function uploadOrFail(
  services: Services,
  econsultId: string,
  photo: PhotoFile,
): Promise<AttachmentStatus> {
  try {
    await services.uploadAttachment(econsultId, photo);
    return "attached";
  } catch (error) {
    if (!isApiError(error)) throw error;
    return "failed";
  }
}

// The e-consult exists by now, so the message was sent whatever the upload does: even a bug is the
// partial outcome here, told to the developer instead of to the patient as "not sent".
async function attachmentAfterCreate(
  services: Services,
  econsultId: string,
  photo: PhotoFile,
): Promise<AttachmentStatus> {
  try {
    return await uploadOrFail(services, econsultId, photo);
  } catch (error) {
    devWarn(`Attachment upload failed after ${econsultId} was created: ${String(error)}`);
    return "failed";
  }
}

export async function submitEConsult(
  services: Services,
  input: SubmitInput,
  onCreated: (econsultId: string) => void,
): Promise<SubmitOutcome> {
  const { econsultId } = await services.createEConsult(
    toCreateRequest(input),
    input.idempotencyKey,
  );
  onCreated(econsultId);
  if (!input.photo) return { econsultId, attachment: "none" };
  return { econsultId, attachment: await attachmentAfterCreate(services, econsultId, input.photo) };
}

export function retryAttachment(
  services: Services,
  econsultId: string,
  photo: PhotoFile,
): Promise<AttachmentStatus> {
  return uploadOrFail(services, econsultId, photo);
}
