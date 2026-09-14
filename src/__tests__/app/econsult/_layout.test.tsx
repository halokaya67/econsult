import { renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import EConsultLayout, { unstable_settings } from "@/app/econsult/_layout";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { TestProviders } from "@/test/renderWithProviders";

function DraftProbe() {
  const { draft } = useDraft();
  return <Text>{draft.recipientId ?? "no recipient"}</Text>;
}

describe("EConsultLayout", () => {
  test("provides the draft to its screens and anchors deep links on the first step", () => {
    renderRouter(
      { "econsult/_layout": EConsultLayout, "econsult/recipient": DraftProbe },
      {
        initialUrl: "/econsult/recipient",
        wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
      },
    );

    expect(screen.getByText("no recipient")).toBeOnTheScreen();
    expect(unstable_settings.anchor).toBe("recipient");
  });
});
