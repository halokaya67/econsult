import { render, screen, userEvent } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useFocusAfterCommit } from "./useFocusAfterCommit";

const PLAIN = "What would you like to ask?";
const WITH_ERROR = "What would you like to ask?. Error: Please write your question";

// Stands in for a field whose accessible name gains its error on the next render: a request that
// runs in the press's own tick still reads the name without it.
function FieldProbe({ record }: { record: (name: unknown) => void }) {
  const [name, setName] = useState(PLAIN);
  const [, setNudge] = useState(0);
  const focusAfterCommit = useFocusAfterCommit();
  return (
    <>
      <Text testID="field">{name}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send"
        onPress={() => {
          setName(WITH_ERROR);
          focusAfterCommit(() => record(screen.getByTestId("field").props.children));
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nudge"
        onPress={() => setNudge((count) => count + 1)}
      />
    </>
  );
}

describe("useFocusAfterCommit", () => {
  test("runs the request only after the render that carries the new name", async () => {
    const names: unknown[] = [];
    const user = userEvent.setup();
    render(<FieldProbe record={(name) => names.push(name)} />);

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(names).toEqual([WITH_ERROR]);
  });

  test("runs nothing while no request has been made", () => {
    const names: unknown[] = [];

    render(<FieldProbe record={(name) => names.push(name)} />);

    expect(names).toEqual([]);
  });

  test("runs a repeat of the same request, and nothing on an unrelated render", async () => {
    const names: unknown[] = [];
    const user = userEvent.setup();
    render(<FieldProbe record={(name) => names.push(name)} />);
    await user.press(screen.getByRole("button", { name: "Send" }));

    await user.press(screen.getByRole("button", { name: "Send" }));
    await user.press(screen.getByRole("button", { name: "Nudge" }));

    expect(names).toEqual([WITH_ERROR, WITH_ERROR]);
  });
});
