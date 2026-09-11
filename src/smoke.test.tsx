import { render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

test("renders a button with an accessible name and a 48 point touch target", () => {
  render(
    <Pressable accessibilityRole="button" style={{ minHeight: 48, minWidth: 48 }}>
      <Text>Send</Text>
    </Pressable>,
  );

  const button = screen.getByRole("button", { name: "Send" });

  expect(button).toHaveStyle({ minHeight: 48, minWidth: 48 });
});
