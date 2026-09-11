import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { EmptyState, ErrorState, LoadingCards, RETRY_LABEL } from "./StatusViews";

describe("StatusViews", () => {
  test("LoadingCards is a busy progress indicator with the given label", () => {
    render(<LoadingCards label="Loading your practice's care team" />);

    expect(
      screen.getByRole("progressbar", {
        name: "Loading your practice's care team",
        busy: true,
      }),
    ).toBeOnTheScreen();
  });

  test("EmptyState shows a heading, a body and an optional action", () => {
    render(
      <EmptyState title="Nothing here" body="Come back later" action={<Text>Go home</Text>} />,
    );

    expect(screen.getByRole("header", { name: "Nothing here" })).toBeOnTheScreen();
    expect(screen.getByText("Come back later")).toBeOnTheScreen();
    expect(screen.getByText("Go home")).toBeOnTheScreen();
  });

  test("ErrorState is an alert with a retry button", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<ErrorState title="We couldn't load" body="Check your connection" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load", { exact: false });
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
