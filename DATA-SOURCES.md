# Data Sources Policy

This repository separates code licensing from source-material handling.

## Code vs. source materials

- Repository code is licensed separately under `Apache-2.0`.
- Source-linked data in `data/seed/` is not treated as a single relicensable corpus.
- `ontology/` contains project-authored semantic structure, but many seeded facts point to third-party source materials.

## Public-sector sources

Government and public-institution sources are handled with attribution-first reuse rules, subject to the terms published by each source.

Operationally, this project:

- cites official/public sources
- summarizes source-linked facts
- links users to the original public source

## Private-sector sources

Private-company materials are handled more narrowly.

Operationally, this project:

- uses fact statements
- uses paraphrase and summary
- links to original pages

Operationally, this project does not:

- republish full private documents
- republish copied tables as a reusable dataset
- claim blanket redistribution rights over private-source materials

## Site-level statement

The public site should explain that:

- official and private sources are both referenced
- provenance is shown where possible
- source materials and repository code do not share one identical rights model

## Repository files to consult

- `data/seed/sources.json`
- `docs/official-source-registry.md`
- `docs/superpowers/specs/2026-04-13-sources-license-contact-design.md`
