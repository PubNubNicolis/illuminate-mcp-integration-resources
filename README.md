# PubNub Illuminate MCP

This repository contains the planning and reference materials for adding Illuminate support to the `@pubnub/mcp` npm package.

---

## Contents

### `illuminate_mcp_architecture_plan.md`

The master integration plan for adding `manage_illuminate` — a single new tool — to the production `pubnub-mcp-server` TypeScript package. Covers the module structure, tool schema, authentication, decision create flow, environment config, Claude behavior instructions, testing approach, documentation API work, and a complete change summary.

Read this first to understand what is being built and why.

---

### `phases/`

The execution roadmap, split into three self-contained phase plans. Each file is written for a future Claude to pick up and implement independently.

| File | Goal | Depends on |
| ---- | ---- | ---------- |
| `phase-1-documentation-api.md` | Publish 9 how-to guides and Illuminate best-practice sections to the documentation API; register 9 slugs in `pubnub-mcp-server/src/lib/docs/schemas.ts` | Nothing — start first |
| `phase-2-core-tool.md` | Implement the `manage_illuminate` tool in `pubnub-mcp-server` (4-file module, `tools.ts` wiring, env config, build verification) | Phase 1 in progress |
| `phase-3-prompts-and-tests.md` | Merge 4 Illuminate prompts into `src/prompts.ts`, write the handler test suite, final build check | Phase 2 merged |

**Recommended order:** Start Phase 1 immediately (it is independent). Begin Phase 2 once Phase 1 is in progress so documentation is available when the tool ships. Phase 3 follows Phase 2.

---

### `how-tos/`

Step-by-step guides for every Illuminate resource type. 8 of these files exist today; `how_to_automate_illuminate_with_scripts.md` still needs to be created before Phase 1 ships.

| File | Topic | Published to docs API? |
| ---- | ----- | ---------------------- |
| `how_to_get_an_illuminate_api_key.md` | Generating a Service Integration API key from PubNub Portal | No — local reference only |
| `how_to_create_illuminate_business_objects.md` | Creating, configuring, and activating Business Objects | Yes — `how-to-create-illuminate-business-objects` |
| `how_to_create_illuminate_metrics.md` | Creating COUNT, SUM, AVG, MIN, MAX metrics | Yes — `how-to-create-illuminate-metrics` |
| `how_to_create_illuminate_queries.md` | Creating and running saved queries | Yes — `how-to-create-illuminate-queries` |
| `how_to_create_illuminate_decisions.md` | Creating all 3 decision types with the 4-step workflow | Yes — `how-to-create-illuminate-decisions` |
| `how_to_create_illuminate_dashboards.md` | Creating dashboards with charts and decision overlays | Yes — `how-to-create-illuminate-dashboards` |
| `how_to_test_illuminate_with_fake_data.md` | Publishing fake messages and verifying decisions fire | Yes — `how-to-test-illuminate-with-fake-data` |
| `how_to_analyze_illuminate_data.md` | Running ad-hoc queries to inspect live Business Object data | Yes — `how-to-analyze-illuminate-data` |
| `how_to_automate_illuminate_with_scripts.md` | Python script automation for Illuminate *(needs to be created)* | Yes — `how-to-automate-illuminate-with-scripts` |

A tenth guide (`set-up-illuminate-gaming`) covering live events and gaming use cases also needs to be created and published. See `phases/phase-1-documentation-api.md` for the full slug mapping.

Each existing file has YAML frontmatter (`resource`, `triggers`, `requires`, `produces`) and a `## Using the manage_illuminate Tool` section with MCP tool-call JSON examples.

---

### `bestpractice.md`

The full PubNub best practices guide. Sections 13–19 cover Illuminate and will be added to the `/best-practice` endpoint in `PubNubDevelopers/documentation-api`, making them accessible via the `write_pubnub_app` tool. All `manage_illuminate` tool references throughout are correct.

---

### `prompts.ts`

MCP prompt definitions in the same format used by `pubnub-mcp-server/src/prompts.ts`. Contains all 9 existing PubNub prompts plus 4 new Illuminate-specific prompts (13 total). The 4 Illuminate prompts will be merged into `src/prompts.ts` in `pubnub-mcp-server` as part of Phase 3.

| Prompt name | Title | Persona |
| ----------- | ----- | ------- |
| `illuminate-spam-detection` | Set Up Illuminate Spam Detection | Community moderator |
| `illuminate-reward-engagement` | Reward Engagement in Live Events | Live events manager |
| `illuminate-use-case` | Set Up an Illuminate Use Case | Product manager |
| `illuminate-test-verify` | Test and Verify Illuminate Setup | Developer |

All 4 prompts follow the preview-first approach: describe the automation in plain English, show a conditions → actions decision table, confirm with the user, then build.

---

## Related repositories

| Repo | Role |
| ---- | ---- |
| [`pubnub/pubnub-mcp-server`](https://github.com/pubnub/pubnub-mcp-server) | Production TypeScript MCP server — where `manage_illuminate` will be implemented |
| [`PubNubDevelopers/documentation-api`](https://github.com/PubNubDevelopers/documentation-api) | Hosts how-to and best-practice content fetched by the `how_to` and `write_pubnub_app` tools |
