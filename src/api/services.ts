import type { z } from "zod";
import {
  attachmentResponseSchema,
  careTeamMemberSchema,
  createEConsultResponseSchema,
  IDEMPOTENCY_HEADER,
  practiceConfigSchema,
  type AttachmentResponse,
  type CareTeamMember,
  type CreateEConsultRequest,
  type CreateEConsultResponse,
  type PracticeEConsultConfig,
} from "./contracts";
import { ApiError, withTimeout, type PhotoFile, type Transport } from "./transport";

export const READ_TIMEOUT_MS = 15_000;
export const CREATE_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 45_000;

export type Services = {
  getPracticeConfig(practiceId: string): Promise<PracticeEConsultConfig>;
  getCareTeam(practiceId: string): Promise<CareTeamMember[]>;
  createEConsult(
    request: CreateEConsultRequest,
    idempotencyKey: string,
  ): Promise<CreateEConsultResponse>;
  uploadAttachment(econsultId: string, photo: PhotoFile): Promise<AttachmentResponse>;
};

// Generic over the schema so the return type is zod's OUTPUT type (after preprocess and catch),
// not the input type a plain `ZodType<T>` parameter would infer.
function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError("validation", "The server sent a response the app could not read");
  }
  return result.data;
}

export function createServices(transport: Transport): Services {
  return {
    getPracticeConfig: (practiceId) =>
      withTimeout(READ_TIMEOUT_MS, async (signal) =>
        parse(
          practiceConfigSchema,
          await transport.getJson(`/practices/${practiceId}/econsult-config`, signal),
        ),
      ),
    getCareTeam: (practiceId) =>
      withTimeout(READ_TIMEOUT_MS, async (signal) =>
        parse(
          careTeamMemberSchema.array(),
          await transport.getJson(`/practices/${practiceId}/care-team`, signal),
        ),
      ),
    createEConsult: (request, idempotencyKey) =>
      withTimeout(CREATE_TIMEOUT_MS, async (signal) =>
        parse(
          createEConsultResponseSchema,
          await transport.postJson(
            "/econsults",
            request,
            { [IDEMPOTENCY_HEADER]: idempotencyKey },
            signal,
          ),
        ),
      ),
    uploadAttachment: (econsultId, photo) =>
      withTimeout(UPLOAD_TIMEOUT_MS, async (signal) =>
        parse(
          attachmentResponseSchema,
          await transport.uploadPhoto(`/econsults/${econsultId}/attachments`, photo, signal),
        ),
      ),
  };
}
