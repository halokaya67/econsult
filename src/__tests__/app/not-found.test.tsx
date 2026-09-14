import { userEvent } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import NotFoundScreen from "@/app/+not-found";
import { TestProviders } from "@/test/renderWithProviders";
import { MIN_TOUCH } from "@/theme/tokens";

const Home = () => <Text>home</Text>;

// A Stack layout so the screen's own header options are part of the tree.
function TestLayout() {
  return <Stack />;
}

function renderNotFound() {
  return renderRouter(
    { _layout: TestLayout, index: Home, "+not-found": NotFoundScreen },
    {
      initialUrl: "/nowhere",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
}

describe("Not found", () => {
  test("an address the app does not have is named as such, under a heading", () => {
    renderNotFound();

    expect(screen.getByRole("header", { name: "Page not found" })).toBeOnTheScreen();
    expect(screen.getByText("That address isn't part of this app.")).toBeOnTheScreen();
  });

  // A button rather than a link, because a Link has no role and no click action on Android.
  test("the way out is a button that lands on the home screen", async () => {
    const user = userEvent.setup();
    renderNotFound();

    const home = screen.getByRole("button", { name: "Go to the home screen" });
    expect(home).toHaveStyle({ minHeight: MIN_TOUCH });

    await user.press(home);

    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
