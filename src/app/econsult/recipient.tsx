import { Stack, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RecipientCard } from "@/components/RecipientCard";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { EmptyState, ErrorState, LoadingCards } from "@/components/StatusViews";
import { StepHeader } from "@/components/StepHeader";
import { TextButton } from "@/components/TextButton";
import { shouldGuardLeaving, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { roleLabel } from "@/features/econsult/recipients";
import { routeAfterRecipient, STEP_TITLES, stepCount } from "@/features/econsult/steps";
import { useRecipients, type RecipientsResult } from "@/features/econsult/useRecipients";
import { HEADER_BUTTON_MAX_FONT_SCALE, spacing } from "@/theme/tokens";

const LOADING_LABEL = "Loading your practice's care team";
const CONTINUE_HINT = "Choose who you are writing to first";
const EMPTY_TITLE = "Your practice hasn't switched on e-consults in the app yet";
const EMPTY_BODY = "You can still phone the practice with your question.";
const ERROR_TITLE = "We couldn't load your practice's details";
const ERROR_BODY = "Check your connection and try again.";
const DISCARD_TITLE = "Discard your message?";
const DISCARD_BODY = "Your message and photo will be lost.";

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

function useDiscardGuard(draft: DraftState) {
  const navigation = useNavigation();
  usePreventRemove(shouldGuardLeaving(draft), ({ data }) => {
    Alert.alert(DISCARD_TITLE, DISCARD_BODY, [
      { text: "Keep writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });
}

export default function RecipientScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const result = useRecipients();
  const hasQuestions = result.status === "ready" && result.questions.length > 0;
  const onlyRecipient =
    result.status === "ready" && result.recipients.length === 1 ? result.recipients[0] : null;
  useDiscardGuard(draft);

  // Exactly one writable recipient: preselect so the flow keeps one shape.
  useEffect(() => {
    if (onlyRecipient && draft.recipientId === null) {
      dispatch({ type: "recipientSelected", recipientId: onlyRecipient.id });
    }
  }, [onlyRecipient, draft.recipientId, dispatch]);

  const goHome = () => router.dismissTo("/");
  const action =
    result.status === "ready" ? (
      <PrimaryButton
        label="Continue"
        disabled={draft.recipientId === null}
        accessibilityHint={draft.recipientId === null ? CONTINUE_HINT : undefined}
        onPress={() => router.push(routeAfterRecipient(hasQuestions))}
      />
    ) : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TextButton
              label="Home"
              onPress={goHome}
              maxFontSizeMultiplier={HEADER_BUTTON_MAX_FONT_SCALE}
            />
          ),
        }}
      />
      <ScreenScaffold action={action}>
        {result.status === "ready" ? (
          <StepHeader
            stepNumber={1}
            stepCount={stepCount(hasQuestions)}
            title={STEP_TITLES.recipient}
          />
        ) : null}
        {result.status === "loading" ? <LoadingCards label={LOADING_LABEL} /> : null}
        {result.status === "error" ? (
          <ErrorState title={ERROR_TITLE} body={ERROR_BODY} onRetry={result.retry} />
        ) : null}
        {result.status === "empty" ? (
          <EmptyState
            title={EMPTY_TITLE}
            body={EMPTY_BODY}
            action={<TextButton label="Back to start" onPress={goHome} />}
          />
        ) : null}
        {result.status === "ready" ? (
          <RecipientList
            result={result}
            selectedId={draft.recipientId}
            onSelect={(id) => dispatch({ type: "recipientSelected", recipientId: id })}
          />
        ) : null}
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
