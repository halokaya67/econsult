import * as Crypto from "expo-crypto";
import { newId } from "./ids";

const randomUUID = jest.mocked(Crypto.randomUUID);
const UUID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

test("newId hands back the uuid the crypto module generated, unchanged", () => {
  randomUUID.mockReturnValueOnce(UUID);

  const id = newId();

  expect(id).toBe(UUID);
});

test("newId asks for a new uuid on every call", () => {
  randomUUID.mockClear();

  const first = newId();
  const second = newId();

  expect(randomUUID).toHaveBeenCalledTimes(2);
  expect(second).not.toBe(first);
});
