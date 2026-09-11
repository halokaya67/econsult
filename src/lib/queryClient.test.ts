import { createQueryClient, READ_RETRY_COUNT, READ_RETRY_DELAY_MS } from "./queryClient";

describe("createQueryClient", () => {
  test("reads retry once after one second and run offline-first", () => {
    const client = createQueryClient();

    const queries = client.getDefaultOptions().queries;

    expect(queries).toMatchObject({
      retry: READ_RETRY_COUNT,
      retryDelay: READ_RETRY_DELAY_MS,
      networkMode: "offlineFirst",
    });
  });

  test("mutations never retry and always run", () => {
    const client = createQueryClient();

    expect(client.getDefaultOptions().mutations).toMatchObject({ retry: 0, networkMode: "always" });
  });
});
