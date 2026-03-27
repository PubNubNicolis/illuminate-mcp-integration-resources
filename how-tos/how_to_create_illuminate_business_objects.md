---
resource: business-object
base_url: https://admin-api.pubnub.com/v2/illuminate/business-objects
triggers:
  - create illuminate business object
  - define message schema for illuminate
  - add fields to illuminate
  - jsonpath field mapping
  - activate business object
  - illuminate data schema
requires:
  - illuminate api key
  - pubnub subscribe key (to activate)
produces:
  - business_object_id — $.id — used as sourceId in Metrics, Decisions, Queries
  - field_ids — $.fields[*].id — one UUID per field, used as dimensionIds / measureId / inputFields[].sourceId
---

# How to Create Illuminate Business Objects

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - At least one PubNub subscribe key (`sub-c-...`) — required to activate the Business Object

A Business Object is Illuminate's data schema layer. It tells Illuminate which fields to extract from your PubNub messages so they can be used in Metrics, Decisions, and Queries.

**Base URL:** `https://admin-api.pubnub.com/v2/illuminate/business-objects`

## How Illuminate Receives Messages

Illuminate wraps every PubNub message it ingests into the following structure:

```json
{
  "message": {
    "body": <your_original_pubnub_message>
  }
}
```

Because of this, all JSONPath expressions in a Business Object's fields **must start with `$.message.body.`**

For example, if your PubNub messages look like this:
```json
{ "user_id": "user-123", "event_type": "purchase", "amount": 49.99 }
```

Then the JSONPath for `user_id` is `$.message.body.user_id`.

## Field Types

| `jsonFieldType` | Use for | Notes |
|---|---|---|
| `TEXT` | String values used for grouping or filtering | Max 256 characters; use for dimension fields in metrics |
| `TEXT_LONG` | Longer strings | Max 1,000 characters; limited to 5 per Business Object |
| `NUMERIC` | Numbers that will be aggregated (SUM, AVG, etc.) | Required for measure fields in metrics |
| `TIMESTAMP` | ISO 8601 datetime strings | Used in `TIME_DIFF` derived fields |
| `BOOLEAN` | True/false values | |

## Step 1: Design Your Schema

Before making any API calls, list the fields from your PubNub messages you want to track. For each field, determine its name, JSONPath, and type.

**Example:** A chat application tracking messages:

| Field Name | JSONPath | Type | Purpose |
|---|---|---|---|
| User ID | `$.message.body.user_id` | `TEXT` | Group by user in metrics |
| Channel | `$.message.body.channel` | `TEXT` | Group by channel |
| Event Type | `$.message.body.event_type` | `TEXT` | Filter by event type |
| Message Length | `$.message.body.length` | `NUMERIC` | Aggregate (AVG, SUM) |

> **Tip:** Use `TEXT` for any field you will group by or filter on. Use `NUMERIC` for any field you will aggregate with AVG, SUM, MIN, or MAX.

## Step 2: Create the Business Object (inactive)

Always create Business Objects with `isActive: false` first. This lets you verify the field configuration before Illuminate begins ingesting data.

**Request body schema:**

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | 1–100 characters |
| `description` | No | Optional label |
| `isActive` | Yes | Always `false` on create |
| `subkeys` | Yes (to activate) | Array of `sub-c-...` keys; can be empty on create but must be populated before `isActive: true` |
| `fields` | Yes | Array of field objects (see below) |
| `fields[].name` | Yes | 1–50 characters |
| `fields[].source` | Yes | `"JSONPATH"` or `"DERIVED"` |
| `fields[].jsonPath` | Yes (if JSONPATH) | Must start with `$.message.body.` |
| `fields[].jsonFieldType` | Yes | `TEXT`, `TEXT_LONG`, `NUMERIC`, `TIMESTAMP`, or `BOOLEAN` |
| `fields[].id` | No on POST | Omit on creation — auto-generated; **required on PUT** |

```bash
POST /v2/illuminate/business-objects
```

```json
{
  "name": "Chat Events",
  "description": "Tracks chat message events from the main application",
  "isActive": false,
  "subkeys": ["sub-c-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
  "fields": [
    {
      "name": "User ID",
      "source": "JSONPATH",
      "jsonPath": "$.message.body.user_id",
      "jsonFieldType": "TEXT"
    },
    {
      "name": "Channel",
      "source": "JSONPATH",
      "jsonPath": "$.message.body.channel",
      "jsonFieldType": "TEXT"
    },
    {
      "name": "Event Type",
      "source": "JSONPATH",
      "jsonPath": "$.message.body.event_type",
      "jsonFieldType": "TEXT"
    },
    {
      "name": "Message Length",
      "source": "JSONPATH",
      "jsonPath": "$.message.body.length",
      "jsonFieldType": "NUMERIC"
    }
  ]
}
```

> **Do not include `id` on fields when creating.** The API auto-generates field IDs and returns them in the response. You will need these IDs when creating Metrics and Decisions.

> **Expected:** `201` response.

**Save from the response:**

```json
{
  "id": "19b9c407-...",        ← Business Object ID — needed for metrics, decisions, queries
  "fields": [
    { "id": "a7de23d3-...", "name": "User ID", ... },
    { "id": "8c96027b-...", "name": "Channel", ... },
    { "id": "94acbe34-...", "name": "Event Type", ... },
    { "id": "31696fd1-...", "name": "Message Length", ... }
  ]
}
```

| Value | Response path | Used for |
|---|---|---|
| `business_object_id` | `$.id` | Metric `businessObjectId`, Decision `sourceId` (COUNT), Query `businessObjectId` |
| `field_ids` | `$.fields[*].id` | Metric `dimensionIds[]`, Metric `measureId` (NUMERIC only), Decision `inputFields[].sourceId` |

Field IDs are used as:
- `dimensionIds` in Metrics (for grouping)
- `measureId` in Metrics (for SUM/AVG/MIN/MAX — must be NUMERIC)
- `inputFields[].sourceId` in Decisions

## Step 3: Activate the Business Object

Once your field configuration looks correct, activate the Business Object to begin data ingestion. Send a `PUT` with the full body plus `isActive: true`.

```bash
PUT /v2/illuminate/business-objects/{id}
```

```json
{
  "name": "Chat Events",
  "description": "Tracks chat message events from the main application",
  "isActive": true,
  "subkeys": ["sub-c-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
  "fields": [
    {
      "id": "a7de23d3-...",
      "name": "User ID",
      "source": "JSONPATH",
      "jsonPath": "$.message.body.user_id",
      "jsonFieldType": "TEXT"
    },
    ...all other fields with their ids...
  ]
}
```

> **Include field `id` values on PUT.** Omitting an existing field's `id` in a PUT body deletes that field.

> **Expected:** `200` response with `isActive: true`. Illuminate will now start capturing data from the channels associated with the subscribe key(s) in `subkeys`.

## How to Validate a JSONPath Expression

Before activating, you can test that a JSONPath expression is valid:

```bash
POST /v2/illuminate/business-objects/validate-json-path
```

```json
{ "jsonPath": "$.message.body.user_id" }
```

## Updating Fields on an Active Business Object

Active Business Objects do not allow structural field changes. To add or remove fields:

1. **Disable any active Decisions** that use this Business Object.
2. **Deactivate the Business Object:** PUT with `isActive: false`.
3. **Make your field changes** via PUT (include existing field `id` values; omit `id` only for new fields).
4. **Reactivate:** PUT with `isActive: true`.

> **Warning:** Deactivating a Business Object immediately pauses data ingestion. Any events published during the deactivation window will not be captured.

## Derived Fields (TIME_DIFF)

In addition to JSONPATH fields, Illuminate supports derived fields that calculate the time difference between two events:

```json
{
  "name": "Response Time",
  "source": "DERIVED",
  "derivation": {
    "operation": "TIME_DIFF",
    "params": {
      "startSource": "DATA_FIELD",
      "startFieldId": "<timestamp-field-id>",
      "endSource": "PUBLISH_TIMETOKEN"
    }
  }
}
```

`startSource` and `endSource` can be `DATA_FIELD` (a TIMESTAMP field in your Business Object) or `PUBLISH_TIMETOKEN` (the PubNub message timetoken).

## Common Errors

| HTTP | Exact API error string (or symptom) | Cause | Fix |
|---|---|---|---|
| `400` | `"A business object must be deactivated to edit measures or dimensions"` | Adding/removing fields while `isActive: true` | Set `isActive: false` first, make changes, reactivate |
| `400` | `"subkeys must not be empty when activating a business object"` | `subkeys` array is empty when setting `isActive: true` | Add at least one subscribe key |
| `400` | `"Cannot deactivate business object with enabled decisions"` | Deactivating a BO whose decisions are enabled | Disable all referencing decisions first |
| *(no error)* | Fields return `""` in query results | JSONPath prefix wrong or path doesn't match message structure | Ensure all field paths start with `$.message.body.` |
| `400` | `"Maximum number of TEXT_LONG fields exceeded"` | More than 5 `TEXT_LONG` fields in one BO | Use `TEXT` (256 chars) unless you need strings longer than 256 chars |

## Deletion Warning

Deleting a Business Object is **irreversible and cascades** to all dependent resources:

- All associated Metrics
- All associated Decisions (and their rules and action history)
- All associated Dashboard charts
- All associated Queries

Always confirm with `GET /business-objects/{id}` before deleting to check what depends on it.

## Best Practices

- Always create with `isActive: false` and verify field JSONPaths before activating.
- Keep field names short and descriptive (1–50 characters).
- Use `TEXT` for dimensions (things you group by) and `NUMERIC` for measures (things you aggregate).
- Store the Business Object ID and all field IDs — you will need them for every downstream resource.
- Maximum 100 fields per Business Object. Use `TEXT` instead of `TEXT_LONG` unless you need strings longer than 256 characters.
- Avoid putting PII in channel names or field values unless your data residency requirements allow it.
