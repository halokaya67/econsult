import { QueryClient } from "@tanstack/react-query";
import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import HomeScreen from "@/app/index";
import { practiceKeys } from "@/features/econsult/api/queries";
import * as devWarn from "@/lib/devWarn";
import { TestProviders } from "@/test/renderWithProviders";

const Stub = () => <Text>stub</Text>;

function renderHome(client: QueryClient) {
  return renderRouter(
    { index: HomeScreen, "econsult/recipient": Stub, "dev-settings": Stub },
    {
      initialUrl: "/",
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    },
  );
}

describe("Home", () => {
  afterEach(() => jest.restoreAllMocks());

  test("greets the patient and starts the flow from one primary action", async () => {
    const user = userEvent.setup();
    renderHome(new QueryClient());

    expect(screen.getByRole("header", { name: "Hello, Ria de Boer." })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Write to your practice" }));

    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("prefetches the practice config and care team", async () => {
    const client = new QueryClient();
    renderHome(client);

    await waitFor(() => expect(client.getQueryData(practiceKeys.config("prc-0421"))).toBeDefined());
    expect(client.getQueryData(practiceKeys.careTeam("prc-0421"))).toBeDefined();
  });

  test("offers developer settings in development", async () => {
    const user = userEvent.setup();
    renderHome(new QueryClient());

    await user.press(screen.getByRole("button", { name: "Developer settings" }));

    expect(screen).toHavePathname("/dev-settings");
  });

  test("hides developer settings outside development", () => {
    jest.spyOn(devWarn, "isDevelopmentBuild").mockReturnValue(false);
    renderHome(new QueryClient());

    expect(screen.queryByRole("button", { name: "Developer settings" })).toBeNull();
  });
});
