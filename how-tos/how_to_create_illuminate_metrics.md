---
resource: metric
base_url: https://admin-api.pubnub.com/v2/illuminate/metrics
triggers:
  - create illuminate metric
  - count messages illuminate
  - sum average illuminate
  - metric aggregation illuminate
  - threshold alert illuminate
  - message count per user
  - evaluation window illuminate
requires:
  - illuminate api key
  - business_object_id and field_ids (from how_to_create_illuminate_business_objects.md)
  - NUMERIC field id (for SUM/AVG/MIN/MAX metrics only)
produces:
  - metric_id — $.id — used as sourceId in METRIC decisions and Dashboard charts
  - measureId — $.measureId — present only for SUM/AVG/MIN/MAX; used as inputFields[].sourceId in Decisions
  - dimensionIds — $.dimensionIds[] — BO field UUIDs; used as inputFields[].sourceId (DIMENSION) in Decisions
---

# How to Create Illuminate Metrics

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - An active Business Object with field IDs saved (see [how_to_create_illuminate_business_objects.md](how_to_create_illuminate_business_objects.md))

A Metric defines an aggregation applied to Business Object fields over a sliding time window. Metrics are the data source for Decisions (threshold alerting) and Dashboard charts.

**Base URL:** `https://admin-api.pubnub.com/v2/illuminate/metrics`

## Dimensions vs Measures

Before creating a Metric, understand the distinction between the two types of Business Object fields:

| Concept | Field type | Used as | Example |
|---|---|---|---|
| **Dimension** | `TEXT` | Grouping — split results by this value | user ID, region, event type |
| **Measure** | `NUMERIC` | Aggregation — apply a math function to this value | message count, purchase amount, score |

Metrics group data by **dimensions** and aggregate **measures**.

## Aggregation Functions

| Function | `measureId` required? | What it computes |
|---|---|---|
| `COUNT` | No | Total number of events |
| `COUNT_DISTINCT` | No | Number of unique values (per dimension grouping) |
| `SUM` | Yes (NUMERIC field) | Sum of a numeric field |
| `AVG` | Yes (NUMERIC field) | Average of a numeric field |
| `MIN` | Yes (NUMERIC field) | Minimum value of a numeric field |
| `MAX` | Yes (NUMERIC field) | Maximum value of a numeric field |

> **COUNT and COUNT_DISTINCT do not accept a `measureId`.**
> They count occurrences — there is no specific field to aggregate. Including `measureId` for a COUNT metric returns a 400 error.

## Evaluation Windows

Only these values (in seconds) are accepted. The API rejects any other value:

| Value | Duration |
|---|---|
| `60` | 1 minute |
| `300` | 5 minutes |
| `600` | 10 minutes |
| `900` | 15 minutes |
| `1800` | 30 minutes |
| `3600` | 1 hour |
| `86400` | 1 day |

## Request Body Schema

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | 1–100 characters |
| `businessObjectId` | Yes | BO to aggregate data from |
| `function` | Yes | `COUNT`, `COUNT_DISTINCT`, `SUM`, `AVG`, `MIN`, or `MAX` |
| `evaluationWindow` | Yes | Seconds — must be one of: `60`, `300`, `600`, `900`, `1800`, `3600`, `86400` |
| `dimensionIds` | Yes | Array of BO field IDs (TEXT fields) to group by |
| `measureId` | Conditional | Required for `SUM`/`AVG`/`MIN`/`MAX`; must be a NUMERIC BO field. **Omit for COUNT/COUNT_DISTINCT** |
| `filters` | No | Array of filter objects to scope which events are included |

## Step 1: Create a COUNT Metric

Use COUNT when you want to count how many events happened, grouped by dimension fields.

```bash
POST /v2/illuminate/metrics
```

```json
{
  "name": "Message Count by User",
  "businessObjectId": "<business-object-id>",
  "function": "COUNT",
  "evaluationWindow": 300,
  "dimensionIds": [
    "<user-id-field-id>",
    "<channel-field-id>"
  ]
}
```

This metric counts the number of events per unique `(user_id, channel)` combination over a rolling 5-minute window.

> **Expected:** `201` response. Save these values:

```json
{
  "id": "xxxxxxxx-...",         ← metric_id — use as sourceId in METRIC decisions and Dashboard charts
  "measureId": null,            ← null for COUNT — use Business Object id in Decision inputFields instead
  "dimensionIds": [
    "xxxxxxxx-...",             ← BO field IDs you passed in — use as DIMENSION sourceId in Decision inputFields
    "xxxxxxxx-..."
  ]
}
```

| Value | Response path | Used for |
|---|---|---|
| `metric_id` | `$.id` | Decision `sourceId`, Dashboard chart `metric.id` |
| `measureId` | `$.measureId` (null for COUNT) | Decision inputField `sourceId` where `sourceType: "MEASURE"` |
| `dimensionIds` | `$.dimensionIds[]` | Decision inputField `sourceId` where `sourceType: "DIMENSION"` |

## Step 2: Create an Aggregation Metric (SUM, AVG, MIN, MAX)

Use an aggregation metric when you want to compute a value from a numeric field.

```bash
POST /v2/illuminate/metrics
```

```json
{
  "name": "Total Purchase Amount by User",
  "businessObjectId": "<business-object-id>",
  "function": "SUM",
  "measureId": "<amount-field-id>",
  "evaluationWindow": 3600,
  "dimensionIds": [
    "<user-id-field-id>",
    "<region-field-id>"
  ]
}
```

This metric sums the `amount` field per unique `(user_id, region)` combination over a 1-hour rolling window.

> **Expected:** `201` response. Save these values:

```json
{
  "id": "xxxxxxxx-...",         ← metric_id
  "measureId": "xxxxxxxx-...", ← the BO field ID you passed as measureId — use as MEASURE sourceId in Decision inputFields
  "dimensionIds": ["xxxxxxxx-...", "xxxxxxxx-..."]
}
```

## Adding Filters

Filters scope a Metric to only the events that match specific criteria. This is useful when a Business Object captures many event types but you only want the Metric to evaluate a subset.

```json
{
  "name": "Purchase Amount by User",
  "businessObjectId": "<business-object-id>",
  "function": "SUM",
  "measureId": "<amount-field-id>",
  "evaluationWindow": 3600,
  "dimensionIds": ["<user-id-field-id>"],
  "filters": [
    {
      "sourceType": "DIMENSION",
      "sourceId": "<event-type-field-id>",
      "operation": "STRING_EQUALS",
      "arguments": ["purchase"]
    }
  ]
}
```

**Filter operations:**
`STRING_EQUALS` | `STRING_NOT_EQUAL` | `STRING_CONTAINS` | `STRING_NOT_CONTAINS` | `STRING_IS_EMPTY` | `STRING_IS_NOT_EMPTY` | `STRING_STARTS_WITH` | `STRING_ENDS_WITH`

> **Filter matching is case-sensitive.**

> **Save filter `id` values from the response.** When updating a Metric with PUT, existing filters must include their `id`. Omitting an existing filter's `id` deletes it.

## How Metrics Feed Downstream Resources

| Downstream resource | How the Metric is used |
|---|---|
| **Decision** | Provides the data source — the Decision evaluates the aggregated metric value on a schedule |
| **Dashboard chart** | Each chart displays one Metric; you choose which dimensions to display |

When creating a METRIC-sourced Decision, you will need:
- The Metric `id` as the Decision's `sourceId`
- The Metric's `measureId` (for SUM/AVG/MIN/MAX) or the Business Object `id` (for COUNT) as the Decision's inputField `sourceId`
- The dimension field IDs from the Metric's `dimensionIds`

See [how_to_create_illuminate_decisions.md](how_to_create_illuminate_decisions.md) for the full inputFields pattern.

## Updating a Metric

```bash
PUT /v2/illuminate/metrics/{id}
```

> **Deactivate all referencing Decisions before updating a Metric.** The API rejects updates to a Metric if any Decision that uses it has `enabled: true`.

PUT is a full replacement. Include:
- All existing fields (`businessObjectId`, `function`, `evaluationWindow`, etc.)
- `filters[].id` for any existing filters — omitting an existing filter's `id` deletes it
- Updated `measureId` if you are changing the function type (e.g., switching from COUNT to SUM requires adding `measureId`)

## Common Errors

| HTTP | Exact API error string (or symptom) | Cause | Fix |
|---|---|---|---|
| `400` | `"Count metrics cannot have a measure field"` | Providing `measureId` with `COUNT` or `COUNT_DISTINCT` | Omit `measureId` for COUNT and COUNT_DISTINCT |
| `400` | `"measureId is required for SUM/AVG/MIN/MAX aggregation functions"` | Using `AVG`/`SUM`/`MIN`/`MAX` without `measureId` | Add `measureId` referencing a NUMERIC BO field |
| `400` | `"The provided evaluation window is not supported with your current plan. Contact PubNub Support to upgrade."` | Using a non-standard window value | Use one of: `60`, `300`, `600`, `900`, `1800`, `3600`, `86400` |
| `400` | `"Cannot update metric while decisions are enabled"` | Trying to update while a Decision using this Metric is enabled | Disable all referencing Decisions first |
| *(no error)* | Metric deleted, downstream Decisions stop working | Deleting a Metric also cascades to referencing Decisions | Check `GET /metrics/{id}` for associated decisions before deleting |

## Best Practices

- Choose `dimensionIds` carefully — every unique combination of dimension values creates a separate "row" in the metric. Too many high-cardinality dimensions can generate large result sets.
- Use `filters` to scope Metrics to specific event types rather than creating separate Business Objects per event type.
- Choose the evaluation window based on your alerting needs — shorter windows (60s, 300s) are better for real-time spam/fraud detection; longer windows (3600s, 86400s) suit trend monitoring.
- For COUNT-based thresholds (e.g., "more than 10 messages in 5 minutes"), use `COUNT` with the relevant dimension as `dimensionIds`. The count itself is accessed in Decisions via `sourceType: "BUSINESSOBJECT"`.
- Store the Metric `id`, `measureId`, and `dimensionIds` — you will need all three when creating a METRIC-sourced Decision.
