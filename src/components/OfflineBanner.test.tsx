import { render, screen } from "@testing-library/react-native";
import { OFFLINE_MESSAGE } from "@/providers/NetworkProvider";
import { OfflineBanner } from "./OfflineBanner";

test("the offline banner is an alert that reads the offline message", () => {
  render(<OfflineBanner />);

  expect(screen.getByRole("alert")).toHaveTextContent(OFFLINE_MESSAGE);
});

test("the banner is not a live region, so the provider's announcement is not repeated", () => {
  render(<OfflineBanner />);

  expect(screen.getByRole("alert").props.accessibilityLiveRegion).toBeUndefined();
});
