# PubNub Illuminate MCP

This repository contains the planning and reference materials for adding Illuminate support to the `@pubnub/mcp` npm package.

---

## Contents

### `illuminate_mcp_architecture_plan.md`

The integration plan for adding `manage_illuminate` — a single new tool — to the production `pubnub-mcp-server` TypeScript package. Covers the module structure, tool schema, authentication, decision create flow, environment config, testing approach, documentation API work, and a complete change summary.

Read this first to understand what is being built and why.

---

### `how-tos/`

Step-by-step guides for every Illuminate resource type. These are the source files that will be published to the `PubNubDevelopers/documentation-api` repo so they are accessible via the `how_to` tool in `pubnub-mcp-server`.

| File | Topic |
| ---- | ----- |
| `how_to_get_an_illuminate_api_key.md` | Generating a Service Integration API key from PubNub Portal |
| `how_to_create_illuminate_business_objects.md` | Creating, configuring, and activating Business Objects |
| `how_to_create_illuminate_metrics.md` | Creating COUNT, SUM, AVG, MIN, MAX metrics |
| `how_to_create_illuminate_queries.md` | Creating and running saved queries |
| `how_to_create_illuminate_decisions.md` | Creating all 3 decision types with the 2-step workflow |
| `how_to_create_illuminate_dashboards.md` | Creating dashboards with charts and decision overlays |
| `how_to_test_illuminate_with_fake_data.md` | Publishing fake messages and verifying decisions fire |
| `how_to_analyze_illuminate_data.md` | Running ad-hoc queries to inspect live Business Object data |

---

### `bestpractice.md`

The full PubNub best practices guide. Sections 13–19 cover Illuminate and will be added to the `/best-practice` endpoint in `PubNubDevelopers/documentation-api`, making them accessible via the `write_pubnub_app` tool.

---

### `prompts.ts`

MCP prompt definitions in the same format used by `pubnub-mcp-server/src/prompts.ts`. Contains all 9 existing PubNub prompts plus 5 new Illuminate-specific prompts:

| Prompt name | Purpose |
| ----------- | ------- |
| `illuminate-spam-detection-short` | One-line spam detection setup trigger |
| `illuminate-spam-detection-long` | Full guided spam detection pipeline (flooding + cross-posting) |
| `illuminate-use-case-short` | One-line Illuminate use-case setup trigger |
| `illuminate-use-case-long` | Full guided setup — BO, Metric, Decision, Dashboard, test data |
| `illuminate-test-verify` | Step-by-step verification of an existing Illuminate configuration |

These prompts will be added to `src/prompts.ts` in `pubnub-mcp-server` as part of the integration.

---

## Related repositories

| Repo | Role |
| ---- | ---- |
| [`pubnub/pubnub-mcp-server`](https://github.com/pubnub/pubnub-mcp-server) | Production TypeScript MCP server — where `manage_illuminate` will be implemented |
| [`PubNubDevelopers/documentation-api`](https://github.com/PubNubDevelopers/documentation-api) | Hosts how-to and best-practice content fetched by the `how_to` and `write_pubnub_app` tools |
