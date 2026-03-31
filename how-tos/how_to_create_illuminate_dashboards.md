---
resource: dashboard
base_url: https://admin-api.pubnub.com/v2/illuminate/dashboards
triggers:
  - create illuminate dashboard
  - visualize illuminate metrics
  - chart illuminate data
  - overlay decision triggers
  - dashboard charts
  - line bar chart illuminate
requires:
  - illuminate api key
  - metric_id (from how_to_create_illuminate_metrics.md) — one per chart
  - decision_ids (optional, for overlaying trigger events)
produces:
  - dashboard_id — $.id — needed for all PUT and DELETE operations
  - chart_ids — $.charts[*].id — required in every subsequent PUT body
---

# How to Create Illuminate Dashboards

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - At least one Metric (see [how_to_create_illuminate_metrics.md](how_to_create_illuminate_metrics.md)) — each chart requires a Metric
> - (Optional) Decision IDs to overlay trigger events on charts

Dashboards visualize your Metrics over time as charts. You can overlay Decision trigger events directly on charts, making it easy to correlate when rules fired with changes in metric values.

**Base URL:** `https://admin-api.pubnub.com/v2/illuminate/dashboards`

## Using the manage_illuminate Tool

Use the `manage_illuminate` tool's `create` operation to POST a new Dashboard. Save the returned `id` and `charts[*].id` — the charts array is a **full replacement** on every PUT, so all existing chart IDs must be included in every update.

**Create a Dashboard:**

```json
{
  "resource": "dashboard",
  "operation": "create",
  "data": {
    "name": "Chat Engagement",
    "dateRange": "24 hours",
    "charts": [
      {
        "name": "Message Volume Over Time",
        "metric": { "id": "<metric-id>" },
        "viewType": "LINE",
        "size": "FULL",
        "showDecisions": true,
        "dimensionIds": ["<user-field-id>"],
        "decisionIds": ["<decision-id>"]
      }
    ]
  }
}
```

**Update a Dashboard (GET first to capture all chart IDs):**

```json
{
  "resource": "dashboard",
  "operation": "get",
  "id": "<dashboard-id>"
}
```

Then PUT the full body — include all existing charts with their `id` values:

```json
{
  "resource": "dashboard",
  "operation": "update",
  "id": "<dashboard-id>",
  "data": {
    "name": "Chat Engagement",
    "dateRange": "1 week",
    "charts": [
      {
        "id": "<existing-chart-id>",
        "name": "Message Volume Over Time",
        "metric": { "id": "<metric-id>" },
        "viewType": "LINE",
        "size": "FULL",
        "showDecisions": true,
        "dimensionIds": ["<user-field-id>"],
        "decisionIds": ["<decision-id>"]
      }
    ]
  }
}
```

**List all Dashboards:**

```json
{
  "resource": "dashboard",
  "operation": "list"
}
```

> **Critical:** The `charts` array is a full replacement on every `update` call. Any chart omitted from the body is permanently deleted. Always `get` the current dashboard state before updating.

---

## Chart Types

| `viewType` | Best for |
|---|---|
| `LINE` | Trend monitoring — how a metric changes over time |
| `BAR` | Comparison — how a metric differs across dimension values |
| `STACKED` | Composition — breakdown of a metric across multiple dimension values |

## Chart Sizes

| `size` | Layout |
|---|---|
| `FULL` | Full dashboard width — one chart per row |
| `HALF` | Half width — two charts side by side |

## Date Ranges

| `dateRange` value | Period |
|---|---|
| `"30 minutes"` | Last 30 minutes |
| `"1 hour"` | Last 1 hour |
| `"24 hours"` | Last 24 hours |
| `"3 days"` | Last 3 days |
| `"1 week"` | Last 7 days |
| `"30 days"` | Last 30 days |
| `"3 months"` | Last 3 months |
| `"Custom date"` | Specific date range — requires `startDate` and `endDate` |

When `dateRange` is `"Custom date"`, you must also include `startDate` and `endDate` in ISO 8601 format.

## Step 1: Create a Dashboard

```bash
POST /v2/illuminate/dashboards
```

```json
{
  "name": "Chat Engagement",
  "dateRange": "24 hours",
  "charts": [
    {
      "name": "Message Volume Over Time",
      "metric": { "id": "<metric-id>" },
      "viewType": "LINE",
      "size": "FULL",
      "showDecisions": true,
      "dimensionIds": ["<user-field-id>"],
      "decisionIds": ["<decision-id>"]
    },
    {
      "name": "Messages by Channel",
      "metric": { "id": "<metric-id>" },
      "viewType": "BAR",
      "size": "HALF",
      "showDecisions": false,
      "dimensionIds": ["<channel-field-id>"],
      "decisionIds": []
    }
  ]
}
```

**Chart fields:**

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Chart title (1–50 characters) |
| `metric` | Yes | `{ "id": "<metric-id>" }` — on create, pass only the ID |
| `viewType` | Yes | `LINE`, `BAR`, or `STACKED` |
| `size` | Yes | `FULL` or `HALF` |
| `showDecisions` | Yes | Whether to display Decision trigger events on the chart |
| `dimensionIds` | No | Field IDs from the Business Object to use as the default dimension grouping |
| `decisionIds` | No | Decision IDs whose trigger events will be overlaid on the chart |

> **Expected:** `201` response.

| Value | Response path | Used for |
|---|---|---|
| `dashboard_id` | `$.id` | All PUT and DELETE calls |
| `chart_ids` | `$.charts[*].id` | Required in every subsequent PUT body — omitting a chart ID deletes that chart |

## Overlaying Decision Triggers

Setting `showDecisions: true` and populating `decisionIds` places vertical markers on a LINE chart at the timestamps when those Decisions fired. This lets you visually inspect whether a spike in metric values correlates with a rule execution.

```json
{
  "name": "Spam Activity",
  "metric": { "id": "<message-count-metric-id>" },
  "viewType": "LINE",
  "size": "FULL",
  "showDecisions": true,
  "dimensionIds": ["<user-field-id>"],
  "decisionIds": ["<spam-detection-decision-id>", "<mute-users-decision-id>"]
}
```

## Step 2: Update a Dashboard

```bash
PUT /v2/illuminate/dashboards/{id}
```

> **The `charts` array is a full replacement on PUT.**
> Any chart not included in the PUT body is permanently deleted.
> Always include all existing charts with their `charts[].id` values, even if you are only changing one chart.

**Example — changing the date range while keeping all existing charts:**

```json
{
  "name": "Chat Engagement",
  "dateRange": "1 week",
  "charts": [
    {
      "id": "<existing-chart-id-1>",
      "name": "Message Volume Over Time",
      "metric": { "id": "<metric-id>" },
      "viewType": "LINE",
      "size": "FULL",
      "showDecisions": true,
      "dimensionIds": ["<user-field-id>"],
      "decisionIds": ["<decision-id>"]
    },
    {
      "id": "<existing-chart-id-2>",
      "name": "Messages by Channel",
      "metric": { "id": "<metric-id>" },
      "viewType": "BAR",
      "size": "HALF",
      "showDecisions": false,
      "dimensionIds": ["<channel-field-id>"],
      "decisionIds": []
    }
  ]
}
```

**Example — adding a new chart to an existing dashboard:**

1. `GET /dashboards/{id}` to retrieve the current state with all chart IDs
2. Add the new chart object (without an `id`) to the `charts` array
3. `PUT /dashboards/{id}` with the full array including all existing charts

## Custom Date Range

```json
{
  "name": "Event Day Analytics",
  "dateRange": "Custom date",
  "startDate": "2026-03-15T00:00:00Z",
  "endDate": "2026-03-15T23:59:59Z",
  "charts": [...]
}
```

## Deleting a Dashboard

```bash
DELETE /v2/illuminate/dashboards/{id}
```

Deleting a Dashboard removes only the visualization configuration. The underlying Metrics, Decisions, and Business Objects are **not** affected.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `400` — missing startDate/endDate | `dateRange` is `"Custom date"` without dates | Add both `startDate` and `endDate` in ISO 8601 format |
| Chart disappears after update | Omitted an existing chart from the PUT body | Always include all charts with their `id` in every PUT |
| `400` — duplicate chart created | Included a chart in PUT without its `id` | The API treats missing `id` as a new chart — always include `id` for existing charts |
| `404` on PUT | Dashboard ID not found | Verify the ID with `GET /dashboards` |

## Best Practices

- Always do a `GET /dashboards/{id}` before updating — copy the existing charts array and modify it rather than building from scratch.
- Use `HALF` size for related charts that benefit from side-by-side comparison (e.g., LINE of total + BAR of breakdown).
- Use `dimensionIds` to set a useful default grouping; users can change the selected dimension interactively in the Admin Portal.
- Overlay relevant Decisions on LINE charts to make it easy to correlate rule firings with metric changes.
- Store Dashboard and chart IDs after creation — they are not easily discoverable without a `GET /dashboards` call.
- `customerId` can only be set at creation time and cannot be changed — only relevant for OEM/Partner Portal setups.
