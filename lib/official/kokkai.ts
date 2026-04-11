export type KokkaiSpeechSearchParams = {
  any?: string;
  speaker?: string;
  nameOfMeeting?: string;
  from?: string;
  until?: string;
  startRecord?: number;
  maximumRecords?: number;
};

type KokkaiSpeechRecord = {
  speechID: string;
  issueID?: string;
  nameOfHouse?: string;
  nameOfMeeting?: string;
  issue?: string;
  date?: string;
  speaker?: string;
  speakerGroup?: string;
  speakerPosition?: string;
  speech?: string;
  speechURL?: string;
  meetingURL?: string;
  pdfURL?: string;
};

type KokkaiSpeechResponse = {
  numberOfRecords?: number;
  numberOfReturn?: number;
  startRecord?: number;
  nextRecordPosition?: number;
  speechRecord?: KokkaiSpeechRecord[];
};

export type KokkaiSpeech = {
  id: string;
  issueId?: string;
  house?: string;
  meeting?: string;
  issue?: string;
  spokenOn?: string;
  speaker?: string;
  speakerGroup?: string;
  speakerPosition?: string;
  text?: string;
  speechUrl?: string;
  meetingUrl?: string;
  pdfUrl?: string;
};

export type KokkaiSpeechSearchResult = {
  totalRecords: number;
  returnedRecords: number;
  startRecord: number;
  nextStartRecord?: number;
  items: KokkaiSpeech[];
};

export function buildKokkaiSpeechUrl(
  params: KokkaiSpeechSearchParams,
  baseUrl = "https://kokkai.ndl.go.jp/api/speech"
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("recordPacking", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function normalizeKokkaiSpeechRecord(record: KokkaiSpeechRecord): KokkaiSpeech {
  return {
    id: record.speechID,
    issueId: record.issueID,
    house: record.nameOfHouse,
    meeting: record.nameOfMeeting,
    issue: record.issue,
    spokenOn: record.date,
    speaker: record.speaker,
    speakerGroup: record.speakerGroup,
    speakerPosition: record.speakerPosition,
    text: record.speech,
    speechUrl: record.speechURL,
    meetingUrl: record.meetingURL,
    pdfUrl: record.pdfURL
  };
}

export async function fetchKokkaiSpeeches(
  params: KokkaiSpeechSearchParams,
  fetcher: typeof fetch = fetch
): Promise<KokkaiSpeechSearchResult> {
  const response = await fetcher(buildKokkaiSpeechUrl(params));
  if (!response.ok) {
    throw new Error(`Kokkai API request failed: ${response.status}`);
  }

  const payload = (await response.json()) as KokkaiSpeechResponse;
  const items = (payload.speechRecord ?? []).map(normalizeKokkaiSpeechRecord);

  return {
    totalRecords: payload.numberOfRecords ?? items.length,
    returnedRecords: payload.numberOfReturn ?? items.length,
    startRecord: payload.startRecord ?? 1,
    nextStartRecord: payload.nextRecordPosition,
    items
  };
}
