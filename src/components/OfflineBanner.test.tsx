import { render, screen } from "@testing-library/react-native";
import { OFFLINE_MESSAGE, OfflineBanner } from "./OfflineBanner";

test("the offline banner is an alert that reads the offline message", () => {
  render(<OfflineBanner />);

  expect(screen.getByRole("alert")).toHaveTextContent(OFFLINE_MESSAGE);
});
