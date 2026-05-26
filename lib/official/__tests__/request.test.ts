import { describe, expect, test, vi } from "vitest";

import { fetchOfficialJson, settleOfficialRequests } from "../request";

describe("official request helper", () => {
  test("adds JSON/cache request options and returns parsed JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(
      fetchOfficialJson<{ ok: boolean }>({
        serviceName: "e-Stat",
        url: "https://example.test/estat",
        fetcher,
        timeoutMs: 5000
      })
    ).resolves.toEqual({ ok: true });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "https://example.test/estat",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Cache-Control": "no-cache"
        }),
        signal: expect.any(AbortSignal)
      })
    );
  });

  test("throws a service-specific error for non-ok responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("temporarily unavailable", {
        status: 503,
        statusText: "Service Unavailable"
      })
    );

    await expect(
      fetchOfficialJson({
        serviceName: "BOJ",
        url: "https://example.test/boj",
        fetcher
      })
    ).rejects.toThrow("BOJ request failed: HTTP 503 Service Unavailable");
  });

  test("throws a service-specific timeout error", async () => {
    const fetcher = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(init.signal?.reason ?? new DOMException("The operation was aborted", "AbortError"));
          });
        })
    );

    await expect(
      fetchOfficialJson({
        serviceName: "Kokkai",
        url: "https://example.test/slow",
        fetcher,
        timeoutMs: 1
      })
    ).rejects.toThrow("Kokkai request timed out after 1ms");
  });

  test("keeps partial official request failures isolated", async () => {
    const results = await settleOfficialRequests([
      async () => ({ service: "e-Stat", ok: true }),
      async () => {
        throw new Error("BOJ API request failed: HTTP 503 Service Unavailable");
      }
    ]);

    expect(results[0]).toEqual({ ok: true, value: { service: "e-Stat", ok: true } });
    expect(results[1]).toEqual({
      ok: false,
      error: expect.objectContaining({
        message: "BOJ API request failed: HTTP 503 Service Unavailable"
      })
    });
  });
});
