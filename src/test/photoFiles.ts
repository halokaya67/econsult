import { File } from "expo-file-system";

// The photo files the app deleted, read off the `File` mock in `jest.setup.ts`: each instance
// remembers its uri and owns the `delete` that was or was not called on it.
function constructedFiles(): File[] {
  return jest
    .mocked(File)
    .mock.results.flatMap((result) => (result.type === "return" ? [result.value] : []));
}

// A delete that threw is not a deletion, so only the calls that returned count.
function wasDeleted(file: File): boolean {
  return jest.mocked(file.delete).mock.results.some((result) => result.type === "return");
}

export function deletedPhotoUris(): string[] {
  return constructedFiles()
    .filter(wasDeleted)
    .map((file) => file.uri);
}

export function forgetDeletedPhotos(): void {
  jest.mocked(File).mockClear();
}

// A file the system has already reclaimed: expo-file-system throws from `delete` when the file is
// gone, and the cast is because a stand-in instance is not the whole class.
export function failNextPhotoDelete(message: string): void {
  jest.mocked(File).mockImplementationOnce(
    (uri) =>
      ({
        uri,
        delete: jest.fn(() => {
          throw new Error(message);
        }),
      }) as unknown as File,
  );
}
