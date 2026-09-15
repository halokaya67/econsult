import { fireEvent, screen } from "@testing-library/react-native";
import { Dimensions, useWindowDimensions } from "react-native";
import { RelayoutProbe } from "@/test/relayoutProbe";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ScreenScaffold } from "./ScreenScaffold";

// Jest renders no layout, so the hook the scaffold reads the text size from is the only place a
// live Dynamic Type change can be simulated.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const WINDOW = Dimensions.get("window");

const mockedWindow = jest.mocked(useWindowDimensions);

// Everything that speaks on mount would speak again, so the scaffold says which of the two a
// mount is: the patient arriving on the step, or the page laid out again under them.
describe("useRelayoutFlag", () => {
  test("tells the children it remounted them for a text-size change", () => {
    const report = jest.fn();
    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 1 });
    const { rerender } = renderWithProviders(
      <ScreenScaffold>
        <RelayoutProbe report={report} />
      </ScreenScaffold>,
    );
    expect(report).toHaveBeenLastCalledWith(false);

    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 2 });
    rerender(
      <ScreenScaffold>
        <RelayoutProbe report={report} />
      </ScreenScaffold>,
    );

    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenLastCalledWith(true);
  });

  test("calls the page an arrival again on the next commit after the re-layout", () => {
    const report = jest.fn();
    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 1 });
    const { rerender } = renderWithProviders(
      <ScreenScaffold>
        <RelayoutProbe report={report} />
      </ScreenScaffold>,
    );
    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 2 });
    rerender(
      <ScreenScaffold>
        <RelayoutProbe report={report} />
      </ScreenScaffold>,
    );

    fireEvent.press(screen.getByText("Probe"));
    expect(report).toHaveBeenLastCalledWith(true);
    rerender(
      <ScreenScaffold>
        <RelayoutProbe report={report} />
      </ScreenScaffold>,
    );
    fireEvent.press(screen.getByText("Probe"));

    expect(report).toHaveBeenLastCalledWith(false);
  });
});
