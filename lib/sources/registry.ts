import type { SourceAdapterDefinition } from "./types";

export const SOURCE_ADAPTER_REGISTRY: SourceAdapterDefinition[] = [
  {
    id: "adapter:e-stat-api",
    label: "e-Stat API",
    sourceIds: ["source:e-stat-api"],
    accessMethod: "api",
    outputKinds: ["SourceSnapshot", "TimeSeriesObservation", "EvidenceClaim"],
    updateCadence: "monthly",
    rightsNote: "Official statistics API; appId must be supplied from local environment.",
    requiresCredential: true,
    nonLiveBoundary: false
  },
  {
    id: "adapter:e-gov-data-portal",
    label: "e-Gov Data Portal metadata API",
    sourceIds: ["source:e-gov-data-portal-api"],
    accessMethod: "api",
    outputKinds: ["SourceSnapshot", "EvidenceClaim"],
    updateCadence: "daily",
    rightsNote: "Official open-data catalog metadata API.",
    requiresCredential: false,
    nonLiveBoundary: false
  },
  {
    id: "adapter:gsi-tiles",
    label: "Geospatial Information Authority of Japan tiles",
    sourceIds: ["source:gsi-tiles"],
    accessMethod: "tile",
    outputKinds: ["SourceSnapshot", "GeoFeature"],
    updateCadence: "ad-hoc",
    rightsNote: "Official map tiles; attribution requirements must be preserved in UI.",
    requiresCredential: false,
    nonLiveBoundary: false
  },
  {
    id: "adapter:g-spatial-ckan",
    label: "G-Spatial Information Center CKAN",
    sourceIds: ["source:g-spatial-ckan"],
    accessMethod: "ckan",
    outputKinds: ["SourceSnapshot", "GeoFeature", "EvidenceClaim"],
    updateCadence: "weekly",
    rightsNote: "Public geospatial catalog; each dataset keeps its own license metadata.",
    requiresCredential: false,
    nonLiveBoundary: false
  },
  {
    id: "adapter:mod-publication-pages",
    label: "Ministry of Defense publication pages",
    sourceIds: [
      "source:mod-dprk-missile-nuclear-development",
      "source:mod-joint-staff-air-activity"
    ],
    accessMethod: "html",
    outputKinds: ["SourceSnapshot", "EvidenceClaim", "GeoFeature", "PolicySignal"],
    updateCadence: "ad-hoc",
    rightsNote: "Official publication pages; parsed facts must remain public, historical, delayed, or aggregate.",
    requiresCredential: false,
    nonLiveBoundary: true
  },
  {
    id: "adapter:jaxa-gportal",
    label: "JAXA G-Portal Web API",
    sourceIds: ["source:jaxa-gportal-web-api"],
    accessMethod: "api",
    outputKinds: ["SourceSnapshot", "GeoFeature", "EvidenceClaim"],
    updateCadence: "daily",
    rightsNote: "JAXA satellite product metadata; downstream use must follow data terms.",
    requiresCredential: false,
    nonLiveBoundary: false
  },
  {
    id: "adapter:jepx-market-data",
    label: "JEPX market data",
    sourceIds: ["source:jepx-market-data"],
    accessMethod: "csv",
    outputKinds: ["SourceSnapshot", "TimeSeriesObservation", "EvidenceClaim"],
    updateCadence: "daily",
    rightsNote: "Public market data download; preserve source attribution and units.",
    requiresCredential: false,
    nonLiveBoundary: false
  },
  {
    id: "adapter:mhlw-drug-supply",
    label: "MHLW drug supply status",
    sourceIds: ["source:mhlw-drug-supply-status"],
    accessMethod: "excel",
    outputKinds: ["SourceSnapshot", "EvidenceClaim", "TimeSeriesObservation"],
    updateCadence: "weekly",
    rightsNote: "Official MHLW supply status files or public system views; parser output must be reviewed for field changes.",
    requiresCredential: false,
    nonLiveBoundary: false
  }
];
