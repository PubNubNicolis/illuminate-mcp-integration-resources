---
name: "Phase 1 — Illuminate Documentation API"
overview: >
  Publish 9 Illuminate how-to guides and the Illuminate best-practice sections to the
  PubNub documentation API, then register the new slugs in pubnub-mcp-server so Claude
  can fetch them via the how_to() tool. This phase is independent of the manage_illuminate
  tool and should be completed first so Claude has reference material the moment the tool ships.
todos:
  - id: complete-missing-files
    content: >
      Before opening any PR: (1) Review and complete how-tos/how_to_automate_illuminate_with_scripts.md
      — the stub exists but needs review for accuracy. (2) Create the set-up-illuminate-gaming
      guide in the documentation-api repo using the outline in this file. Both files must exist
      before the PR is opened.
    status: pending
  - id: publish-howto-files
    content: >
      Copy the 9 how-to markdown files from illuminate-mcp/how-tos/ into the
      documentation-api repo (github.com/PubNubDevelopers/documentation-api) using
      the slug mapping table below and open a PR.
    status: pending
  - id: publish-best-practices
    content: >
      Add the Illuminate best-practice sections (§13–19 of illuminate-mcp/bestpractice.md)
      to the /best-practice endpoint content in the documentation-api repo.
    status: pending
  - id: add-slugs-to-schemas
    content: >
      Once the documentation-api PR is merged, add the 9 new slugs to howToSlugs in
      pubnub-mcp-server/src/lib/docs/schemas.ts and open a PR.
    status: pending
  - id: verify-how-to-tool
    content: >
      Verify that how_to(slug="illuminate-decisions") resolves correctly via the
      pubnub-mcp-server how_to tool after both PRs are merged.
    status: pending
isProject: false
---

# Phase 1 — Illuminate Documentation API

## Context

The `how_to` tool in `pubnub-mcp-server` fetches content from `docs.pubnubtools.com`.
Valid slugs are hardcoded in `howToSlugs` in `src/lib/docs/schemas.ts`. The 9 Illuminate
how-to files currently live in `illuminate-mcp/how-tos/` and are not accessible through
the tool until they are published to the docs API and their slugs registered.

This phase must be done first (or at minimum concurrently with Phase 2) so that when
the `manage_illuminate` tool ships, Claude can immediately call:

```
how_to(slug="how-to-create-illuminate-decisions")
how_to(slug="how-to-create-illuminate-business-objects")
...
```

---

## Repos involved

| Repo | Path | Action |
|---|---|---|
| `PubNubDevelopers/documentation-api` | `github.com/PubNubDevelopers/documentation-api` | Publish how-to files + best practices |
| `pubnub-mcp-server` | `/Users/nicolis.miller/Documents/GitHub/pubnub-mcp-server` | Add slugs to `src/lib/docs/schemas.ts` |

---

## Step 1 — Publish how-to files to documentation-api

The 9 source files live in:

```
/Users/nicolis.miller/Documents/GitHub/illuminate-mcp/how-tos/
```

### Slug mapping

| Source file | Slug |
|---|---|
| *(new gaming/live events guide — create this file)* | `set-up-illuminate-gaming` |
| `how_to_create_illuminate_business_objects.md` | `how-to-create-illuminate-business-objects` |
| `how_to_create_illuminate_metrics.md` | `how-to-create-illuminate-metrics` |
| `how_to_create_illuminate_queries.md` | `how-to-create-illuminate-queries` |
| `how_to_create_illuminate_decisions.md` | `how-to-create-illuminate-decisions` |
| `how_to_create_illuminate_dashboards.md` | `how-to-create-illuminate-dashboards` |
| `how_to_automate_illuminate_with_scripts.md` | `how-to-automate-illuminate-with-scripts` |
| `how_to_test_illuminate_with_fake_data.md` | `how-to-test-illuminate-with-fake-data` |
| `how_to_analyze_illuminate_data.md` | `how-to-analyze-illuminate-data` |

Each file already has YAML frontmatter with `resource`, `triggers`, `requires`, and
`produces` fields that the docs API can use for indexing. The files also contain
`## Using the manage_illuminate Tool` sections with MCP tool-call JSON examples added
during the illuminate-mcp work session.

### Pre-requisite: complete the two missing files before opening the PR

**`how_to_automate_illuminate_with_scripts.md`** — A stub exists in `illuminate-mcp/how-tos/`.
Review it for accuracy and completeness before publishing.

**`set-up-illuminate-gaming`** — This guide does not exist yet and must be created in the
documentation-api repo. Use the outline below.

#### Outline for `set-up-illuminate-gaming`

Slug: `set-up-illuminate-gaming`

Sections to cover:

1. **What Illuminate does for live events and gaming** — real-time KPI tracking, automated
   rewards, spam protection, engagement re-activation. One paragraph, outcome-focused.

2. **Playbook 1 — Reward Engagement**
   - Business goal: encourage active participation (poll answers, chat, reactions)
   - Recommended path: Metrics + Dashboards + Decisions (with optional Query Builder for Top N / Bottom N ranking)
   - Step-by-step: create BO with user/channel/event-type fields, create COUNT metrics per behavior, create dashboard charts, create Decisions with per-rule rate limits (1 per day per user), optionally add engagement drop alert
   - Predefined templates: Top N Rankings, Bottom N Rankings (do not recreate manually)

3. **Playbook 2 — Spam Detection**
   - Business goal: detect flooding and cross-posting, escalate automatically
   - Recommended path: Query Builder predefined templates + Decisions
   - Step-by-step: create/confirm BO (built-in fields auto-created for chat), use Chat Flooding Spam and/or Cross-Posting Spam templates, create escalating Decision (low → notify; medium → notify + mute; high → notify + mute + ban)
   - Note: built-in BO fields (User, Channel, Message, Message Type) are auto-created — do not ask users to define them

4. **Using the manage_illuminate Tool** — show the key tool calls:
   - Create BO, activate, create COUNT metric, create Decision with escalating rules, publish fake test data (chat-flooding scenario), check action log

5. **Tips** — use per-rule execution rate limits to prevent reward/action spam; match Decision `executionFrequency` to the metric `evaluationWindow`; validate thresholds on dashboards before enabling Decisions in production

---

## Step 2 — Publish Illuminate best-practice sections

Source file: `/Users/nicolis.miller/Documents/GitHub/illuminate-mcp/bestpractice.md`

Sections §13–19 cover Illuminate-specific best practices. These need to be added to
the content served by the `/best-practice` endpoint in the documentation-api repo,
which is what the `write_pubnub_app` tool fetches.

---

## Step 3 — Add slugs to pubnub-mcp-server

File: `pubnub-mcp-server/src/lib/docs/schemas.ts`

Find the `howToSlugs` array and add the 9 new slugs after the last existing entry
(`"write-a-pubnub-app"` at line 756). The existing array looks like:

```typescript
export const howToSlugs = [
  // ... existing slugs ...
] as const;
```

Add these 9 entries:

```typescript
"set-up-illuminate-gaming",
"how-to-create-illuminate-business-objects",
"how-to-create-illuminate-metrics",
"how-to-create-illuminate-queries",
"how-to-create-illuminate-decisions",
"how-to-create-illuminate-dashboards",
"how-to-automate-illuminate-with-scripts",
"how-to-test-illuminate-with-fake-data",
"how-to-analyze-illuminate-data",
```

After this change, Claude will be able to call `how_to(slug="how-to-create-illuminate-decisions")`
the same way it calls any other guide today — consistent with the existing pattern.

---

## Step 4 — Verify

After both PRs are merged and deployed:

1. Call `how_to(slug="how-to-create-illuminate-decisions")` via the MCP tool
2. Confirm the response contains the decision creation workflow content
3. Spot-check `how_to(slug="how-to-create-illuminate-business-objects")` for JSONPath guidance

---

## Dependency note

This work is independent of the `manage_illuminate` tool implementation (Phase 2).
The tool is functional without the docs, but Claude will be significantly more effective
if the how-to guides are available. Complete Phase 1 before or alongside Phase 2.
