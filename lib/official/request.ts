export type OfficialFetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface OfficialJsonRequestOptions {
  serviceName: string;
  url: string;
  fetcher?: OfficialFetcher;
  timeoutMs?: number;
  headers?: HeadersInit;
  cache?: RequestCache;
}

export type OfficialSettledResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

const DEFAULT_TIMEOUT_MS = 8000;

export async function settleOfficialRequests<T>(
  requests: Array<() => Promise<T>>
): Promise<Array<OfficialSettledResult<T>>> {
  const settled = await Promise.allSettled(requests.map((request) => request()));

  return settled.map((result) => {
    if (result.status === "fulfilled") {
      return { ok: true, value: result.value };
    }

    return { ok: false, error: toError(result.reason) };
  });
}

export async function fetchOfficialJson<T = unknown>({
  serviceName,
  url,
  fetcher = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  headers,
  cache = "no-store"
}: OfficialJsonRequestOptions): Promise<T> {
  const timeout = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetcher(url, {
      cache,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        ...headersToRecord(headers)
      },
      signal: timeout.signal
    });

    if (!response.ok) {
      const statusText = response.statusText ? ` ${response.statusText}` : "";
      throw new Error(`${serviceName} request failed: HTTP ${response.status}${statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (timeout.signal.aborted && isAbortLikeError(error)) {
      throw new Error(`${serviceName} request timed out after ${timeoutMs}ms`);
    }

    if (error instanceof Error && error.message.startsWith(`${serviceName} request failed:`)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${serviceName} request failed: ${message}`);
  } finally {
    timeout.cleanup();
  }
}

function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return {
      signal: AbortSignal.timeout(timeoutMs),
      cleanup: () => undefined
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  };
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers.map(([key, value]) => [key, value]));
  }

  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, String(value)]));
}

function toError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }

  return new Error(String(reason));
}

function isAbortLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  return error.name === "AbortError" || error.name === "TimeoutError" || /abort|timeout/i.test(error.message);
}
