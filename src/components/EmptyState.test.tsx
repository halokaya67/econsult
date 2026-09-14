import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  test("shows a heading, a body and an optional action", () => {
    render(
      <EmptyState title="Nothing here" body="Come back later" action={<Text>Go home</Text>} />,
    );

    expect(screen.getByRole("header", { name: "Nothing here" })).toBeOnTheScreen();
    expect(screen.getByText("Come back later")).toBeOnTheScreen();
    expect(screen.getByText("Go home")).toBeOnTheScreen();
  });
});
