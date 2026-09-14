export type Requirement = "required" | "optional";

// The label rules both form fields obey, so a text field and a choice group never drift apart.
export function labelWithRequirement(label: string, requirement?: Requirement): string {
  return requirement ? `${label} (${requirement})` : label;
}

// Neither platform supports an error-message link on inputs, so the error is folded into the
// field's accessible name: the one mechanism that works identically for VoiceOver and TalkBack.
export function accessibleName(label: string, error?: string | null): string {
  return error ? `${label}. Error: ${error}` : label;
}
