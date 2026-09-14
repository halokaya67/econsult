import { render, screen } from "@testing-library/react-native";
import { LoadingCards } from "./LoadingCards";

describe("LoadingCards", () => {
  test("is a busy progress indicator with the given label", () => {
    render(<LoadingCards label="Loading your practice's care team" />);

    expect(
      screen.getByRole("progressbar", {
        name: "Loading your practice's care team",
        busy: true,
      }),
    ).toBeOnTheScreen();
  });
});
