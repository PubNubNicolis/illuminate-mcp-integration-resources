---
resource: analysis
base_url: https://admin-api.pubnub.com/v2/illuminate/queries/execute
triggers:
  - analyze illuminate data
  - see illuminate data
  - check business object data
  - query business object data
  - what data is illuminate capturing
  - inspect message data illuminate
  - audit field mappings illuminate
  - check if data is flowing
  - recent messages illuminate
requires:
  - illuminate api key
  - business_object_id and field_ids (from how_to_create_illuminate_business_objects.md)
produces:
  - query results (data array) — no saved resource created
---

# How to Analyze Illuminate Business Object Data

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - A Business Object that has been active and receiving messages — see [how_to_create_illuminate_business_objects.md](how_to_create_illuminate_business_objects.md)
> - `curl` (or any HTTP client) to call the Illuminate REST API

Illuminate stores every PubNub message that flows through your Business Object. You can query that data at any time using the ad-hoc query API — no saved query required. This is useful for auditing field mappings, exploring message patterns, and confirming data is flowing before building Metrics, Queries, or Decisions on top of it.

Use the `POST /queries/execute` endpoint (ad-hoc, no saved query needed) to inspect live BO data. No publish key or Python required.

---

## Step 1: Find Your Business Object and Field IDs

Every ad-hoc query references field IDs — not field names. First, list all Business Objects to find the one you want:

```bash
curl -s "https://admin-api.pubnub.com/v2/illuminate/business-objects" \
  -H "Authorization: <your-api-key>" \
  -H "PubNub-Version: 2026-02-09"
```

The response is an array of BOs. Find yours by `name` and note its `id`. Then fetch the full BO to see all field IDs:

```bash
curl -s "https://admin-api.pubnub.com/v2/illuminate/business-objects/<bo-id>" \
  -H "Authorization: <your-api-key>" \
  -H "PubNub-Version: 2026-02-09"
```

Each entry in the `fields` array looks like:

```json
{
  "id": "089952bc-4801-486f-afa0-e76a044c9556",
  "name": "Channel",
  "jsonPath": "$.message.channel",
  "jsonFieldType": "TEXT"
}
```

Copy the `id` values for the fields you want to query. You'll use these in every ad-hoc query below.

---

## Step 2: Raw Data Snapshot

The simplest query — no transforms, no aggregation — returns the most recent raw rows. Use this to quickly confirm data is flowing and fields are being extracted correctly.

```bash
curl -s -X POST "https://admin-api.pubnub.com/v2/illuminate/queries/execute" \
  -H "Authorization: <your-api-key>" \
  -H "PubNub-Version: 2026-02-09" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0",
    "pipeline": {
      "sources": [
        {
          "id": "src",
          "type": "businessObject",
          "businessObjectId": "<bo-id>",
          "fields": [
            {"id": "<channel-field-id>", "alias": "channel",  "type": "dimension"},
            {"id": "<user-field-id>",    "alias": "user",     "type": "dimension"},
            {"id": "<message-field-id>", "alias": "message",  "type": "dimension"}
          ],
          "timeRange": {
            "field": "timestamp",
            "relative": {"direction": "past", "value": 30, "unit": "days"}
          }
        }
      ],
      "transforms": [],
      "output": {
        "from": "src",
        "select": [
          {"field": "channel"},
          {"field": "user"},
          {"field": "message"}
        ],
        "limit": 50
      }
    }
  }'
```

**Important notes:**
- `"version": "2.0"` is required as a string. Omitting it causes a `400: version must be a string` error.
- The `"id"` in sources (`"src"`) is an alias that `output.from` and any transforms must reference.
- Only include fields you want displayed — unused BO fields can be left out.
- `limit` caps the number of rows. Use 50–100 for inspection; up to 500 is supported.

**Sample output:**
```json
{
  "data": [
    {"channel": "group.general", "user": "alice", "message": "hey everyone"},
    {"channel": "group.general", "user": "bob",   "message": "good morning"},
    {"channel": "direct.alice-bob", "user": "alice", "message": "did you see this?"}
  ],
  "executionTime": 28
}
```

---

## Step 3: Aggregate by User and Channel

To see message counts grouped by user and channel — useful for understanding activity patterns or identifying heavy users:

```bash
curl -s -X POST "https://admin-api.pubnub.com/v2/illuminate/queries/execute" \
  -H "Authorization: <your-api-key>" \
  -H "PubNub-Version: 2026-02-09" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0",
    "pipeline": {
      "sources": [
        {
          "id": "src",
          "type": "businessObject",
          "businessObjectId": "<bo-id>",
          "fields": [
            {"id": "<user-field-id>",    "alias": "user",    "type": "dimension"},
            {"id": "<channel-field-id>", "alias": "channel", "type": "dimension"}
          ],
          "timeRange": {
            "field": "timestamp",
            "relative": {"direction": "past", "value": 30, "unit": "days"}
          }
        }
      ],
      "transforms": [
        {
          "type": "aggregate",
          "id": "grouped",
          "input": "src",
          "aggregate": {
            "groupBy": ["user", "channel"],
            "aggregations": [
              {"function": "count", "field": "*", "alias": "msg_count"}
            ]
          }
        }
      ],
      "output": {
        "from": "grouped",
        "select": [
          {"field": "user"},
          {"field": "channel"},
          {"field": "msg_count"}
        ],
        "orderBy": [{"field": "msg_count", "direction": "DESC"}],
        "limit": 100
      }
    }
  }'
```

**Sample output** (sorted by message count, most active first):

| user | channel | msg_count |
|---|---|---|
| alice | group.general | 86 |
| bob | group.general | 54 |
| charlie | group.general | 33 |
| alice | direct.alice-bob | 23 |
| bob | direct.alice-bob | 13 |

The aggregate transform's `input` field must exactly match the source `id` (`"src"` in this example). The `output.from` must match the transform `id` (`"grouped"`).

---

## Step 4: Check Field Health

If some fields look empty in your raw snapshot, use this pattern to measure how many rows have a value vs. how many are blank. This helps diagnose JSONPath mismatches.

```bash
curl -s -X POST "https://admin-api.pubnub.com/v2/illuminate/queries/execute" \
  -H "Authorization: <your-api-key>" \
  -H "PubNub-Version: 2026-02-09" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0",
    "pipeline": {
      "sources": [
        {
          "id": "src",
          "type": "businessObject",
          "businessObjectId": "<bo-id>",
          "fields": [
            {"id": "<user-field-id>", "alias": "user", "type": "dimension"}
          ],
          "timeRange": {
            "field": "timestamp",
            "relative": {"direction": "past", "value": 30, "unit": "days"}
          }
        }
      ],
      "transforms": [
        {
          "type": "aggregate",
          "id": "populated",
          "input": "src",
          "aggregate": {
            "groupBy": ["user"],
            "aggregations": [
              {"function": "count", "field": "*", "alias": "count"}
            ]
          },
          "filters": [
            {"field": "user", "operator": "!=", "value": ""}
          ]
        }
      ],
      "output": {
        "from": "populated",
        "select": [{"field": "user"}, {"field": "count"}],
        "orderBy": [{"field": "count", "direction": "DESC"}],
        "limit": 100
      }
    }
  }'
```

If this returns zero rows but your raw snapshot shows data, the JSONPath for the `user` field is not matching the actual message structure. Compare:
- The field's `jsonPath` in the BO (e.g. `$.message.body.user_id`)
- The actual structure of the messages being published

Remember: Illuminate wraps every message as `{"message": {"body": <your_message>}}`, so all JSONPath expressions that reference message content must start with `$.message.body.`.

---

## Time Range Reference

The `timeRange` block inside each source controls how far back to look:

### Relative (recommended for most cases)

```json
"timeRange": {
  "field": "timestamp",
  "relative": {"direction": "past", "value": 30, "unit": "days"}
}
```

| Unit | Example value | Use case |
|---|---|---|
| `minutes` | 5, 15, 60 | Real-time debugging, just published test data |
| `hours` | 1, 6, 24 | Recent activity, last day |
| `days` | 7, 30 | Weekly trends, historical analysis |

A 30-day window is the most reliable. Data availability beyond that may vary by plan.

### Absolute (specific time window)

```json
"timeRange": {
  "field": "timestamp",
  "absolute": {
    "from": "2026-02-01T00:00:00Z",
    "to":   "2026-03-01T00:00:00Z"
  }
}
```

Use ISO 8601 UTC timestamps. Useful when the user asks about a specific date range.

---

## Understanding the Output

| Observation | Meaning | Action |
|---|---|---|
| Fields return `""` | JSONPath didn't match the message structure | Compare BO `jsonPath` against actual message body; all body paths must start with `$.message.body.` |
| `output-rev-...-key-XXXXXX` channels | Decision fired a `PUBNUB_PUBLISH` action; output looped back through the BO | Expected — not an error. Filter them with `{"field": "channel", "operator": "!=", "value": "output-rev-..."}` if unwanted |
| `user: ""` + `channel: "user.Alice"` | JS Chat SDK publishes to `user.<userId>` channels; the userId is in the channel name, not the message body | BO field for user is mapped to `$.message.userId` but the SDK sends userId in channel metadata instead |
| Zero rows returned | BO is inactive, wrong subscribe key, or no messages published yet | Check `isActive: true` on BO; verify the publish keyset matches the BO's `subkeys` array |
| `executionTime` very high (>500ms) | Query scanning large time range or many rows | Narrow the time range or add filters to reduce data scanned |

---

## Using This with the Test Script

After publishing fake data with `test_illuminate.py`, re-run the raw snapshot with a short time range to confirm ingestion immediately:

```bash
# Publish 5 fake messages
python MCP/skills/scripts/illuminate/test_illuminate.py publish \
  --api-key $ILLUMINATE_API_KEY \
  --pubkey pub-c-... \
  --subkey sub-c-... \
  --bo-id <bo-id> \
  --count 5

# Then query with a 5-minute window to see them
# (change "value": 30 "unit": "days"  →  "value": 5 "unit": "minutes")
```

See [how_to_test_illuminate_with_fake_data.md](how_to_test_illuminate_with_fake_data.md) for the full test workflow.

---

## Full Pipeline Reference

```
POST https://admin-api.pubnub.com/v2/illuminate/queries/execute
Headers:
  Authorization: <api-key>
  PubNub-Version: 2026-02-09
  Content-Type: application/json

Body:
{
  "version": "2.0",            ← required, must be the string "2.0"
  "pipeline": {
    "sources": [
      {
        "id": "<alias>",       ← local alias, referenced by transforms and output
        "type": "businessObject",
        "businessObjectId": "<bo-id>",
        "fields": [
          {
            "id": "<field-id>",    ← BO field UUID
            "alias": "<name>",     ← name used in transforms/output
            "type": "dimension"    ← always "dimension" for grouping/filtering
          }
        ],
        "timeRange": { ... }
      }
    ],
    "transforms": [            ← optional; omit for a raw passthrough query
      {
        "type": "aggregate",
        "id": "<alias>",       ← alias for this transform's output
        "input": "<source-id>",← must match a source or upstream transform id
        "aggregate": {
          "groupBy": ["<alias>", ...],
          "aggregations": [
            {"function": "count", "field": "*", "alias": "msg_count"}
          ]
        },
        "filters": [           ← optional; applied after aggregation
          {"field": "<alias>", "operator": "!=", "value": ""}
        ]
      }
    ],
    "output": {
      "from": "<source-or-transform-id>",
      "select": [{"field": "<alias>"}, ...],
      "orderBy": [{"field": "<alias>", "direction": "DESC"}],
      "limit": 100
    }
  }
}
```

**Supported aggregate functions:** `count`, `sum`, `avg`, `min`, `max`

**Supported filter operators:** `=`, `!=`, `>`, `>=`, `<`, `<=`
