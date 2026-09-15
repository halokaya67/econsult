import { useRouter } from "expo-router";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { RecipientBody } from "@/features/econsult/components/RecipientBody";
import { StepHeader } from "@/features/econsult/components/StepHeader";
import { useDiscardGuard } from "@/features/econsult/hooks/useDiscardGuard";
import { useRecipients } from "@/features/econsult/hooks/useRecipients";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import {
  stepAfterRecipient,
  STEP_TITLES,
  stepCount,
  stepNumber,
} from "@/features/econsult/utils/steps";

const CONTINUE_HINT = "Choose who you are writing to first";
const STEP_ROUTES = { questions: "/econsult/questions", message: "/econsult/message" } as const;

function ContinueButton({
  selectedId,
  onPress,
}: {
  selectedId: string | null;
  onPress: () => void;
}) {
  return (
    <PrimaryButton
      label="Continue"
      disabled={selectedId === null}
      accessibilityHint={selectedId === null ? CONTINUE_HINT : undefined}
      onPress={onPress}
    />
  );
}

export default function RecipientScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const result = useRecipients();
  const hasQuestions = result.status === "ready" && result.questions.length > 0;
  const onlyRecipient =
    result.status === "ready" && result.recipients.length === 1 ? result.recipients[0] : null;
  useDiscardGuard(draft);
  // Exactly one writable recipient counts as chosen from the first render; Continue is what writes
  // that choice to the draft, so no render passes through an unchecked card.
  const selectedId = draft.recipientId ?? onlyRecipient?.id ?? null;

  function onContinue() {
    if (selectedId !== null && draft.recipientId === null) {
      dispatch({ type: "recipientSelected", recipientId: selectedId });
    }
    router.push(STEP_ROUTES[stepAfterRecipient(hasQuestions)]);
  }

  const goHome = () => router.dismissTo("/");
  const action =
    result.status === "ready" ? (
      <ContinueButton selectedId={selectedId} onPress={onContinue} />
    ) : undefined;

  return (
    <ScreenScaffold action={action}>
      {result.status === "ready" ? (
        <StepHeader
          stepNumber={stepNumber("recipient", hasQuestions)}
          stepCount={stepCount(hasQuestions)}
          title={STEP_TITLES.recipient}
        />
      ) : null}
      <RecipientBody
        result={result}
        selectedId={selectedId}
        onSelect={(id) => dispatch({ type: "recipientSelected", recipientId: id })}
        goHome={goHome}
      />
    </ScreenScaffold>
  );
}
