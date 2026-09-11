import { newId } from "./ids";

test("newId returns a fresh id each time", () => {
  const first = newId();
  const second = newId();

  expect(first).toMatch(/^uuid-/);
  expect(second).not.toBe(first);
});
