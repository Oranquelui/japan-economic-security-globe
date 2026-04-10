# Business Model and Roadmap

**Project:** `japan-economic-security-globe`  
**Date:** 2026-04-10  
**Status:** Phase model and monetization thesis for review before app design

## 1. Business Thesis

The public product should remain free through Phase 1.

The paid business should start in Phase 2, but the paid product should not be a paywalled version of the public site. The public site creates trust, attention, citations, and proof of semantic-web capability.

The paid product should sell:

- private workspaces
- alerts and monitoring
- API and data access
- internal data integration
- scenario analysis
- custom ontology and implementation services

The guiding model is similar to Palantir's public positioning: do not sell a dashboard; sell an ontology-backed operational workflow that helps institutions make decisions.

## 2. Product Identity

The product remains:

> A public-interest semantic intelligence service for people in Japan.

The free product explains dependencies and impact for citizens.
The paid product helps institutions monitor, query, and operationalize the same dependency intelligence against their own decisions and data.

## 3. What Stays Free

The following should stay free:

- public website
- Japan operations map, global supporting layer, operations table, and evidence graph
- public seeded data
- core source provenance
- basic SPARQL examples
- public ontology stubs
- core story lenses for Energy, Rice, Water, Defense, and Semiconductors
- Phase 1 strategic neighborhood public layer

Reasons:

- preserves civic legitimacy
- supports GitHub/public portfolio value
- generates links and discussion
- proves ontology and semantic-web skill publicly
- creates the top of funnel for institutional buyers

## 4. What Becomes Paid in Phase 2

### 4.1 Institutional Workspace

Private workspace for teams.

Features:

- saved views
- watchlists
- private notes
- team-shared story boards
- private entity overlays
- internal source registry

Buyer:

- corporate strategy
- risk management
- supply chain
- research teams

### 4.2 Alerts and Monitoring

Monitoring workflows over dependency graph signals.

Examples:

- Hormuz risk affects oil import routes
- LNG supply shock affects electricity exposure
- energy and fertilizer pressure affects rice story
- water stress affects agriculture and regional risk
- policy or budget document changes affect defense or industrial strategy

Delivery:

- email
- Slack
- Teams
- webhook
- periodic briefing

This is likely the easiest first paid feature because buyers understand monitoring and alerts.

### 4.3 Private Data and Internal Source Integration

Customer-owned data layered onto the public ontology.

Inputs:

- CSV
- spreadsheets
- PDFs
- procurement files
- internal reports
- supplier lists
- facility lists

Outputs:

- mapped entities
- private evidence graph
- private dependency overlays
- team-specific SPARQL or graph queries

This is where the product becomes meaningfully defensible.

### 4.4 API and Data License

Programmatic access to normalized graph data and source-linked claims.

Possible surfaces:

- JSON API
- GraphQL API
- SPARQL endpoint
- bulk export
- periodic data package

Buyers:

- financial research
- newsrooms
- consultancies
- think tanks
- research groups

### 4.5 Scenario and Simulation Layer

Scenario workflows that answer "what if" questions.

Examples:

- if Hormuz closes, which energy routes and domestic impacts are exposed?
- if LNG prices rise, which themes and facilities show stress?
- if a rice policy changes, what source-linked entities are involved?
- if a neighboring-country event occurs, which Japanese dependencies become relevant?

This should be sold as decision support, not as prediction.

### 4.6 Bootcamp and Custom Ontology Build

Short, high-intensity service engagement.

Format:

- two to six weeks
- one buyer-specific dependency domain
- ontology design
- private data mapping
- first operational workspace
- final demo and handoff

This is the most Palantir-like motion.

It should not be described as generic consulting.
It should be described as building an operational semantic layer for a concrete institutional decision problem.

## 5. Buyer Personas

### 5.1 Best First Buyers

1. Energy, trading, logistics, and manufacturing companies
2. Supply-chain and procurement risk teams
3. Think tanks and policy research teams
4. Newsrooms and data journalism teams
5. Financial research and macro risk teams

Why:

- they already care about dependency, logistics, policy, and source evidence
- they can benefit from both public data and private overlays
- they can understand alerts and scenario workflows

### 5.2 Later Buyers

- local governments
- national government-adjacent organizations
- public agencies
- universities

Why later:

- high mission fit
- slower procurement
- more formal trust and governance requirements

## 6. Packaging

### 6.1 Free Public Layer

Purpose:

- civic service
- credibility
- public attention
- GitHub proof

Includes:

- public site
- core ontology files
- source-linked stories
- basic SPARQL examples
- public evidence graph

### 6.2 Pro Institutional Layer

Purpose:

- recurring SaaS revenue

Includes:

- workspace
- saved queries
- watchlists
- alerts
- exports
- team sharing

Pricing logic:

- seat + workspace
- alert volume
- export/API volume

### 6.3 Custom Strategic Layer

Purpose:

- high-value implementation revenue

Includes:

- private ontology extension
- private data integration
- custom connectors
- scenario workflows
- decision brief generation
- deployment support

Pricing logic:

- fixed-scope bootcamp
- larger annual contract if it becomes operational

## 7. Product Units

### Public unit

- story
- entity
- source graph
- public query

### Analyst unit

- saved view
- saved query
- watchlist
- export
- alert rule

### Team unit

- workspace
- shared ontology overlay
- source registry
- briefing collection

### Enterprise unit

- private connector
- private graph
- API access
- SSO
- audit log
- SLA

### Services unit

- bootcamp
- ontology sprint
- custom deployment
- data mapping project

## 8. Roadmap

### Phase 0: Public MVP

Goal:

- launch a polished public site that proves the concept

Scope:

- Energy-led hybrid hero
- Rice, Water, Defense, and Semiconductors as complete thin slices
- Japan operations map, global supporting layer, operations table, and evidence graph
- seeded local JSON/TTL data
- `ontology/` Turtle stubs
- `queries/` SPARQL examples
- provenance fields on all seeded facts

Business model:

- free
- no auth
- no paid features

Success signal:

- people understand the core question in under 10 seconds
- GitHub repo demonstrates OWL/RDF/SPARQL capability
- public users share the visual and source-linked insight

### Phase 1: Strategic Neighborhood Layer

Goal:

- increase explanatory power without changing the audience

Scope:

- neighboring-country relationship layer
- strategic events
- sea lanes
- trade restrictions
- sanctions
- diplomatic actions
- alliance and partnership context

Business model:

- still free
- public trust-building phase

Success signal:

- the service explains why external geopolitical events matter to people in Japan
- the ontology remains coherent as strategic concepts are added

### Phase 2: Institutional Product

Goal:

- convert public credibility into institutional revenue

Scope:

- private workspaces
- alerts and monitoring
- saved queries
- team sharing
- API/data export
- private source overlays
- first customer-specific ontology bootcamps

Business model:

- paid institutional tier
- custom strategic layer
- no consumer paywall

Success signal:

- at least one institutional team pays for monitoring, workspace, data access, or a custom ontology sprint

### Phase 3: Operational Semantic Platform

Goal:

- become a repeatable dependency intelligence platform

Scope:

- dedicated graph backend
- production SPARQL endpoint or graph query layer
- ingestion pipelines
- validation with SHACL
- customer-specific graph overlays
- scenario workflows
- audit and governance features

Business model:

- annual contracts
- API/data licenses
- custom strategic deployments

Success signal:

- the system is used for repeated institutional decisions, not just occasional reading

## 9. What Not To Sell

Do not start with:

- consumer subscriptions
- article paywalls
- generic dashboard licenses
- "premium news" positioning
- paid access to the public civic layer

These would weaken the public-interest brand and underprice the semantic layer.

## 10. Palantir-Inspired Principle

The lesson is not to copy Palantir's visual style.

The lesson is:

> Turn data into an ontology, turn the ontology into workflows, and sell the workflows to institutions that need to make decisions.

For this project, that means:

- public site = proof and trust
- private workspace = operational value
- custom ontology = high-value service
- API/data license = scalable institutional access

## 11. Open Questions Before App Design

- Which Phase 0 screens must visibly support future workspaces without adding auth now?
- Which entities should be intentionally stable enough for later paid APIs?
- Which public data should be treated as canonical enough for Phase 2 demos?
- What is the first paid workflow to prototype visually: alerts, workspace, or scenario analysis?

Recommended answer:

- visually prepare for `alerts` and `workspace`
- do not build auth or private data in Phase 0
- keep data model stable enough for later paid API and workspace overlays
