export type BojApiEndpoint = "getMetadata" | "getDataCode" | "getDataLayer";

export type BojApiParams = Record<string, string | number | boolean | undefined>;

type BojMetadataRecord = {
  SERIES_CODE: string;
  NAME_OF_TIME_SERIES?: string;
  UNIT?: string;
  FREQUENCY?: string;
  CATEGORY?: string;
  START_OF_THE_TIME_SERIES?: string;
  END_OF_THE_TIME_SERIES?: string;
  LAST_UPDATE?: string;
  NOTES?: string;
};

type BojMetadataResponse = {
  STATUS?: number;
  MESSAGEID?: string;
  MESSAGE?: string;
  DATE?: string;
  DB?: string;
  RESULTSET?: BojMetadataRecord[];
};

export type BojMetadataSeries = {
  seriesCode: string;
  name?: string;
  unit?: string;
  frequency?: string;
  category?: string;
  start?: string;
  end?: string;
  lastUpdate?: string;
  notes?: string;
};

export type BojMetadataResult = {
  status?: number;
  messageId?: string;
  message?: string;
  fetchedAt?: string;
  database?: string;
  items: BojMetadataSeries[];
};

export function buildBojApiUrl(
  endpoint: BojApiEndpoint,
  params: BojApiParams,
  baseUrl = "https://www.stat-search.boj.or.jp/api/v1"
): string {
  const url = new URL(`${baseUrl}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function normalizeBojMetadataRecord(record: BojMetadataRecord): BojMetadataSeries {
  return {
    seriesCode: record.SERIES_CODE,
    name: record.NAME_OF_TIME_SERIES,
    unit: record.UNIT,
    frequency: record.FREQUENCY,
    category: record.CATEGORY,
    start: record.START_OF_THE_TIME_SERIES,
    end: record.END_OF_THE_TIME_SERIES,
    lastUpdate: record.LAST_UPDATE,
    notes: record.NOTES
  };
}

export async function fetchBojMetadata(
  params: BojApiParams,
  fetcher: typeof fetch = fetch
): Promise<BojMetadataResult> {
  const response = await fetcher(buildBojApiUrl("getMetadata", params));
  if (!response.ok) {
    throw new Error(`BOJ API request failed: ${response.status}`);
  }

  const payload = (await response.json()) as BojMetadataResponse;

  return {
    status: payload.STATUS,
    messageId: payload.MESSAGEID,
    message: payload.MESSAGE,
    fetchedAt: payload.DATE,
    database: payload.DB,
    items: (payload.RESULTSET ?? []).map(normalizeBojMetadataRecord)
  };
}
