import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingCards } from "@/components/LoadingCards";
import { TextButton } from "@/components/TextButton";
import { useFocusOnLayout } from "@/hooks/useFocusOnLayout";
import { focusForScreenReader, type Focusable } from "@/lib/announce";
import { spacing } from "@/theme/tokens";
import { RecipientCard } from "./RecipientCard";
import { roleLabel, type RecipientsResult } from "../utils/recipients";
import { STEP_TITLES } from "../utils/steps";

type Props = {
  result: RecipientsResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
  goHome: () => void;
};

type ReadyResult = Extract<RecipientsResult, { status: "ready" }>;

export const LOADING_LABEL = "Loading your practice's care team";
export const EMPTY_TITLE = "Your practice hasn't switched on e-consults in the app yet";
export const EMPTY_BODY = "You can still phone the practice with your question.";
export const ERROR_TITLE = "We couldn't load your practice's details";
export const ERROR_BODY = "Check your connection and try again.";

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

export function RecipientBody({ result, selectedId, onSelect, goHome }: Props) {
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

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
