# Japan Economic Security Globe Design

**Status:** Approved product direction captured from discovery conversation on 2026-04-07  
**Working repo name:** `japan-economic-security-globe`  
**Positioning:** Public-interest semantic intelligence service for people in Japan

## 1. Product Thesis

Japan's economic security is usually discussed in fragments:

- semiconductor policy
- energy imports
- rice prices
- drought and reservoirs
- defense budgets

The product should connect these fragments into one navigable public model.

The core claim is:

> Japan's dependencies are global, but their consequences are domestic.  
> A disruption in shipping routes, energy supply, policy, or procurement eventually shows up in electricity bills, rice prices, water stress, industrial resilience, and public spending.

This product should make that relationship visible and explorable through a semantic-web-first interface.

The service is explicitly for people in Japan.

- the subject is Japanese household, regional, and national impact
- foreign countries and routes are explanatory variables, not the primary service audience
- every view should ultimately answer why something matters to people in Japan

## 2. Core User Question

The main product question is:

> What is Japan dependent on, and how do those dependencies flow back into rice, water, electricity, daily life, and defense?

For launch, this question should be staged through an Energy-led hybrid framing:

- **Launch hook:** current energy and logistics shock narrative
- **Deep public relevance:** rice, water, cost of living
- **Strategic depth:** defense and semiconductors

## 3. Product Strategy

### 3.1 Launch strategy

The launch should optimize for attention in April 2026.

That means:

- the hero opens on `Energy`
- the first strong domestic bridge is `Rice`
- the system already includes `Water`, `Defense`, and `Semiconductors`
- logistics is modeled as a cross-cutting layer rather than a separate theme

### 3.2 Long-term strategy

The same MVP should be extensible into a durable public-interest site.

That requires:

- clean semantic entity modeling
- provenance on all seeded facts
- OWL/RDF/Turtle stubs from day one
- SPARQL query previews in the interface
- seeded local data that can later migrate to a triplestore and endpoint

### 3.3 Product phases

#### Phase 0

`Japan civic dependency service`

Scope:

- explain how external dependency connects to household life in Japan
- focus on Energy, Rice, Water, Defense, and Semiconductors
- keep foreign countries in the model only as they explain Japanese outcomes
- include logistics up to ports, terminals, refineries, and strategic facilities

#### Phase 1

`Japan strategic neighborhood layer`

Scope:

- extend the explanation model to include nearby geopolitical relationships
- add neighboring-country and regional strategic context only when it improves explanation for people in Japan
- keep the service audience unchanged: people in Japan

This is an extension layer, not a change in product identity.

## 4. Experience Concept

The product should feel like:

- **Harvard Globe of Economic Complexity** for the main spatial experience
- **public knowledge atlas** as the base tone
- **intelligence room** as a secondary influence for density and seriousness

The intended ratio is:

- public knowledge atlas: 70
- intelligence room: 30

It should not feel like:

- a generic SaaS dashboard
- a military targeting interface
- a research prototype with weak visual polish

## 5. Visual Direction

### 5.1 Core mood

- dark atmospheric background
- glowing global arcs and nodes
- restrained but premium typography
- high signal density without noise
- smooth transitions between global, domestic, and evidence views

### 5.2 Visual grammar

- **Globe:** world dependency stories, shipping routes, chokepoints, supplier countries
- **Japan map:** prefectures, dams, domestic impacts, ports, facilities, rice and water stories
- **Evidence graph:** law, budget, source, organization, facility, product, policy links

### 5.3 Launch tone

The landing frame should communicate:

> A disruption far away can become a household cost inside Japan.

That message should be legible in under 10 seconds.

## 6. Information Architecture

### 6.1 Main layout

- **Left sidebar**
  - theme toggles
  - quick story presets
  - legend / color language
- **Main hero**
  - interactive globe
  - active global dependency arcs
  - selected story headline
- **Secondary regional panel**
  - Japan map for domestic impact
  - ports, LNG terminals, refineries, reservoirs, prefectures, rice-related regions
- **Right evidence drawer or bottom evidence panel**
  - summary
  - why it matters for Japan
  - source documents
  - related entities
  - SPARQL preview block

### 6.2 Theme order

The sidebar should use this order:

1. Energy
2. Rice
3. Water
4. Defense
5. Semiconductors

This order matches the launch logic:

- start with immediate attention
- bridge into daily life
- then move into deeper strategic layers

Even when the UI starts from `Energy`, the service still centers Japanese life impact rather than global exploration for its own sake.

## 7. MVP Theme Stories

### 7.1 Energy

Primary launch story.

Questions:

- Which countries supply Japan's oil, LNG, and coal?
- Which maritime chokepoints create risk?
- Which Japanese ports, terminals, and refineries matter?
- How does this risk connect to electricity prices and fertilizer costs?

### 7.2 Rice

Primary domestic bridge.

Questions:

- Why are rice prices high?
- What roles do imports, stockpiles, policy decisions, and input costs play?
- How do energy and fertilizer dependencies feed into the rice story?
- Which policy documents and signals are linked to price pressure?

### 7.3 Water

Questions:

- Which prefectures or dam systems show visible stress?
- Where do reservoir and drought conditions matter to households and agriculture?
- How does water stress relate to food and regional resilience?

### 7.4 Defense

Questions:

- Where does FY2026 defense spending go?
- Which budget lines support which capability areas?
- Which organizations, policies, and facilities are linked?

### 7.5 Semiconductors

Questions:

- Which countries matter most to Japan's semiconductor dependency story?
- How do supply-chain, industrial policy, and economic security connect?
- Which source documents and organizations anchor the story?

## 8. Logistics Layer

Logistics should be modeled as a shared explanatory layer across themes.

### 8.1 MVP scope

The MVP should include **ports and receiving infrastructure**, not full domestic logistics.

Included:

- chokepoints such as Hormuz and Malacca
- global sea routes
- major supplier countries
- Japanese major ports
- LNG receiving terminals
- refineries
- selected strategic facilities

Deferred:

- trucking routes
- warehouse networks
- domestic distribution chains

### 8.2 Why this is the correct MVP boundary

This scope is enough to explain:

- energy vulnerability
- import dependence
- fertilizer and input pressure
- rice spillover effects
- facility-level relevance

It keeps the architecture coherent without collapsing into an over-broad logistics platform.

## 9. Semantic Product Model

The product should be designed around canonical semantic entities rather than ad hoc frontend records.

### 9.1 Ontology scope

The semantic layer should be split into five parts:

- `Core ontology`
- `Observation layer`
- `Provenance layer`
- `Presentation layer`
- `Strategic extension`

This prevents semantic drift between:

- what exists in the world
- what is measured
- what supports a claim
- what is shown in the UI
- what is added later for geopolitical context

### 9.2 Core ontology

- `Country`
- `Prefecture`
- `WorldRegion`
- `Resource`
- `Product`
- `PolicyDocument`
- `Law`
- `BudgetLine`
- `CapabilityArea`
- `Organization`
- `Facility`
- `Route`
- `Chokepoint`
- `Port`
- `Terminal`
- `Refinery`
- `Reservoir`
- `SeaLane`
- `DependencyFlow`

Notes:

- `Country` remains in the core model because foreign states are necessary explanatory entities
- `Prefecture` is the main domestic service geography
- `WorldRegion` is optional and should be used only where country-level explanation is insufficient
- `Port`, `Terminal`, `Refinery`, and `Reservoir` should be modeled as specific facility types rather than loose labels

### 9.3 Observation layer

- `Observation`
- `PriceObservation`
- `ImportObservation`
- `ReservoirObservation`
- `WaterObservation`
- `BudgetObservation`
- `DependencyObservation`
- `PolicySignal`

This layer is required because the service does not only show entities.
It also shows time-bound measurements, indicators, and shifts in state.

Examples:

- rice price at a point in time
- reservoir fill rate on a date
- crude oil import share by period
- FY2026 budget amount
- stockpile status

`WaterIndicator` should be treated as an observation or indicator definition, not as a standalone peer to `Country` or `Facility`.

### 9.4 Provenance layer

- `SourceDocument`
- `ExtractedClaim`
- `Citation`
- `DatasetRelease`

Every surfaced fact should be traceable through:

- displayed claim
- extracted or normalized fact
- source document or dataset
- future `prov:wasDerivedFrom` mapping

### 9.5 Presentation layer

- `ThemeLens`
- `StoryPreset`
- `HighlightedQuery`
- `DetailWindow`

This layer is not ontology in the strict world-model sense.
It exists to prevent UI concerns from polluting the core model.

Examples:

- `Energy`, `Rice`, `Water`, `Defense`, `Semiconductors` are theme lenses
- a country pop-up with flag and small map is a presentation artifact, not a semantic entity

### 9.6 Strategic extension

Reserved for Phase 1:

- `StrategicRelation`
- `GeopoliticalEvent`
- `DiplomaticAction`
- `TradeRestriction`
- `Sanction`
- `SecurityIssue`
- `AllianceOrPartnership`

These concepts should only be introduced when they improve explanation for people in Japan.

### 9.7 Ownership and identifier logic

- geography entities are anchored by canonical country/prefecture identifiers
- documents are anchored by stable URLs or official IDs where possible
- facilities are anchored by operator + facility ID/name convention
- flows are anchored by origin + destination + product/resource + period
- observations are anchored by subject + metric + unit + time period
- every item must contain provenance metadata aligned with future `prov:wasDerivedFrom`

### 9.8 Relationship verbs

Important relationship verbs include:

- `dependsOn`
- `exportsTo`
- `importsFrom`
- `transitsVia`
- `landsAt`
- `receivesAt`
- `operatedBy`
- `governedBy`
- `authorizedBy`
- `fundedBy`
- `mentions`
- `affects`
- `measuredBy`
- `observedAt`
- `reportedIn`
- `allocatedTo`
- `derivedFrom`
- `linkedToTheme`

Additional guidance:

- `linkedToTheme` belongs to the presentation layer, not the core ontology
- `affects` should usually point toward a Japanese household, prefectural, or national impact concept
- `DependencyFlow` should not become a catch-all for trade, budget, and impact semantics; use narrower relation types or typed flows where needed

## 10. Knowledge Graph Model

The frontend should behave as a knowledge-graph-first application even while using seeded local files.

That means:

- entity-first data modeling
- explicit edges between records
- graph views derived from the same canonical entity graph
- SPARQL preview shown in the detail panel
- ontology and query examples stored in-repo

## 11. Data and Repository Structure

The repository should include:

- `app/`
- `components/`
- `lib/`
- `types/`
- `data/seed/`
- `ontology/`
- `queries/`
- `public/`
- `docs/`

### 11.1 Seed data expectations

Each theme gets a thin but complete end-to-end slice.

- **Semiconductors**
  - Japan linked to Taiwan, South Korea, Netherlands, United States, China
- **Energy**
  - Japan linked to key oil/LNG/coal supplier countries and routes
- **Rice**
  - prices, stockpile, imports, policy events
- **Water**
  - selected prefectures or reservoir systems
- **Defense**
  - sample FY2026 budget categories and linked capability areas

Every item must include:

- source label
- source URL
- date or period
- provenance fields

## 12. Example Interaction Model

When a user clicks a country, region, node, or route, the interface should show:

- summary
- why it matters for Japan
- source documents
- related entities
- SPARQL preview

The user should understand that the visual is not decorative:

- each selected object is part of a structured graph
- each claim points to a source
- the query path is visible

## 13. MVP Success Criteria

The MVP succeeds if a first-time visitor can do the following in one session:

1. understand that Japan's dependencies are global
2. see that the consequences are domestic
3. inspect a concrete evidence chain
4. recognize that the system is built around structured semantics, not hard-coded prose
5. leave with one memorable insight

Example memorable insight:

> A disruption in Middle East energy routes can propagate into Japanese electricity, fertilizer costs, and rice prices.

## 14. Non-Goals for MVP

The MVP should not attempt:

- a complete national digital twin
- full domestic logistics modeling
- real-time ingestion from every source
- authenticated user workflows
- exhaustive ontology coverage

The correct scope is one polished, coherent public experience.

## 15. Future Technical Expansion

The MVP should prepare for:

- RDF graph storage
- SPARQL endpoint integration
- OWL ontology growth
- SHACL validation
- scheduled ingestion and provenance updates
- richer cross-theme reasoning

## 16. Recommended Launch Narrative

The launch should present one sharp storyline:

> Japan's household risk is not only domestic. It starts on global routes, crosses ports and terminals, and arrives in prices, infrastructure, and public budgets.

Suggested rollout sequence:

1. `Energy` hero on the globe
2. bridge to `Rice`
3. surface `Water`
4. connect to `Defense`
5. expand to `Semiconductors`

## 17. Implementation Guidance for Next Step

The next phase should produce:

- a Next.js App Router scaffold
- a premium visual shell
- one complete slice per theme
- ontology stubs in Turtle
- example SPARQL files
- seeded local semantic data

The implementation plan should preserve one shared model and one shared UI system rather than treating each theme as a disconnected mini-app.
