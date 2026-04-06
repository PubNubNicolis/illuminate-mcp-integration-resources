---
name: "Phase 4 — Illuminate Implementation Validation"
overview: >
  An AI-driven end-to-end validation of the manage_illuminate tool against the real
  Illuminate API. Claude runs a structured sequence of manage_illuminate tool calls,
  verifies expected results at each step, and produces a pass/fail report. Depends on
  Phase 2 and Phase 3 being merged, ILLUMINATE_API_KEY being set, and PUBNUB_PUBLISH_KEY
  and PUBNUB_SUBSCRIBE_KEY being available for the publish-fake-data steps.
todos:
  - id: run-list-checks
    content: >
      Call list for each resource type (business-object, metric, query, decision, dashboard)
      and confirm each returns valid JSON with no errors.
    status: pending
  - id: run-pipeline-creation
    content: >
      Create a complete BO → Metric → Decision → Dashboard test pipeline. Capture and
      verify IDs at each step.
    status: pending
  - id: verify-decision-workflow
    content: >
      Confirm the 2-step Decision create ran correctly: response has rules populated, hitType
      and executeOnce are set, activeUntil is approximately 2 years from now (not a hardcoded date).
    status: pending
  - id: verify-data-flow
    content: >
      Activate the test BO, publish fake data (generic + chat-flooding scenarios), wait 30
      seconds, run field-health and raw-snapshot to confirm data is flowing.
    status: pending
  - id: verify-decision-fires
    content: >
      Check the action log on the test Decision and confirm at least one entry appears.
    status: pending
  - id: verify-error-paths
    content: >
      Attempt to create a 4th METRIC decision and confirm the 3-decision-limit error is
      returned with a helpful message. Attempt publish-fake-data without keys and confirm
      the actionable error message is returned.
    status: pending
  - id: cleanup
    content: >
      Delete all test resources in reverse dependency order: Dashboard → Decision → Metric
      → Business Object. Confirm each deletion returns success.
    status: pending
  - id: produce-report
    content: >
      Summarize all pass/fail results. If any step failed, include the exact error and a
      suggested fix. Output the full report as a final message.
    status: pending
isProject: false
---

# Phase 4 — Illuminate Implementation Validation

## Purpose

This phase validates that the `manage_illuminate` tool works correctly against the **real**
Illuminate API. It is not a substitute for the unit tests in Phase 3 (which use MSW stubs).
This is an end-to-end smoke test run by Claude using the live tool.

Run this after Phase 2 and Phase 3 are merged and the server is running with a valid
`ILLUMINATE_API_KEY`.

---

## Prerequisites

Before starting:

- `ILLUMINATE_API_KEY` is set (starts with `si_`)
- `PUBNUB_PUBLISH_KEY` and `PUBNUB_SUBSCRIBE_KEY` are set (required for Steps 4 and 5)
- The `manage_illuminate` tool is available in the MCP server
- No existing test resources from a prior run are blocking (check with Step 1 lists)

---

## Step 1 — List all resource types

Call `list` for each resource type. Each call must return valid JSON with no errors.

```json
{ "resource": "business-object", "operation": "list" }
{ "resource": "metric",          "operation": "list" }
{ "resource": "query",           "operation": "list" }
{ "resource": "decision",        "operation": "list" }
{ "resource": "dashboard",       "operation": "list" }
```

**Pass criteria:** All 5 calls return `200` with a JSON array (may be empty). No tool errors.

**Note:** Check how many METRIC decisions exist before Step 3. If there are already 3,
the account is at the limit — delete one before continuing.

---

## Step 2 — Create the test pipeline (BO → Metric → Decision → Dashboard)

### 2a. Create Business Object

```json
{
  "resource": "business-object",
  "operation": "create",
  "data": {
    "name": "[MCP-VALIDATION-TEST] Chat Events",
    "description": "Validation test — safe to delete",
    "isActive": false,
    "subkeys": ["<your-subscribe-key>"],
    "fields": [
      { "name": "User ID",  "source": "JSONPATH", "jsonPath": "$.message.body.user_id",  "jsonFieldType": "TEXT" },
      { "name": "Channel",  "source": "JSONPATH", "jsonPath": "$.message.body.channel",  "jsonFieldType": "TEXT" },
      { "name": "Event",    "source": "JSONPATH", "jsonPath": "$.message.body.event",    "jsonFieldType": "TEXT" }
    ]
  }
}
```

**Save:** `bo_id`, `user_field_id` (fields[0].id), `channel_field_id` (fields[1].id)

**Pass criteria:** `201` response, `id` is a UUID, all 3 fields have auto-generated `id` values.

### 2b. Create Metric

```json
{
  "resource": "metric",
  "operation": "create",
  "data": {
    "name": "[MCP-VALIDATION-TEST] Message Count",
    "businessObjectId": "<bo_id>",
    "function": "COUNT",
    "evaluationWindow": 60,
    "dimensionIds": ["<user_field_id>", "<channel_field_id>"]
  }
}
```

**Save:** `metric_id`

**Pass criteria:** `201` response, `measureId` is `null` (correct for COUNT), `dimensionIds` matches what was sent.

### 2c. Create Decision

```json
{
  "resource": "decision",
  "operation": "create",
  "data": {
    "name": "[MCP-VALIDATION-TEST] Spam Alert",
    "sourceType": "METRIC",
    "sourceId": "<metric_id>",
    "executionFrequency": 60,
    "inputFields": [
      { "name": "Message Count", "sourceType": "BUSINESSOBJECT", "sourceId": "<bo_id>",           "dataType": "NUMERIC", "order": 1 },
      { "name": "User ID",       "sourceType": "DIMENSION",      "sourceId": "<user_field_id>",   "dataType": "TEXT",    "order": 2 },
      { "name": "Channel",       "sourceType": "DIMENSION",      "sourceId": "<channel_field_id>","dataType": "TEXT",    "order": 3 }
    ],
    "outputFields": [
      { "name": "Flagged User", "variable": "userId" }
    ],
    "actions": [
      {
        "name": "Publish Alert",
        "actionType": "PUBNUB_PUBLISH",
        "template": {
          "pubkey": "<your-publish-key>",
          "subkey": "<your-subscribe-key>",
          "channel": "mcp-validation-alerts",
          "body": "{\"event\": \"spam_detected\", \"user\": \"${userId}\"}"
        }
      }
    ],
    "rules": [
      {
        "inputValues": [
          { "inputFieldId": "<count-field-id>",   "operation": "NUMERIC_GREATER_THAN", "argument": "5" },
          { "inputFieldId": "<user-field-id>",    "operation": "ANY",                  "argument": "" },
          { "inputFieldId": "<channel-field-id>", "operation": "ANY",                  "argument": "" }
        ],
        "outputValues": [
          { "outputFieldId": "<userId-output-id>", "value": "${<user-field-id>}" }
        ],
        "actionValues": [
          {
            "actionId": "<action-id>",
            "status": true,
            "executionLimitType": "ONCE_PER_INTERVAL_PER_CONDITION_GROUP",
            "executionLimitIntervalInSeconds": 60,
            "executionLimitInputFieldIds": ["<user-field-id>"]
          }
        ]
      }
    ]
  }
}
```

**Save:** `decision_id`

**Pass criteria (2-step workflow verification):**
- Response has `rules` array with 1 rule containing real UUID references (not the placeholder IDs above)
- `hitType` is `"SINGLE"` (injected by handler — was not in the input)
- `executeOnce` is `false` (injected by handler)
- `activeFrom` is set to approximately now
- `activeUntil` is approximately 2 years from now (NOT `"2027-12-31T23:59:59Z"`)
- `enabled` is `false`

### 2d. Create Dashboard

```json
{
  "resource": "dashboard",
  "operation": "create",
  "data": {
    "name": "[MCP-VALIDATION-TEST] Dashboard",
    "dateRange": "1 hour",
    "charts": [
      {
        "name": "Message Count",
        "metric": { "id": "<metric_id>" },
        "viewType": "LINE",
        "size": "FULL",
        "showDecisions": true,
        "dimensionIds": ["<user_field_id>"],
        "decisionIds": ["<decision_id>"]
      }
    ]
  }
}
```

**Save:** `dashboard_id`, `chart_id` (charts[0].id)

**Pass criteria:** `201` response, chart has an auto-generated `id`.

---

## Step 3 — Activate Business Object and publish fake data

### 3a. Activate BO

```json
{
  "resource": "business-object",
  "operation": "activate",
  "id": "<bo_id>",
  "subscribe_key": "<your-subscribe-key>"
}
```

**Pass criteria:** Response shows `isActive: true`.

### 3b. Publish fake data — generic scenario

```json
{
  "operation": "publish-fake-data",
  "bo_id": "<bo_id>",
  "scenario": "generic",
  "count": 10,
  "subscribe_key": "<your-subscribe-key>",
  "publish_key": "<your-publish-key>"
}
```

**Pass criteria:** Returns success with count of messages published. No key-missing error.

### 3c. Publish fake data — chat-flooding scenario

```json
{
  "operation": "publish-fake-data",
  "bo_id": "<bo_id>",
  "scenario": "chat-flooding",
  "count": 15,
  "subscribe_key": "<your-subscribe-key>",
  "publish_key": "<your-publish-key>"
}
```

**Wait 30 seconds** after publishing before running the next checks.

### 3d. Field-health check

```json
{
  "operation": "field-health",
  "bo_id": "<bo_id>"
}
```

**Pass criteria:** At least `user_id`, `channel`, and `event` fields show non-empty values.
If any field shows empty strings, the JSONPath expression does not match the published
message structure — flag this as a fail and note the mismatch.

### 3e. Raw snapshot

```json
{
  "operation": "raw-snapshot",
  "bo_id": "<bo_id>",
  "limit": 10
}
```

**Pass criteria:** Returns at least 1 row of data. Empty result means ingestion has not
started — wait another 30 seconds and retry once.

---

## Step 4 — Activate Decision and verify it fires

### 4a. Activate the Decision

```json
{
  "resource": "decision",
  "operation": "activate",
  "id": "<decision_id>"
}
```

**Pass criteria:** Response shows `enabled: true`.

### 4b. Publish more flooding data to trigger the rule

```json
{
  "operation": "publish-fake-data",
  "bo_id": "<bo_id>",
  "scenario": "chat-flooding",
  "count": 20,
  "subscribe_key": "<your-subscribe-key>",
  "publish_key": "<your-publish-key>"
}
```

Wait 90 seconds (one full `executionFrequency` cycle).

### 4c. Check action log

```json
{
  "operation": "check-action-log",
  "decision_id": "<decision_id>"
}
```

**Pass criteria:** At least 1 action log entry appears. If the log is empty, note as a
warning (the threshold of 5 may not have been reached in the evaluation window) — this is
not necessarily a code failure.

---

## Step 5 — Error path checks

### 5a. METRIC decision limit

Attempt to create a 4th METRIC decision on any metric. (If the account already has 3
METRIC decisions, this test is ready to run without creating new ones first.)

**Pass criteria:** The tool returns an error message that mentions the 3-decision limit
and tells the user to list and delete an existing METRIC decision before retrying.

### 5b. Missing keys for publish-fake-data

Run `publish-fake-data` without providing `publish_key` or `subscribe_key` arguments,
and without the env vars set:

```json
{
  "operation": "publish-fake-data",
  "bo_id": "<bo_id>",
  "scenario": "generic",
  "count": 1
}
```

**Pass criteria:** Returns a clear error message explaining that `PUBNUB_PUBLISH_KEY` and
`PUBNUB_SUBSCRIBE_KEY` (or the `publish_key` / `subscribe_key` arguments) are required,
and tells the user where to find their keyset keys.

---

## Step 6 — Cleanup

Delete all test resources in reverse dependency order. Each must return `{ "success": true }`.

```json
{ "resource": "dashboard",       "operation": "delete", "id": "<dashboard_id>" }
{ "resource": "decision",        "operation": "delete", "id": "<decision_id>" }
{ "resource": "metric",          "operation": "delete", "id": "<metric_id>" }
{ "resource": "business-object", "operation": "delete", "id": "<bo_id>" }
```

> Note: The BO delete will fail if the Decision is still enabled. Deactivate first if needed:
> `{ "resource": "decision", "operation": "deactivate", "id": "<decision_id>" }`

**Pass criteria:** All 4 deletes succeed. Verify by calling `list` for each type and
confirming the `[MCP-VALIDATION-TEST]` resources no longer appear.

---

## Step 7 — Final report

After all steps, produce a summary:

```
ILLUMINATE IMPLEMENTATION VALIDATION REPORT
============================================

Step 1 — List all resource types:        PASS / FAIL
Step 2a — Create Business Object:        PASS / FAIL
Step 2b — Create Metric:                 PASS / FAIL
Step 2c — Create Decision (2-step):      PASS / FAIL
  - hitType injected:                    PASS / FAIL
  - executeOnce injected:                PASS / FAIL
  - activeUntil rolling window:          PASS / FAIL
  - rules populated with real IDs:       PASS / FAIL
Step 2d — Create Dashboard:              PASS / FAIL
Step 3a — Activate BO:                   PASS / FAIL
Step 3b/3c — Publish fake data:          PASS / FAIL
Step 3d — Field-health:                  PASS / FAIL (list any empty fields)
Step 3e — Raw snapshot:                  PASS / FAIL
Step 4a — Activate Decision:             PASS / FAIL
Step 4c — Action log:                    PASS / WARN / FAIL
Step 5a — METRIC limit error:            PASS / FAIL
Step 5b — Missing keys error:            PASS / FAIL
Step 6 — Cleanup:                        PASS / FAIL

Overall: PASS (all steps passed) / FAIL (list failed steps with errors)
```

If any step failed, include the exact error text returned by the tool and a suggested fix.

---

## Dependency note

This phase depends on Phase 2 (tool implementation) and Phase 3 (prompts + tests) being
complete and merged. It does not depend on Phase 1 (documentation API) — the tool works
without the how-to guides being published.
