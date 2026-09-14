import { render, screen, userEvent } from "@testing-library/react-native";
import { createRef } from "react";
import type { View } from "react-native";
import { borderWidth, MIN_TOUCH } from "@/theme/tokens";
import { ChoiceGroup } from "./ChoiceGroup";

const OPTIONS = ["Less than a week", "1 to 4 weeks"];
const SIZES = ["Small", "Large"] as const;
type Size = (typeof SIZES)[number];

type Instance = ReturnType<typeof render>["root"];

const inRenderOrder = (node: Instance): Instance[] => [
  node,
  ...node.children.flatMap((child) => (typeof child === "string" ? [] : inRenderOrder(child))),
];

describe("ChoiceGroup", () => {
  test("is a labelled group whose options are radios with a checked state", () => {
    render(
      <ChoiceGroup
        label="How long?"
        requirement="required"
        options={OPTIONS}
        value="1 to 4 weeks"
        onChange={() => {}}
      />,
    );

    const [label, group] = screen.getAllByLabelText("How long? (required)");
    expect(label).toHaveTextContent("How long? (required)");
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(screen.getByRole("radio", { name: "1 to 4 weeks", checked: true })).toHaveStyle({
      minHeight: MIN_TOUCH,
      borderWidth,
    });
    expect(
      screen.getByRole("radio", { name: "Less than a week", checked: false }),
    ).toBeOnTheScreen();
  });

  test("selecting an option calls onChange with it", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ChoiceGroup label="How long?" options={OPTIONS} value={null} onChange={onChange} />);

    await user.press(screen.getByRole("radio", { name: "Less than a week" }));

    expect(onChange).toHaveBeenCalledWith("Less than a week");
  });

  test("folds an error into the label's accessible name", () => {
    render(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    expect(screen.getByLabelText("How long?. Error: This question is required")).toBeOnTheScreen();
  });

  // The screen announces the error and moves focus to the label, whose name carries it. A live
  // region here would make TalkBack say it a second time.
  test("shows the error text without announcing it a second time", () => {
    render(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    const error = screen.getByText("This question is required");

    expect(error).toBeOnTheScreen();
    expect(error.props.accessibilityLiveRegion).toBeUndefined();
  });

  test("hands the pressed option to onChange", async () => {
    const chosen: Size[] = [];
    const user = userEvent.setup();
    render(
      <ChoiceGroup
        label="Size"
        options={SIZES}
        value={null}
        onChange={(size) => chosen.push(size)}
      />,
    );

    await user.press(screen.getByRole("radio", { name: "Large" }));

    expect(chosen).toEqual(["Large"]);
  });

  // The @ts-expect-error is the real assertion, made by tsc; the render shows what the rejected
  // value would otherwise leave behind. The option type is named because inference alone would
  // widen it to include whatever the value is.
  test("takes no value that is outside its own options", () => {
    render(
      <ChoiceGroup<Size>
        label="Size"
        options={SIZES}
        // @ts-expect-error a value outside the options is not assignable
        value="Medium"
        onChange={() => {}}
      />,
    );

    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
  });

  test("renders the error between the label and the options, so a long label scrolls with it", () => {
    render(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    const order = inRenderOrder(screen.root);

    expect(order.indexOf(screen.getByText("This question is required"))).toBeLessThan(
      order.indexOf(screen.getAllByRole("radio")[0]),
    );
  });

  // Android never clears a content description that goes back to undefined, so a corrected answer
  // has to be named with the plain label rather than with no label at all.
  test("takes the error back out of the label's accessible name once the answer is corrected", () => {
    const { rerender } = render(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    rerender(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value="1 to 4 weeks"
        onChange={() => {}}
        error={null}
      />,
    );

    const [label, group] = screen.getAllByLabelText("How long?");
    expect(label).toHaveTextContent("How long?");
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(screen.queryByLabelText(/Error:/)).toBeNull();
  });

  // iOS reads a Text's accessible name once and keeps it while the words on screen stay the same,
  // so a corrected answer would still be described as an error by the name it froze.
  test("names the label's wrapper rather than the text iOS would freeze the name on", () => {
    render(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    const named = screen.getByLabelText("How long?. Error: This question is required");

    expect(named.props.accessible).toBe(true);
    expect(screen.getByText("How long?").props.accessibilityLabel).toBeUndefined();
  });

  test("its ref lands on the label, the element whose name carries the error", () => {
    const ref = createRef<View>();

    render(
      <ChoiceGroup
        ref={ref}
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    expect(ref.current?.props.accessibilityLabel).toBe(
      "How long?. Error: This question is required",
    );
  });
});
