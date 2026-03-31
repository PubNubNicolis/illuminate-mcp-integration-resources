---
resource: query
base_url: https://admin-api.pubnub.com/v2/illuminate/queries
triggers:
  - create illuminate query
  - query pipeline illuminate
  - detect spam illuminate
  - cross posting detection
  - chat flooding detection
  - top n ranking illuminate
  - aggregate business object data
  - ad-hoc query illuminate
  - save query illuminate
requires:
  - illuminate api key
  - business_object_id and field_ids (from how_to_create_illuminate_business_objects.md)
produces:
  - query_id — $.id — used as sourceId in QUERY decisions and Dashboard charts
  - query_field_ids — GET /queries/{id}/fields → [].id — used as inputFields[].sourceId in Decisions
---

# How to Create Illuminate Queries

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - An active Business Object with field IDs saved (see [how_to_create_illuminate_business_objects.md](how_to_create_illuminate_business_objects.md))

Queries let you define flexible data pipelines over Business Object fields — aggregating, filtering, deduplicating, and joining data beyond what fixed Metrics can express. Saved Queries can power Decision rules and Dashboard charts.

**Base URL:** `https://admin-api.pubnub.com/v2/illuminate/queries`

## Using the manage_illuminate Tool

Use the `manage_illuminate` tool to run ad-hoc queries, save queries, and retrieve output field IDs for use in QUERY-sourced Decisions.

**Run an ad-hoc query (test without saving):**

```json
{
  "resource": "query",
  "operation": "execute-adhoc",
  "data": {
    "version": "2.0",
    "pipeline": {
      "sources": [
        {
          "id": "events",
          "type": "businessObject",
          "businessObjectId": "<business-object-id>",
          "fields": [
            { "id": "<user-field-id>", "alias": "user_id", "type": "dimension" },
            { "id": "<channel-field-id>", "alias": "channel", "type": "dimension" }
          ],
          "timeRange": { "type": "relative", "value": 3600 }
        }
      ],
      "output": { "sourceId": "events", "fields": ["user_id", "channel"], "limit": 100 }
    }
  }
}
```

**Save a Query:**

```json
{
  "resource": "query",
  "operation": "create",
  "data": {
    "name": "Cross-Posting Spam Detection",
    "definition": {
      "version": "2.0",
      "pipeline": { "...": "full pipeline body here" }
    }
  }
}
```

**Get output field IDs (required before creating a QUERY-sourced Decision):**

```json
{
  "resource": "query",
  "operation": "get-fields",
  "id": "<query-id>"
}
```

**List all saved Queries:**

```json
{
  "resource": "query",
  "operation": "list"
}
```

> **Important:** Always call `get-fields` on a saved Query before creating a QUERY-sourced Decision. The field IDs returned are used as `inputFields[].sourceId` with `sourceType: "QUERYFIELD"`.

---

## When to Use Queries vs Metrics

| Use | Recommended approach |
|---|---|
| Simple COUNT / SUM / AVG over a time window | Metric |
| Cross-user pattern detection (spam, rankings) | Query |
| Multi-step filtering and aggregation | Query |
| Decision source for complex conditions | Query |
| Dashboard chart | Either (Metrics are simpler; Queries offer more control) |

## Pipeline Model

A Query pipeline has three stages:

```
Sources → Transforms (optional) → Output
```

- **Sources** — select fields from a Business Object, with optional time range and filters
- **Transforms** — reshape the data: aggregate, deduplicate, join, calculate, etc.
- **Output** — specify which stage to return from, which fields to include, how to sort, and the row limit

## Step 1: Test with Ad-Hoc Execute

Always test your pipeline with the ad-hoc execute endpoint before saving. Ad-hoc execute runs the pipeline and returns results without creating a saved Query.

```bash
POST /v2/illuminate/queries/execute
```

Note: for ad-hoc execution, the pipeline is at the **top level** of the request body, not inside a `definition` object.

**Example — count messages per user in the last hour, top 10:**

```json
{
  "version": "2.0",
  "pipeline": {
    "sources": [
      {
        "id": "events",
        "type": "businessObject",
        "businessObjectId": "<business-object-id>",
        "fields": [
          { "id": "<user-field-id>",    "alias": "user_id",    "type": "dimension" },
          { "id": "<channel-field-id>", "alias": "channel",    "type": "dimension" },
          { "id": "<value-field-id>",   "alias": "value",      "type": "measure" }
        ],
        "timeRange": {
          "field": "timestamp",
          "relative": { "direction": "past", "value": 1, "unit": "hours" }
        }
      }
    ],
    "transforms": [
      {
        "type": "aggregate",
        "id": "agg",
        "input": "events",
        "aggregate": {
          "groupBy": ["user_id", "channel"],
          "aggregations": [
            { "function": "count", "field": "*",     "alias": "message_count" },
            { "function": "sum",   "field": "value", "alias": "total_value" }
          ]
        }
      }
    ],
    "output": {
      "from": "agg",
      "select": [
        { "field": "user_id" },
        { "field": "channel" },
        { "field": "message_count" },
        { "field": "total_value" }
      ],
      "orderBy": [{ "field": "message_count", "direction": "DESC" }],
      "limit": 10
    }
  }
}
```

## Step 2: Save the Query

Once the pipeline looks correct, save it. Saved Queries wrap the pipeline inside a `definition` object:

```bash
POST /v2/illuminate/queries
```

```json
{
  "name": "Top Message Senders",
  "description": "Ranks users by message count over the last hour",
  "definition": {
    "version": "2.0",
    "pipeline": {
      "sources": [{ "id": "src", "type": "businessObject", ... }],
      "transforms": [
        {
          "id": "agg",
          "type": "aggregate",
          "input": "src",
          "aggregate": {
            "groupBy": ["user_id", "channel"],
            "aggregations": [{ "function": "count", "field": "message", "alias": "message_count" }]
          }
        }
      ],
      "output": { "from": "agg", "select": [...], "limit": 100 }
    }
  }
}
```

> **Important:** The saved query transform format differs from the ad-hoc execute format:
> - Ad-hoc uses `type: "groupBy"` with `from: "src"` — this does **not** work in saved queries.
> - Saved queries use `type: "aggregate"` with `input: "src"` and the groupBy logic nested under `aggregate: { groupBy: [], aggregations: [] }`.
> - The aggregation function names are lowercase in saved queries: `"count"`, `"sum"`, `"avg"`, `"max"`, `"min"`.

> **Expected:** `201` response.

| Value | Response path | Used for |
|---|---|---|
| `query_id` | `$.id` | Execute saved query, get output fields, scaffold Decision, Dashboard chart |

Save the `id` from the response — you will need it to:
- Execute the saved query
- Get output field IDs for Decisions and Dashboards
- Scaffold a Decision from the query

## Step 3: Get Output Field IDs

Before creating a Decision or Dashboard that uses this Query, retrieve the output field IDs:

```bash
GET /v2/illuminate/queries/{id}/fields
```

Response:
```json
[
  { "field": "user_id",       "id": "b3483924-..." },
  { "field": "channel",       "id": "08045e9a-..." },
  { "field": "message_count", "id": "fbf27602-..." },
  { "field": "total_value",   "id": "3a880b90-..." }
]
```

| Value | Response path | Used for |
|---|---|---|
| `query_field_ids` | `[*].id` | Decision `inputFields[].sourceId` where `sourceType: "QUERYFIELD"` |

Use these `id` values as:
- `inputFields[].sourceId` in a Decision (`sourceType: "QUERYFIELD"`)
- `dimensionIds` / `measureIds` in a Dashboard chart

## Pipeline Reference

### Sources

| Field | Required | Notes |
|---|---|---|
| `id` | Yes | Pipeline-internal name for this source (used by transforms) |
| `type` | Yes | `"businessObject"` |
| `businessObjectId` | Yes | Business Object ID |
| `fields` | Yes | Array of `{ id, alias, type }` — type is `"dimension"` or `"measure"` |
| `timeRange` | Yes | Either `relative` or `absolute` — not both |

**Time range options:**
```json
"timeRange": {
  "field": "timestamp",
  "relative": { "direction": "past", "value": 6, "unit": "hours" }
}
```
```json
"timeRange": {
  "field": "timestamp",
  "absolute": { "start": "2026-01-01T00:00:00Z", "end": "2026-01-02T00:00:00Z" }
}
```

### Transforms

| `type` | What it does |
|---|---|
| `aggregate` | Group by fields and apply aggregation functions |
| `dedupe` | Remove duplicate rows based on specified fields |
| `join` | Combine two sources or transforms |
| `filter_join` | Filter rows based on membership in another dataset |
| `window` | Apply window functions |
| `calculate` | Compute derived columns |
| `unnest` | Expand array fields into rows |

Each transform specifies `id` (its name for downstream reference) and `input` (the source or prior transform to read from).

### Aggregation Functions in Transforms

`count` | `sum` | `avg` | `min` | `max` | `countDistinct` | `stddev` | `percentile` | `groupArray` | `groupUniqArray` | `any`

### Filter Operators

`=` | `!=` | `>` | `<` | `>=` | `<=` | `in` | `notIn` | `like` | `between` | `notBetween` | `isNull` | `isNotNull` | `contains` | `notContains` | `startsWith` | `endsWith` | `isEmpty` | `isNotEmpty` | `minLength` | `maxLength`

### Output

| Field | Notes |
|---|---|
| `from` | ID of the source or transform to return results from |
| `select` | Array of `{ field, alias }` — controls which columns are returned |
| `orderBy` | Array of `{ field, direction }` where direction is `"ASC"` or `"DESC"` |
| `limit` | Maximum rows returned (1–500) |
| `offset` | Pagination offset (0 or greater) |

## Query Builder Templates

The Illuminate Admin Portal includes four pre-built pipeline templates for common use cases. You can also use their structure as a starting point via the API:

| Template | What it detects |
|---|---|
| **Cross-Posting Spam** | Users posting identical or near-identical content across multiple channels in a short window |
| **Chat Flooding Spam** | Users sending an abnormally high volume of messages in a short time period |
| **Top N Rankings** | The N users or items with the highest value of a numeric field |
| **Bottom N Rankings** | The N users or items with the lowest value of a numeric field |

## Scaffold a Decision from a Query

> **Note:** The `GET /queries/{id}/predefined-decisions` endpoint only works for built-in **Query Builder template** queries (Chat Flooding, Cross-Posting, etc.). It returns `404 Not Found` for custom user-created queries.

For **custom queries**, create the QUERY decision manually — see [how_to_create_illuminate_decisions.md](how_to_create_illuminate_decisions.md). Use the field IDs from `GET /queries/{id}/fields` as the `sourceId` values in `inputFields` with `sourceType: "QUERYFIELD"`.

For **Query Builder template queries**, you can scaffold automatically:

```bash
GET /v2/illuminate/queries/{id}/predefined-decisions
```

No request body needed. The API returns a pre-populated Decision scaffold with:
- `sourceType: "QUERY"`, `sourceId: <queryId>`
- `inputFields` pre-populated from the query output fields
- `enabled: false` and `rules: []` ready for your configuration

Then follow steps 2–4 from [how_to_create_illuminate_decisions.md](how_to_create_illuminate_decisions.md) to add rules and enable.

## Execute a Saved Query

```bash
POST /v2/illuminate/queries/{id}/execute
```

No request body needed. Returns the same response shape as ad-hoc execute.

## Account Limits

Accounts have a maximum number of saved Queries. If you reach the limit the API returns:
```
"You have reached the maximum number of queries allowed. Contact PubNub Support to upgrade."
```

> **Before creating a new Query**, if a limit error is returned, run `GET /queries` and list the existing ones with their names and creation dates. Show the list to the user and ask which query they want to delete before proceeding. Do not delete anything without explicit confirmation.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `400` — query limit reached | Account is at the maximum number of saved Queries | List current queries, ask user which to delete, then delete and retry |
| `400` — missing `businessObjectId` | `source.type` is `"businessObject"` but no ID provided | Add `businessObjectId` to the source object |
| `400` — mutually exclusive timeRange | Both `relative` and `absolute` specified | Use only one |
| Decision breaks after query update | Changed output field names or types | Deactivate the referencing Decision before updating the Query |
| No results on execute | Time range too narrow or filters too strict | Widen the time window or check field aliases match field names |

## Best Practices

- Always use the ad-hoc execute endpoint to validate your pipeline before saving.
- Use `version: "2.0"` for all queries.
- Keep `limit` reasonable (50–200 rows) for queries used as Decision sources — very large result sets can slow decision evaluation.
- If you update a query's output schema (rename a field or change its type), deactivate any Decision that uses this query before updating.
- Deleting a saved Query does not delete referencing Decisions or Dashboard charts, but those resources may stop functioning correctly.
