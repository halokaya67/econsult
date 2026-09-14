import { Stack, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RecipientCard } from "@/components/RecipientCard";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { EmptyState, ErrorState, LoadingCards } from "@/components/StatusViews";
import { StepHeader } from "@/components/StepHeader";
import { TextButton } from "@/components/TextButton";
import { shouldGuardLeaving, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { roleLabel, type RecipientsResult } from "@/features/econsult/recipients";
import { stepAfterRecipient, STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/steps";
import { useRecipients } from "@/features/econsult/useRecipients";
import { HEADER_BUTTON_MAX_FONT_SCALE, spacing } from "@/theme/tokens";

const LOADING_LABEL = "Loading your practice's care team";
const CONTINUE_HINT = "Choose who you are writing to first";
const EMPTY_TITLE = "Your practice hasn't switched on e-consults in the app yet";
const EMPTY_BODY = "You can still phone the practice with your question.";
const ERROR_TITLE = "We couldn't load your practice's details";
const ERROR_BODY = "Check your connection and try again.";
const DISCARD_TITLE = "Discard your message?";
const DISCARD_BODY = "Your message and photo will be lost.";
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

function HomeHeaderButton({ onPress }: { onPress: () => void }) {
  return (
    <TextButton
      label="Home"
      onPress={onPress}
      maxFontSizeMultiplier={HEADER_BUTTON_MAX_FONT_SCALE}
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
  if (result.status === "error") {
    return <ErrorState title={ERROR_TITLE} body={ERROR_BODY} onRetry={result.retry} />;
  }
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

// Leaving step 1 in any direction means leaving the flow, so Discard lowers the guard and goes home
// instead of replaying the blocked action: a root-level pop re-dispatched here is a no-op on device.
function useDiscardGuard(draft: DraftState) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  usePreventRemove(shouldGuardLeaving(draft) && !isLeaving, () => {
    Alert.alert(DISCARD_TITLE, DISCARD_BODY, [
      { text: "Keep writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => setIsLeaving(true) },
    ]);
  });

  useEffect(() => {
    if (isLeaving) router.dismissTo("/");
  }, [isLeaving, router]);
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
    <>
      <Stack.Screen options={{ headerLeft: () => <HomeHeaderButton onPress={goHome} /> }} />
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
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
