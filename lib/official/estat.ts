export type EstatApiEndpoint =
  | "getStatsList"
  | "getMetaInfo"
  | "getStatsData"
  | "getDataCatalog"
  | "getStatsDatas";

export type EstatApiParams = Record<string, string | number | boolean | undefined> & {
  appId?: string;
};

type EstatTextNode = string | number | { $?: string | number } | undefined;

type EstatTableInf = {
  ID?: string;
  "@id"?: string;
  STAT_NAME?: EstatTextNode;
  GOV_ORG?: EstatTextNode;
  STATISTICS_NAME?: EstatTextNode;
  TITLE?: EstatTextNode;
  CYCLE?: EstatTextNode;
  SURVEY_DATE?: EstatTextNode;
  OPEN_DATE?: EstatTextNode;
};

type EstatClassEntryNode = {
  "@code"?: string;
  "@name"?: string;
  $?: string | number;
};

type EstatClassObjectNode = {
  "@id"?: string;
  "@name"?: string;
  CLASS?: EstatClassEntryNode | EstatClassEntryNode[];
};

type EstatResultNode = {
  STATUS?: string | number;
  ERROR_MSG?: string;
};

type EstatStatsListPayload = {
  GET_STATS_LIST?: {
    RESULT?: EstatResultNode;
    DATALIST_INF?: {
      NUMBER?: string | number;
      FROM_NUMBER?: string | number;
      TO_NUMBER?: string | number;
      NEXT_KEY?: string | number;
      TABLE_INF?: EstatTableInf | EstatTableInf[];
    };
  };
};

type EstatMetaInfoPayload = {
  GET_META_INFO?: {
    RESULT?: EstatResultNode;
    METADATA_INF?: {
      TABLE_INF?: EstatTableInf;
      CLASS_INF?: {
        CLASS_OBJ?: EstatClassObjectNode | EstatClassObjectNode[];
      };
    };
    META_INFO?: {
      TABLE_INF?: EstatTableInf;
      CLASS_INF?: {
        CLASS_OBJ?: EstatClassObjectNode | EstatClassObjectNode[];
      };
    };
  };
};

type EstatStatsDataValueNode = {
  $?: string | number;
  [key: `@${string}`]: string | number | undefined;
};

type EstatStatsDataPayload = {
  GET_STATS_DATA?: {
    RESULT_INF?: EstatResultNode;
    STATISTICAL_DATA?: {
      TABLE_INF?: EstatTableInf;
      CLASS_INF?: {
        CLASS_OBJ?: EstatClassObjectNode | EstatClassObjectNode[];
      };
      DATA_INF?: {
        VALUE?: EstatStatsDataValueNode | EstatStatsDataValueNode[];
      };
    };
  };
};

export type EstatTableSummary = {
  statsDataId?: string;
  statName?: string;
  govOrg?: string;
  statisticsName?: string;
  title?: string;
  cycle?: string;
  surveyDate?: string;
  openDate?: string;
};

export type EstatClassEntry = {
  code?: string;
  label?: string;
};

export type EstatClassObject = {
  id?: string;
  name?: string;
  entries: EstatClassEntry[];
};

export type EstatStatsListResult = {
  status?: number;
  errorMessage?: string;
  totalCount?: number;
  fromNumber?: number;
  toNumber?: number;
  nextKey?: string;
  items: EstatTableSummary[];
};

export type EstatMetaInfoResult = {
  status?: number;
  errorMessage?: string;
  table?: EstatTableSummary;
  classes: EstatClassObject[];
};

export type EstatStatsDataRow = {
  value?: string;
  dimensions: Record<string, string>;
};

export type EstatStatsDataResult = {
  status?: number;
  errorMessage?: string;
  table?: EstatTableSummary;
  classes: EstatClassObject[];
  rows: EstatStatsDataRow[];
};

export function resolveEstatAppId(appId?: string, envAppId = process.env.ESTAT_APP_ID): string {
  const resolved = appId ?? envAppId;
  if (!resolved) {
    throw new Error("appId is required");
  }

  return resolved;
}

export function buildEstatApiUrl(
  endpoint: EstatApiEndpoint,
  params: EstatApiParams,
  baseUrl = "https://api.e-stat.go.jp/rest",
  version = "3.0",
  envAppId = process.env.ESTAT_APP_ID
): string {
  const url = new URL(`${baseUrl}/${version}/app/json/${endpoint}`);
  const resolvedAppId = resolveEstatAppId(params.appId, envAppId);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set("appId", resolvedAppId);

  return url.toString();
}

export function normalizeEstatStatsListResponse(payload: EstatStatsListPayload): EstatStatsListResult {
  const section = payload.GET_STATS_LIST;
  const list = section?.DATALIST_INF;

  return {
    status: toNumber(section?.RESULT?.STATUS),
    errorMessage: section?.RESULT?.ERROR_MSG,
    totalCount: toNumber(list?.NUMBER),
    fromNumber: toNumber(list?.FROM_NUMBER),
    toNumber: toNumber(list?.TO_NUMBER),
    nextKey: toOptionalString(list?.NEXT_KEY),
    items: toArray(list?.TABLE_INF).map(normalizeEstatTableSummary)
  };
}

export function normalizeEstatMetaInfoResponse(payload: EstatMetaInfoPayload): EstatMetaInfoResult {
  const section = payload.GET_META_INFO;
  const metaInfo = section?.META_INFO ?? section?.METADATA_INF;

  return {
    status: toNumber(section?.RESULT?.STATUS),
    errorMessage: section?.RESULT?.ERROR_MSG,
    table: metaInfo?.TABLE_INF ? normalizeEstatTableSummary(metaInfo.TABLE_INF) : undefined,
    classes: normalizeEstatClassObjects(metaInfo?.CLASS_INF?.CLASS_OBJ)
  };
}

export function normalizeEstatStatsDataResponse(payload: EstatStatsDataPayload): EstatStatsDataResult {
  const section = payload.GET_STATS_DATA;
  const stats = section?.STATISTICAL_DATA;
  const values = toArray(stats?.DATA_INF?.VALUE);

  return {
    status: toNumber(section?.RESULT_INF?.STATUS),
    errorMessage: section?.RESULT_INF?.ERROR_MSG,
    table: stats?.TABLE_INF ? normalizeEstatTableSummary(stats.TABLE_INF) : undefined,
    classes: normalizeEstatClassObjects(stats?.CLASS_INF?.CLASS_OBJ),
    rows: values.map((row) => ({
      value: toOptionalString(row.$),
      dimensions: Object.fromEntries(
        Object.entries(row)
          .filter(([key, value]) => key.startsWith("@") && value !== undefined && value !== null)
          .map(([key, value]) => [key.slice(1), String(value)])
      )
    }))
  };
}

export async function fetchEstatStatsList(
  params: EstatApiParams,
  fetcher: typeof fetch = fetch,
  envAppId = process.env.ESTAT_APP_ID
): Promise<EstatStatsListResult> {
  const payload = await fetchEstatJson("getStatsList", params, fetcher, envAppId);
  return normalizeEstatStatsListResponse(payload as EstatStatsListPayload);
}

export async function fetchEstatMetaInfo(
  params: EstatApiParams,
  fetcher: typeof fetch = fetch,
  envAppId = process.env.ESTAT_APP_ID
): Promise<EstatMetaInfoResult> {
  const payload = await fetchEstatJson("getMetaInfo", params, fetcher, envAppId);
  return normalizeEstatMetaInfoResponse(payload as EstatMetaInfoPayload);
}

export async function fetchEstatStatsData(
  params: EstatApiParams,
  fetcher: typeof fetch = fetch,
  envAppId = process.env.ESTAT_APP_ID
): Promise<EstatStatsDataResult> {
  const payload = await fetchEstatJson("getStatsData", params, fetcher, envAppId);
  return normalizeEstatStatsDataResponse(payload as EstatStatsDataPayload);
}

async function fetchEstatJson(
  endpoint: EstatApiEndpoint,
  params: EstatApiParams,
  fetcher: typeof fetch,
  envAppId = process.env.ESTAT_APP_ID
): Promise<unknown> {
  const response = await fetcher(buildEstatApiUrl(endpoint, params, undefined, undefined, envAppId));
  if (!response.ok) {
    throw new Error(`e-Stat API request failed: ${response.status}`);
  }

  return response.json();
}

function normalizeEstatTableSummary(table: EstatTableInf): EstatTableSummary {
  return {
    statsDataId: table.ID ?? table["@id"],
    statName: readText(table.STAT_NAME),
    govOrg: readText(table.GOV_ORG),
    statisticsName: readText(table.STATISTICS_NAME),
    title: readText(table.TITLE),
    cycle: readText(table.CYCLE),
    surveyDate: readText(table.SURVEY_DATE),
    openDate: readText(table.OPEN_DATE)
  };
}

function normalizeEstatClassObjects(classObjects?: EstatClassObjectNode | EstatClassObjectNode[]): EstatClassObject[] {
  return toArray(classObjects).map((classObject) => ({
    id: classObject["@id"],
    name: classObject["@name"],
    entries: toArray(classObject.CLASS).map((entry) => ({
      code: entry["@code"],
      label: toOptionalString(entry.$) ?? entry["@name"]
    }))
  }));
}

function readText(value: EstatTextNode): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value && "$" in value && value.$ !== undefined) {
    return String(value.$);
  }

  return undefined;
}

function toArray<T>(value?: T | T[]): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toNumber(value?: string | number): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value?: string | number): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return String(value);
}
