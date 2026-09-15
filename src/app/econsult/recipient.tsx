import { useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingCards } from "@/components/LoadingCards";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { RecipientCard } from "@/features/econsult/components/RecipientCard";
import { StepHeader } from "@/features/econsult/components/StepHeader";
import { useDiscardGuard } from "@/features/econsult/hooks/useDiscardGuard";
import { useRecipients } from "@/features/econsult/hooks/useRecipients";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { roleLabel, type RecipientsResult } from "@/features/econsult/utils/recipients";
import {
  stepAfterRecipient,
  STEP_TITLES,
  stepCount,
  stepNumber,
} from "@/features/econsult/utils/steps";
import { useFocusOnLayout } from "@/hooks/useFocusOnLayout";
import { focusForScreenReader, type Focusable } from "@/lib/announce";
import { spacing } from "@/theme/tokens";

const LOADING_LABEL = "Loading your practice's care team";
const CONTINUE_HINT = "Choose who you are writing to first";
const EMPTY_TITLE = "Your practice hasn't switched on e-consults in the app yet";
const EMPTY_BODY = "You can still phone the practice with your question.";
const ERROR_TITLE = "We couldn't load your practice's details";
const ERROR_BODY = "Check your connection and try again.";
const STEP_ROUTES = { questions: "/econsult/questions", message: "/econsult/message" } as const;

type ReadyResult = Extract<RecipientsResult, { status: "ready" }>;

// A container, not an accessibility element: the cards inside stay individually focusable radios.
function RecipientList({
  result,
  selectedId,
  onSelect,
}: {
  result: ReadyResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={STEP_TITLES.recipient}
      style={styles.list}
    >
      {result.recipients.map((recipient) => (
        <RecipientCard
          key={recipient.id}
          name={recipient.displayName}
          role={roleLabel(recipient.role)}
          checked={recipient.id === selectedId}
          onPress={() => onSelect(recipient.id)}
        />
      ))}
    </View>
  );
}

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

// The card is the whole step while the load is failed and it says nothing of its own, so the focus
// move is what speaks it. Fabric holds no view for it in the commit that adds it, which left the
// move with nothing to land on, so it waits for the card's first layout.
function LoadErrorCard({ onRetry }: { onRetry: () => void }) {
  const card = useRef<Focusable | null>(null);
  const onLayout = useFocusOnLayout(card, focusForScreenReader);

  return (
    <ErrorState
      ref={(node) => {
        card.current = node;
      }}
      onLayout={onLayout}
      title={ERROR_TITLE}
      body={ERROR_BODY}
      onRetry={onRetry}
    />
  );
}

function RecipientBody({
  result,
  selectedId,
  onSelect,
  goHome,
}: {
  result: RecipientsResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
  goHome: () => void;
}) {
  if (result.status === "loading") return <LoadingCards label={LOADING_LABEL} />;
  if (result.status === "error") return <LoadErrorCard onRetry={result.retry} />;
  if (result.status === "empty") {
    return (
      <EmptyState
        title={EMPTY_TITLE}
        body={EMPTY_BODY}
        action={<TextButton label="Back to start" onPress={goHome} />}
      />
    );
  }
  return <RecipientList result={result} selectedId={selectedId} onSelect={onSelect} />;
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

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
