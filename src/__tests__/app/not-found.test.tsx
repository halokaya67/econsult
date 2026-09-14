import { userEvent } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import NotFoundScreen from "@/app/+not-found";
import { TestProviders } from "@/test/renderWithProviders";

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

  test("the way out is a link home", async () => {
    const user = userEvent.setup();
    renderNotFound();

    await user.press(screen.getByRole("link", { name: "Go to the home screen" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
