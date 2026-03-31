---
name: "Phase 3 — Illuminate Prompts and Tests"
overview: >
  Merge the 4 Illuminate MCP prompts into pubnub-mcp-server/src/prompts.ts and write
  the handler test suite. Depends on Phase 2 (manage_illuminate core tool) being complete
  and merged before this phase begins.
todos:
  - id: merge-prompts
    content: >
      Add 4 Illuminate prompt constants to pubnub-mcp-server/src/prompts.ts
      (illuminate-spam-detection, illuminate-reward-engagement, illuminate-use-case,
      illuminate-test-verify) and append them to the prompts[] export array.
    status: pending
  - id: create-handler-tests
    content: >
      Create src/lib/illuminate/handlers.test.ts — vitest unit tests with MSW stubs
      for all CRUD operations, 2-step decision create, default injection, analysis
      operations, and error paths.
    status: pending
  - id: run-tests
    content: Run npm test in pubnub-mcp-server and confirm all tests pass.
    status: pending
  - id: final-build
    content: Run npm run build in pubnub-mcp-server — final build check.
    status: pending
isProject: false
---

# Phase 3 — Illuminate Prompts and Tests

## Target repo

```
/Users/nicolis.miller/Documents/GitHub/pubnub-mcp-server
```

**Prerequisite:** Phase 2 (manage_illuminate core tool) must be merged before this phase.
The test file (`handlers.test.ts`) tests the handler created in Phase 2.

---

## Step 1 — Merge prompts into src/prompts.ts

Source file: `/Users/nicolis.miller/Documents/GitHub/illuminate-mcp/prompts.ts`

Read the existing `pubnub-mcp-server/src/prompts.ts` to see the current 9 prompts and
the `generateHandler` pattern. Then add the 4 Illuminate constants below and append them
to the `prompts[]` export.

### Constants to add

Add these 4 constants after the last existing prompt constant and before the `export const prompts` line:

```typescript
const illuminateSpamDetection = {
  name: "illuminate-spam-detection",
  definition: {
    title: "Set Up Illuminate Spam Detection",
    description:
      "Guided setup of a complete Illuminate spam detection pipeline (message flooding and cross-posting)",
  },
  handler: generateHandler(
    "Act as a community moderator and use PubNub MCP to set up Illuminate spam detection. Start by asking: Is the concern chat flooding (one user sending too many messages in one channel), cross-posting (the same message sent to many channels), or both? For each pattern, use the predefined Illuminate Query Builder template — do NOT recreate the query logic manually. For chat spam use cases, the Business Object fields User, Channel, Message, and Message Type are automatically created by Illuminate — do not ask the user to define them. Before creating anything, describe the detection approach in 1–2 sentences in plain English. Then show an escalating decision table with three severity rows: Low → notify moderator (quiet alert); Medium → notify + mute user in channel; High → notify + mute + ban user from channel. Ask the user to confirm: (a) the time window (default: 60 seconds), (b) the message count or channel count thresholds for each severity level, and (c) which actions to enable per row. After confirmation: create the Business Object if not already active, use the Query Builder template for the selected spam pattern(s), create the Decision with the confirmed escalating rules, and activate. Publish fake test data to verify the Decision fires correctly. Show the action log to confirm."
  ),
};

const illuminateRewardEngagement = {
  name: "illuminate-reward-engagement",
  definition: {
    title: "Reward Engagement in Live Events",
    description:
      "Guided setup of an Illuminate engagement reward pipeline for live events and gaming",
  },
  handler: generateHandler(
    "Act as a live events manager and use PubNub MCP to set up Illuminate engagement rewards. Start by asking which participation behaviors to reward: poll answers, chat messages, reactions, or re-engaging low-engagement users (or a combination). For ranking rewards (Top N most chatty, Top N by reactions, Bottom N by engagement), use the predefined Illuminate Query Builder templates — do NOT recreate the ranking logic manually. Before creating anything, describe the reward approach in 1–2 sentences in plain English. Then show a decision table: Poll answered → reward points or badge; Top N most chatty → Incentive A; Top N by reactions → Incentive B; Bottom N by engagement → Incentive C (re-engagement nudge). Ask the user to confirm: (a) which rows to enable, (b) the reward or incentive for each, (c) the evaluation window, and (d) a per-rule rate limit (default: once per day per user) to prevent duplicate rewards. After confirmation: create the Business Object capturing poll, chat, and reaction events (fields: user, channel, event type). Create COUNT metrics — one per behavior being measured. Create a Dashboard with an engagement trend chart and active vs inactive user breakdown. Create the Decision(s) with the confirmed rules and rate limits, and activate. Optionally: if the user wants an engagement drop alert, add a rule that fires when overall channel activity drops below a threshold and notifies moderators. Publish fake test data to verify rewards fire correctly. Show the action log to confirm."
  ),
};

const illuminateUseCase = {
  name: "illuminate-use-case",
  definition: {
    title: "Set Up an Illuminate Use Case",
    description:
      "Guided setup of a new Illuminate analytics and automation use case",
  },
  handler: generateHandler(
    "Act as a product manager and use PubNub MCP to set up a complete Illuminate use case. Follow this guided flow: Step 0 — Identify the goal. Ask: (1) What outcome do you want? Choose from: reward and incentivize desired behavior (e.g. most engaged users, high spenders, poll participants); prevent spam or abuse; alert when operational metrics like wait time or failure rates exceed normal; or automate live event or auction actions. (2) What should Illuminate do when the condition is met? Options: notify via webhook or channel message, reward or badge a user, mute or moderate a user, or trigger an external workflow. (3) How quickly should it react? Immediately on each event, near real-time every 1–5 minutes, or trend-based every 10–60 minutes. Step 1 — Choose the simplest implementation path: if the goal is spam (flooding or cross-posting) or ranking (Top N / Bottom N), use the Query Builder predefined templates. Otherwise use Metrics + Dashboard + Decision. Step 2 — Confirm data. Ask for one of: a sample event (JSON), a list of fields already in the payload, or where the data currently lives. Step 3 — Preview before building. Describe the automation in 1–2 sentences in plain English. Present the decision logic as a conditions → actions table with one rule per row. Ask for confirmation and threshold adjustments before creating any Illuminate resources. Step 4 — Build: create the Business Object (or confirm the existing one is active), create 1–3 Metrics for KPI visibility and tuning, create a Dashboard chart, then create and activate the Decision using the confirmed thresholds. Step 5 — Validate: publish fake test data, check the dashboard and action log, and suggest threshold or rate-limit adjustments based on results."
  ),
};

const illuminateTestVerify = {
  name: "illuminate-test-verify",
  definition: {
    title: "Test and Verify Illuminate Setup",
    description:
      "Step-by-step test and verification workflow for an existing Illuminate configuration",
  },
  handler: generateHandler(
    "Act as a developer and use PubNub MCP to test and verify my existing Illuminate setup. 1. List all Business Objects and confirm the relevant one is active. 2. Check which fields are populated using a field-health query — flag any fields returning empty strings as potential JSONPath mismatches. 3. Publish a small set of fake test messages (generic scenario) to the subscribe key. Wait 30 seconds for Illuminate ingestion. 4. Run a raw-snapshot query to confirm messages are being captured. 5. Check the action log for any active Decisions to confirm they are evaluating data. Report any issues found and suggest fixes. If Decisions are firing too frequently or not at all, suggest adjustments to time window, thresholds, filters, and execution rate limits."
  ),
};
```

### Export array

Append to the existing `prompts[]` export (after `multiTenantOnboardingLong`):

```typescript
export const prompts = [
  // ...existing 9 prompts unchanged...
  illuminateSpamDetection,
  illuminateRewardEngagement,
  illuminateUseCase,
  illuminateTestVerify,
];
```

---

## Step 2 — Create handlers.test.ts

File: `src/lib/illuminate/handlers.test.ts`

Follow the exact same vitest + MSW pattern used in `src/lib/portal/handlers.test.ts`.
Read that file before starting to match the mock setup and assertion style.

### Test coverage checklist

**CRUD operations — test each for at least one resource type:**
- [ ] `list` — GET returns array of resources
- [ ] `get` — GET by ID returns single resource
- [ ] `create` — POST returns created resource
- [ ] `update` — PUT returns updated resource
- [ ] `delete` — DELETE 204 returns `{ success: true }`
- [ ] `activate` — PUT isActive/enabled true
- [ ] `deactivate` — PUT isActive/enabled false

**Decision create 2-step workflow:**
- [ ] POST scaffold is called first (with `rules: []`)
- [ ] PUT is called second with full body including rules
- [ ] Auto-generated IDs from POST response appear in PUT rules

**Default injection:**
- [ ] `hitType` is injected as `"SINGLE"` when absent from data
- [ ] `executeOnce` is injected as `false` when absent
- [ ] `activeFrom` is injected when absent
- [ ] `activeUntil` is injected when absent

**Query / analysis operations:**
- [ ] `execute-adhoc` — POST /queries/execute returns results
- [ ] `get-fields` — GET /queries/:id/fields returns field list
- [ ] `verify-query` — executes saved query by ID
- [ ] `check-action-log` — GET /decisions/:id/action-log returns entries
- [ ] `raw-snapshot` — runs ad-hoc pipeline via queries/execute
- [ ] `field-health` — identifies empty vs populated fields

**Error paths:**
- [ ] 400 METRIC decision limit (more than 3) returns helpful error message
- [ ] 500 on missing `hitType` / `executeOnce` is caught and surfaced clearly
- [ ] Missing `ILLUMINATE_API_KEY` (no arg, no env var) throws with guidance
- [ ] `400` inputValues count mismatch is passed through with original message

### MSW stub setup pattern

```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "https://admin-api.pubnub.com/v2/illuminate";

const server = setupServer(
  http.get(`${BASE}/business-objects`, () =>
    HttpResponse.json({ data: [] })
  ),
  http.post(`${BASE}/decisions`, () =>
    HttpResponse.json({ id: "dec-123", inputFields: [], outputFields: [], actions: [], rules: [] }, { status: 201 })
  ),
  // ... more stubs
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Step 3 — Run tests

```bash
cd /Users/nicolis.miller/Documents/GitHub/pubnub-mcp-server
npm test
```

All existing tests must continue to pass. New Illuminate tests must also pass.

---

## Step 4 — Final build check

```bash
npm run build
```

Zero TypeScript errors. Zero warnings on the new illuminate module files.
