---
resource: decision
base_url: https://admin-api.pubnub.com/v2/illuminate/decisions
triggers:
  - create illuminate decision
  - automate illuminate action
  - trigger action when condition met
  - mute user illuminate
  - set user metadata illuminate
  - publish message on threshold
  - webhook on condition
  - decision rules
  - executionFrequency illuminate
requires:
  - illuminate api key
  - source id — one of: business_object_id, metric_id, or query_id
  - pubnub subscribe key and publish key (for PUBNUB_PUBLISH actions)
produces:
  - decision_id — $.id
  - inputField_ids — $.inputFields[*].id — needed for rules inputValues
  - outputField_ids — $.outputFields[*].id — needed for rules outputValues
  - action_ids — $.actions[*].id — needed for rules actionValues
---

# How to Create Illuminate Decisions

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - A data source — one of:
>   - A Business Object ID (for real-time per-event evaluation)
>   - A Metric ID (for threshold evaluation on aggregated data)
>   - A Query ID (for evaluation over query output rows)

A Decision is Illuminate's automation engine. It evaluates conditions against your data and fires actions — publishing messages, calling webhooks, or updating App Context metadata — automatically when rules match.

**Base URL:** `https://admin-api.pubnub.com/v2/illuminate/decisions`

## Using the manage_illuminate Tool

When using the `manage_illuminate` MCP tool, the 4-step POST → save IDs → PUT rules → PUT enable workflow is handled automatically by the tool's `create` operation. Pass the full decision body (including `inputFields`, `outputFields`, `actions`, and `rules`) and the handler runs the multi-step sequence internally.

**Step 1 — Create the Decision scaffold (tool handles the 4-step flow):**

```json
{
  "resource": "decision",
  "operation": "create",
  "data": {
    "name": "Mute Spam Users",
    "description": "Mutes users who send more than 10 messages in 60 seconds",
    "sourceType": "METRIC",
    "sourceId": "<count-metric-id>",
    "executionFrequency": 60,
    "inputFields": [
      { "name": "Message Count", "sourceType": "BUSINESSOBJECT", "sourceId": "<bo-id>",         "dataType": "NUMERIC", "order": 1 },
      { "name": "User ID",       "sourceType": "DIMENSION",      "sourceId": "<user-field-id>", "dataType": "TEXT",    "order": 2 },
      { "name": "Channel",       "sourceType": "DIMENSION",      "sourceId": "<chan-field-id>", "dataType": "TEXT",    "order": 3 }
    ],
    "outputFields": [
      { "name": "User to Mute", "variable": "userId" }
    ],
    "actions": [
      {
        "name": "Set User Status to Muted",
        "actionType": "APPCONTEXT_SET_USER_METADATA",
        "template": {
          "subkey": "sub-c-...",
          "userId": "${userId}",
          "status": "muted"
        }
      }
    ],
    "rules": [
      {
        "inputValues": [
          { "inputFieldId": "<count-field-id>",   "operation": "NUMERIC_GREATER_THAN", "argument": "10" },
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
            "executionLimitIntervalInSeconds": 300,
            "executionLimitInputFieldIds": ["<user-field-id>"]
          }
        ]
      }
    ]
  }
}
```

> **Note:** The `hitType`, `executeOnce`, `activeFrom`, and `activeUntil` fields are automatically injected as safe defaults by the tool handler — you do not need to supply them. The tool runs the POST → save IDs → PUT rules → PUT enable sequence in a single `create` call.

**Activate after creation:**

```json
{
  "resource": "decision",
  "operation": "activate",
  "id": "<decision-id>"
}
```

**List all Decisions (check METRIC decision count before creating):**

```json
{
  "resource": "decision",
  "operation": "list"
}
```

---

## Source Types

Choose the source type that matches your use case:

| `sourceType` | Evaluates | Best for |
|---|---|---|
| `BUSINESSOBJECT` | Each incoming event in real time | Immediate per-event responses (flag a message, reward a milestone) |
| `METRIC` | Aggregated metric value on a configurable schedule | Threshold alerts (count > 10 in 5 min, average > 500 in 1 hour) |
| `QUERY` | Saved query output rows on a configurable schedule | Cross-user / cross-channel pattern detection (spam, rankings) |

## Action Types

| `actionType` | What it does | Key template fields |
|---|---|---|
| `PUBNUB_PUBLISH` | Publishes a message to a PubNub channel | `pubkey`, `subkey`, `channel`, `body` |
| `WEBHOOK_EXECUTION` | POSTs a payload to an external URL | `webhookUrl`, `headers`, `payload` |
| `APPCONTEXT_SET_USER_METADATA` | Sets fields on a PubNub user object | `subkey`, `userId`, `status`, `custom` |
| `APPCONTEXT_SET_CHANNEL_METADATA` | Sets fields on a PubNub channel object | `subkey`, `channelId`, `status`, `custom` |
| `APPCONTEXT_SET_MEMBERSHIP_METADATA` | Sets fields on a user-channel membership | `subkey`, `userId`, `channelId`, `status`, `custom` |

## Understanding inputFields

`inputFields` define which data values the Decision can condition on in its rules. They are always **manually specified** in the POST body — the API does not auto-populate them.

Each inputField schema:

```json
{
  "name": "Display label",
  "sourceType": "FIELD | MEASURE | DIMENSION | BUSINESSOBJECT | QUERYFIELD",
  "sourceId": "<id>",
  "dataType": "NUMERIC | TEXT",
  "order": 1
}
```

- `order` — integer display order in the Illuminate UI (start at 1)
- `dataType` — `NUMERIC` for values you will use numeric operations on; `TEXT` for string comparisons
- Omit `id` on creation — it is auto-generated and returned in the response

**Pattern by source type:**

### BUSINESSOBJECT decision inputFields

Use the BO field IDs directly. `sourceType` is `"FIELD"`.

> **Required top-level fields:** BUSINESSOBJECT decisions must include both `"sourceId": "<bo-id>"` AND `"businessObjectId": "<bo-id>"` at the top level of the POST body (both set to the same BO ID). Omitting `sourceId` returns `400: "sourceId must be a UUID"`.

```json
"inputFields": [
  { "name": "User ID", "sourceType": "FIELD", "sourceId": "<user-field-id>",  "dataType": "TEXT",    "order": 1 },
  { "name": "Value",   "sourceType": "FIELD", "sourceId": "<value-field-id>", "dataType": "NUMERIC", "order": 2 }
]
```

### METRIC decision inputFields — SUM / AVG / MIN / MAX

One `MEASURE` field for the aggregated value + one `DIMENSION` field per grouped dimension:

```json
"inputFields": [
  { "name": "Sum of Value", "sourceType": "MEASURE",   "sourceId": "<metric-measureId>",   "dataType": "NUMERIC", "order": 1 },
  { "name": "User ID",      "sourceType": "DIMENSION", "sourceId": "<user-field-id>",       "dataType": "TEXT",    "order": 2 },
  { "name": "Event Type",   "sourceType": "DIMENSION", "sourceId": "<event-type-field-id>", "dataType": "TEXT",    "order": 3 }
]
```

The `sourceId` for the MEASURE field is the Metric's `measureId` value (which is a BO field ID).

### METRIC decision inputFields — COUNT / COUNT_DISTINCT

COUNT metrics have no `measureId`. The count value is represented using `sourceType: "BUSINESSOBJECT"` with the **Business Object ID** as `sourceId`:

```json
"inputFields": [
  { "name": "Message Count", "sourceType": "BUSINESSOBJECT", "sourceId": "<bo-id>",              "dataType": "NUMERIC", "order": 1 },
  { "name": "User ID",        "sourceType": "DIMENSION",      "sourceId": "<user-field-id>",       "dataType": "TEXT",    "order": 2 },
  { "name": "Channel",        "sourceType": "DIMENSION",      "sourceId": "<channel-field-id>",    "dataType": "TEXT",    "order": 3 }
]
```

### QUERY decision inputFields

One `QUERYFIELD` per output field from the Query. Get the field IDs from `GET /queries/{id}/fields`:

```json
"inputFields": [
  { "name": "user_id",     "sourceType": "QUERYFIELD", "sourceId": "<query-field-id-user>",        "dataType": "TEXT",    "order": 1 },
  { "name": "event_count", "sourceType": "QUERYFIELD", "sourceId": "<query-field-id-event-count>", "dataType": "NUMERIC", "order": 2 },
  { "name": "total_value", "sourceType": "QUERYFIELD", "sourceId": "<query-field-id-total-value>", "dataType": "NUMERIC", "order": 3 }
]
```

---

## The 4-Step Creation Workflow

Decisions require multiple API calls because rules reference auto-generated IDs that do not exist until after the POST.

> **Required on every POST — omitting any of the following causes an unhandled 500 error (not a 400):**
>
> | Field | Required value / notes |
> |---|---|
> | `activeFrom` | ISO 8601 UTC string — e.g. `"2026-01-01T00:00:00Z"` |
> | `activeUntil` | ISO 8601 UTC string — e.g. `"2027-12-31T23:59:59Z"` |
> | `hitType` | Always `"SINGLE"` |
> | `executeOnce` | Always `false` |
>
> These fields are not validated by the API — a missing value bypasses input validation and triggers an unhandled database exception, returning `500 Internal Server Error` with no useful error message.

### Step 1: POST — Create the scaffold

Create with `enabled: false` and `rules: []`. Include all `inputFields`, `outputFields`, and `actions`. Omit all `id` fields — they are auto-generated.

```bash
POST /v2/illuminate/decisions
```

**Example — COUNT metric decision that mutes spamming users:**

```json
{
  "name": "Mute Spam Users",
  "description": "Mutes users who send more than 10 messages in 5 minutes",
  "sourceType": "METRIC",
  "sourceId": "<count-metric-id>",
  "hitType": "SINGLE",
  "enabled": false,
  "executionFrequency": 60,
  "activeFrom": "2026-01-01T00:00:00Z",
  "activeUntil": "2027-12-31T23:59:59Z",
  "executeOnce": false,
  "inputFields": [
    { "name": "Message Count", "sourceType": "BUSINESSOBJECT", "sourceId": "<bo-id>",         "dataType": "NUMERIC", "order": 1 },
    { "name": "User ID",       "sourceType": "DIMENSION",      "sourceId": "<user-field-id>", "dataType": "TEXT",    "order": 2 },
    { "name": "Channel",       "sourceType": "DIMENSION",      "sourceId": "<chan-field-id>", "dataType": "TEXT",    "order": 3 }
  ],
  "outputFields": [
    { "name": "User to Mute", "variable": "userId" }
  ],
  "actions": [
    {
      "name": "Set User Status to Muted",
      "actionType": "APPCONTEXT_SET_USER_METADATA",
      "template": {
        "subkey": "sub-c-...",
        "userId": "${userId}",
        "status": "muted",
        "custom": { "muteReason": "spam" },
        "customDataTypes": { "muteReason": "string" }
      }
    }
  ],
  "rules": []
}
```

### Step 2: Save the auto-generated IDs from the response

> **Expected:** `201` response. The POST response includes `id` values for every inputField, outputField, and action. Save them — you need these to write rules.

| Value | Response path | Used for |
|---|---|---|
| `decision_id` | `$.id` | All subsequent PUT calls, action log, reset-limits |
| `inputField_ids` | `$.inputFields[*].id` | `rules[].inputValues[].inputFieldId` |
| `outputField_ids` | `$.outputFields[*].id` | `rules[].outputValues[].outputFieldId` |
| `action_ids` | `$.actions[*].id` | `rules[].actionValues[].actionId` |

```
Response fields to save:
  $.id               →  decision_id
  inputFields[0].id  →  count field ID
  inputFields[1].id  →  user field ID
  inputFields[2].id  →  channel field ID
  outputFields[0].id →  userId output field ID
  actions[0].id      →  action ID
```

### Step 3: PUT — Add rules using the generated IDs

> **Every inputField must appear in every rule's `inputValues`.**
> A rule with fewer `inputValues` than `inputFields` returns:
> `"Number of inputValues (N) does not match number of inputFields (M)"`
>
> Use `"operation": "ANY", "argument": ""` for fields you do not want to condition on.

```bash
PUT /v2/illuminate/decisions/{id}
```

Send the **full decision body** (same as the POST response, minus server-generated fields like `id`, `accountId`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`) plus the `rules` array:

```json
{
  ...full decision body from POST response (minus server fields)...,
  "rules": [
    {
      "inputValues": [
        { "inputFieldId": "<count-field-id>",   "operation": "NUMERIC_GREATER_THAN", "argument": "10" },
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
          "executionLimitIntervalInSeconds": 300,
          "executionLimitInputFieldIds": ["<user-field-id>"]
        }
      ]
    }
  ]
}
```

### Step 3 expected result

> **Expected:** `200` response. The decision now has rules but remains disabled.

### Step 4: PUT — Enable the Decision

Fetch the current state, set `enabled: true`, and PUT the full body back.

```bash
PUT /v2/illuminate/decisions/{id}
```

```json
{
  ...all fields from GET response (minus server-generated fields)...,
  "enabled": true
}
```

> **For BUSINESSOBJECT decisions only:** Remove `executionFrequency` entirely from PUT bodies. Sending `executionFrequency: null` returns a plan error. METRIC and QUERY decisions should keep their `executionFrequency` value.

---

## Condition Operations

| Operation | Data type | Notes |
|---|---|---|
| `ANY` | Any | Matches all values — use for don't-care fields |
| `NUMERIC_EQUALS` | NUMERIC | |
| `NUMERIC_NOT_EQUALS` | NUMERIC | |
| `NUMERIC_GREATER_THAN` | NUMERIC | |
| `NUMERIC_GREATER_THAN_EQUALS` | NUMERIC | |
| `NUMERIC_LESS_THAN` | NUMERIC | |
| `NUMERIC_LESS_THAN_EQUALS` | NUMERIC | |
| `NUMERIC_INCLUSIVE_BETWEEN` | NUMERIC | Argument format: `"low,high"` e.g. `"5,20"` |
| `STRING_EQUALS` | TEXT | Case-sensitive |
| `STRING_NOT_EQUALS` | TEXT | |
| `STRING_CONTAINS` | TEXT | |

## Execution Limit Types

Control how often an action fires when its conditions continuously match:

| `executionLimitType` | Behavior |
|---|---|
| `ALWAYS` | Fires every time conditions match |
| `ONCE` | Fires once total and never again |
| `ONCE_PER_INTERVAL` | Fires at most once per interval window |
| `ONCE_PER_CONDITION_GROUP` | Fires once per unique combination of input values |
| `ONCE_PER_INTERVAL_PER_CONDITION_GROUP` | Fires once per interval per unique input combination |

> **`ONCE_PER_INTERVAL_PER_CONDITION` is not a valid value.** Use `ONCE_PER_INTERVAL_PER_CONDITION_GROUP` instead.

Allowed interval seconds: `60`, `300`, `600`, `900`, `1800`, `3600`, `86400`

When using `ONCE_PER_INTERVAL_PER_CONDITION_GROUP`, specify `executionLimitInputFieldIds` with the inputField IDs that define uniqueness (e.g., the user ID field so each user gets their own rate limit).

## executionFrequency (METRIC and QUERY only)

| Value | Evaluation interval |
|---|---|
| `60` | Every 1 minute |
| `300` | Every 5 minutes |
| `600` | Every 10 minutes |
| `900` | Every 15 minutes |
| `1800` | Every 30 minutes |
| `3600` | Every hour |
| `86400` | Every day |

## Template Variables

Action templates support dynamic values using `${}` syntax:

- `${inputFieldId}` — replaced with the runtime value of that input field (use the auto-generated UUID from the POST response)
- `${outputVariableName}` — replaced with the output field value by variable name

**Example PUBNUB_PUBLISH template:**
```json
"template": {
  "pubkey": "pub-c-...",
  "subkey": "sub-c-...",
  "channel": "alerts.${<user-field-id>}",
  "body": "{\"action\": \"muted\", \"userId\": \"${<user-field-id>}\", \"reason\": \"${alertMessage}\"}"
}
```

> No built-in system variables exist. `${timestamp}`, `${date}`, and similar do not work.

## Modifying an Active Decision

| Change type | Requires deactivation? |
|---|---|
| Rule condition values | No |
| Rule output values | No |
| Action template content | No |
| Adding / removing inputFields, outputFields, actions | **Yes** — set `enabled: false` first |
| Changing `name`, `description`, `activeFrom`, `activeUntil` | No |

## Account Limits

| Resource type | Limit |
|---|---|
| `METRIC` decisions | **3 per account** |
| `BUSINESSOBJECT` decisions | No enforced limit |
| `QUERY` decisions | No enforced limit |

If you attempt to create a 4th METRIC decision the API returns:
```
"A business object cannot have more than 3 associated decisions."
```

> **Before creating a new METRIC decision**, always run `GET /decisions` and list the existing ones. If the account is at the limit, show the user the current METRIC decisions and ask which one they want to delete before proceeding. Do not delete anything without explicit confirmation.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `400` — METRIC decision limit reached | More than 3 METRIC decisions exist | List current decisions, ask user which to delete, then delete and retry |
| `500` on POST | Missing `activeFrom` or `activeUntil` | Always include both fields in every decision POST |
| `400` — inputValues count mismatch | Rule has fewer `inputValues` than `inputFields` | Add `"operation": "ANY"` entry for every inputField not explicitly filtered |
| `400` — invalid executionLimitType | Using `ONCE_PER_INTERVAL_PER_CONDITION` | Use `ONCE_PER_INTERVAL_PER_CONDITION_GROUP` |
| `400` — plan error on PUT | `executionFrequency: null` in BUSINESSOBJECT decision PUT | Remove `executionFrequency` field entirely from PUT body |
| `400` — non-empty rules on POST | Including rules in the initial POST | Always send `"rules": []` on POST |
| `400` — structural change while enabled | Modifying inputFields/outputFields/actions while active | Set `enabled: false` first |
| `400` — inputField ID not found | Rule references an ID that does not match the POST response | Re-fetch the decision with GET and use exact IDs from the response |

## Best Practices

- Always test with `enabled: false` and verify rule logic (using the action log after publishing test messages) before enabling in production.
- Use descriptive `name` fields — the action log shows action names when debugging.
- For COUNT-based thresholds, set `executionFrequency` to the same value as the metric's `evaluationWindow` to evaluate fresh data every cycle.
- Use `executionLimitType: ONCE_PER_INTERVAL_PER_CONDITION_GROUP` to prevent action floods when using ALWAYS would fire too frequently.
- Store the Decision `id` alongside its inputField IDs — you will need them if you need to update or reset action limits later.
