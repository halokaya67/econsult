import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { MessageField } from "@/features/econsult/components/MessageField";
import { PhotoPicker } from "@/features/econsult/components/PhotoPicker/PhotoPicker";
import { SendButton } from "@/features/econsult/components/SendButton";
import { SendFeedback } from "@/features/econsult/components/SendFeedback";
import { StepHeader } from "@/features/econsult/components/StepHeader";
import { ToRow } from "@/features/econsult/components/ToRow";
import { useMessageSend } from "@/features/econsult/hooks/useMessageSend";
import { useRecipients } from "@/features/econsult/hooks/useRecipients";
import { isPhotoPreparing } from "@/features/econsult/state/draft";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { recipientNameFor } from "@/features/econsult/utils/recipients";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/utils/steps";
import { useIsOffline } from "@/providers/NetworkProvider";

function DraftPhotoPicker({ disabled }: { disabled: boolean }) {
  const { draft, dispatch } = useDraft();
  return (
    <PhotoPicker
      photo={draft.photo}
      disabled={disabled}
      onPickStarted={(pickId, uri) => dispatch({ type: "photoPickStarted", pickId, uri })}
      onPickReady={(pickId, result) => dispatch({ type: "photoReady", pickId, ...result })}
      onRemove={() => dispatch({ type: "photoRemoved" })}
    />
  );
}

export default function MessageScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const isOffline = useIsOffline();
  const { draft } = useDraft();
  const recipients = useRecipients();
  // Whether the practice asks questions is unknown until its config lands, and a header rendered on
  // that guess would announce "2 of 2" and then "3 of 3" — which is what a deep link here gets.
  const isPracticeReady = recipients.status === "ready";
  const hasQuestions = isPracticeReady && recipients.questions.length > 0;
  const send = useMessageSend();
  const isPreparing = isPhotoPreparing(draft);
  const isSending = send.submit.isPending;

  // Back, swipe and Cancel wait for the send to settle. A replace is re-dispatched
  // instead, so reaching the confirmation never depends on which render the lock is read from.
  usePreventRemove(isSending, ({ data }) => {
    if (data.action.type === "REPLACE") navigation.dispatch(data.action);
  });

  return (
    <ScreenScaffold
      action={<SendButton send={send} isOffline={isOffline} isPreparing={isPreparing} />}
    >
      {isPracticeReady ? (
        <StepHeader
          stepNumber={stepNumber("message", hasQuestions)}
          stepCount={stepCount(hasQuestions)}
          title={STEP_TITLES.message}
        />
      ) : null}
      <ToRow
        name={recipientNameFor(recipients, draft.recipientId)}
        disabled={isSending}
        onChange={() => router.dismissTo("/econsult/recipient")}
      />
      <MessageField send={send} message={draft.message} />
      <DraftPhotoPicker disabled={isSending} />
      <SendFeedback
        status={send.status}
        error={send.submit.error}
        isOffline={isOffline}
        onSend={send.onSend}
      />
    </ScreenScaffold>
  );
}
