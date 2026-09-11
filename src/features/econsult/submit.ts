import type { Answer, CreateEConsultRequest, PatientSession } from "@/api/contracts";
import type { Services } from "@/api/services";
import { isApiError, type PhotoFile } from "@/api/transport";
import type { AttachmentStatus } from "./draft";

export type SubmitInput = {
  session: PatientSession;
  recipientId: string;
  message: string;
  answers: Readonly<Record<string, string>>;
  photo: PhotoFile | null;
  idempotencyKey: string;
};

export type SubmitOutcome = { econsultId: string; attachment: AttachmentStatus };

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
  return { econsultId, attachment: await uploadOrFail(services, econsultId, input.photo) };
}

export function retryAttachment(
  services: Services,
  econsultId: string,
  photo: PhotoFile,
): Promise<AttachmentStatus> {
  return uploadOrFail(services, econsultId, photo);
}
