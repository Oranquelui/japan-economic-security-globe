import { SOURCE_ADAPTER_REGISTRY } from "./registry";
import {
  SOURCE_ACCESS_METHODS,
  SOURCE_OUTPUT_KINDS,
  type SourceAdapterResultInput,
  type SourceSnapshot
} from "./types";

export { SOURCE_ACCESS_METHODS, SOURCE_OUTPUT_KINDS, SOURCE_ADAPTER_REGISTRY };
export type {
  SourceAccessMethod,
  SourceAdapterDefinition,
  SourceAdapterResultInput,
  SourceOutputKind,
  SourceSnapshot
} from "./types";

export function normalizeSourceAdapterResult(input: SourceAdapterResultInput): SourceSnapshot {
  if (!input.sourceId.trim()) {
    throw new Error("Source adapter result requires a sourceId.");
  }

  if (!input.capturedAt.trim()) {
    throw new Error("Source adapter result requires a capturedAt date.");
  }

  if (!input.sourceUrl.trim()) {
    throw new Error("Source adapter result requires a sourceUrl.");
  }

  if (input.outputKinds.length === 0) {
    throw new Error("Source adapter result requires at least one output kind.");
  }

  if (!input.provenanceNote.trim()) {
    throw new Error("Source adapter result requires a provenanceNote.");
  }

  return {
    id: `source-snapshot:${input.sourceId}:${input.capturedAt}`,
    sourceId: input.sourceId,
    capturedAt: input.capturedAt,
    sourceUrl: input.sourceUrl,
    accessMethod: input.accessMethod,
    outputKinds: input.outputKinds,
    provenanceNote: input.provenanceNote
  };
}
