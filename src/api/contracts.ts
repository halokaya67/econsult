import { z } from "zod";

const MIN_CHOICE_OPTIONS = 2;

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

const nonEmpty = z.string().min(1);

const choiceQuestionSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  type: z.literal("choice"),
  options: z.array(nonEmpty).min(MIN_CHOICE_OPTIONS),
  required: z.boolean(),
});

const textQuestionSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  type: z.literal("text"),
  required: z.boolean(),
});

export const questionSchema = z.discriminatedUnion("type", [
  choiceQuestionSchema,
  textQuestionSchema,
]);

// A question the app cannot render (no type, an unknown type, a choice with one option) is left out
// so the rest of the form still renders; the config as a whole never fails because of one question.
function onlyRenderableQuestions(input: unknown): unknown {
  if (!Array.isArray(input)) return input;
  return input.filter((question) => questionSchema.safeParse(question).success);
}

export const careTeamRoleSchema = z.enum(["gp", "nurse", "assistant", "other"]).catch("other");

export const careTeamMemberSchema = z.object({
  id: nonEmpty,
  displayName: nonEmpty,
  role: careTeamRoleSchema,
});

export const practiceConfigSchema = z.object({
  practiceId: nonEmpty,
  recipientIds: z.array(nonEmpty),
  questions: z.preprocess(onlyRenderableQuestions, z.array(questionSchema)),
});

export const answerSchema = z.object({ questionId: nonEmpty, value: z.string() });

export const createEConsultRequestSchema = z.object({
  patientId: nonEmpty,
  recipientId: nonEmpty,
  body: nonEmpty,
  answers: z.array(answerSchema),
});

export const createEConsultResponseSchema = z.object({ econsultId: nonEmpty });

export const attachmentResponseSchema = z.object({ attachmentId: nonEmpty });

export type ChoiceQuestion = z.infer<typeof choiceQuestionSchema>;
export type TextQuestion = z.infer<typeof textQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type CareTeamRole = z.infer<typeof careTeamRoleSchema>;
export type CareTeamMember = z.infer<typeof careTeamMemberSchema>;
export type PracticeEConsultConfig = z.infer<typeof practiceConfigSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type CreateEConsultRequest = z.infer<typeof createEConsultRequestSchema>;
export type CreateEConsultResponse = z.infer<typeof createEConsultResponseSchema>;
export type AttachmentResponse = z.infer<typeof attachmentResponseSchema>;

export type PatientSession = {
  patientId: string;
  practiceId: string;
  displayName: string;
};
