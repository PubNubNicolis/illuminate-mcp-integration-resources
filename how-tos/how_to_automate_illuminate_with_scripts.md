---
resource: automation
base_url: https://admin-api.pubnub.com/v2/illuminate
triggers:
  - automate illuminate setup
  - script illuminate resources
  - bulk create illuminate
  - programmatic illuminate configuration
  - ci cd illuminate
  - deploy illuminate pipeline
requires:
  - illuminate api key (si_...)
  - python 3.8+ or node.js 18+
  - pubnub publish key and subscribe key (for publish-fake-data verification)
produces:
  - repeatable Illuminate configuration scripts
  - CI/CD-compatible setup automation
---

# How to Automate Illuminate with Scripts

> **Prerequisites**
>
> - An Illuminate API key starting with `si_` (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - Python 3.8+ or Node.js 18+ depending on your preferred approach
> - A PubNub subscribe key (`sub-c-...`) for the keyset you want to activate your Business Object against

Scripted automation lets you deploy Illuminate pipelines repeatably — useful for CI/CD pipelines, multi-environment setups (staging vs production), and onboarding new keysets to a standard configuration without manual clicks.

---

## When to use scripts vs the MCP tool

| Use case | Recommended approach |
|---|---|
| Interactive setup — you're exploring what to build | `manage_illuminate` MCP tool |
| Repeatable deployment across environments | Script (this guide) |
| CI/CD pipeline — deploy on merge | Script |
| Onboarding many keysets to the same config | Script |
| One-off investigation or debugging | `manage_illuminate` MCP tool |

---

## Authentication

All Illuminate API calls require:

```
Authorization: <your_si_key>
PubNub-Version: 2026-02-09
Content-Type: application/json
```

Base URL: `https://admin-api.pubnub.com/v2/illuminate`

---

## Resource creation order (dependency chain)

Always create resources in this order. Each step depends on IDs returned by the previous step:

```
Business Object (inactive)
  └── Metric(s)
        └── Decision(s)
              └── Dashboard
  └── Activate Business Object  ← activate last, after all downstream resources are configured
```

---

## Python example — full pipeline setup

The following script creates a complete spam detection pipeline programmatically.

```python
import requests
import json

API_KEY = "si_your_key_here"
SUBSCRIBE_KEY = "sub-c-your-key-here"

BASE_URL = "https://admin-api.pubnub.com/v2/illuminate"
HEADERS = {
    "Authorization": API_KEY,
    "PubNub-Version": "2026-02-09",
    "Content-Type": "application/json",
}


def create_business_object():
    payload = {
        "name": "Chat Events",
        "description": "Automated pipeline — chat spam detection",
        "isActive": False,
        "subkeys": [SUBSCRIBE_KEY],
        "fields": [
            {"name": "User ID",  "source": "JSONPATH", "jsonPath": "$.message.body.user_id",  "jsonFieldType": "TEXT"},
            {"name": "Channel",  "source": "JSONPATH", "jsonPath": "$.message.body.channel",  "jsonFieldType": "TEXT"},
            {"name": "Message",  "source": "JSONPATH", "jsonPath": "$.message.body.message",  "jsonFieldType": "TEXT"},
        ],
    }
    resp = requests.post(f"{BASE_URL}/business-objects", headers=HEADERS, json=payload)
    resp.raise_for_status()
    bo = resp.json()
    print(f"Created BO: {bo['id']}")
    return bo


def create_metric(bo_id, user_field_id, channel_field_id):
    payload = {
        "name": "Message Count by User",
        "businessObjectId": bo_id,
        "function": "COUNT",
        "evaluationWindow": 60,
        "dimensionIds": [user_field_id, channel_field_id],
    }
    resp = requests.post(f"{BASE_URL}/metrics", headers=HEADERS, json=payload)
    resp.raise_for_status()
    metric = resp.json()
    print(f"Created Metric: {metric['id']}")
    return metric


def activate_business_object(bo):
    """PUT with isActive: true — include all existing fields with their IDs."""
    payload = {**bo, "isActive": True}
    resp = requests.put(f"{BASE_URL}/business-objects/{bo['id']}", headers=HEADERS, json=payload)
    resp.raise_for_status()
    print(f"Activated BO: {bo['id']}")


def main():
    bo = create_business_object()

    # Extract field IDs from the response
    fields = {f["name"]: f["id"] for f in bo["fields"]}
    user_field_id = fields["User ID"]
    channel_field_id = fields["Channel"]

    metric = create_metric(bo["id"], user_field_id, channel_field_id)

    # Activate the BO last — after metrics and decisions are configured
    activate_business_object(bo)

    print("\nPipeline created successfully.")
    print(f"  Business Object ID : {bo['id']}")
    print(f"  Metric ID          : {metric['id']}")
    print(f"  Metric measureId   : {metric.get('measureId')} (null for COUNT)")
    print(f"  Dimension IDs      : {metric['dimensionIds']}")
    print("\nSave these IDs — you will need them to create Decisions.")


if __name__ == "__main__":
    main()
```

---

## Node.js example — create and activate a Business Object

```javascript
const API_KEY = "si_your_key_here";
const SUBSCRIBE_KEY = "sub-c-your-key-here";
const BASE_URL = "https://admin-api.pubnub.com/v2/illuminate";

const headers = {
  Authorization: API_KEY,
  "PubNub-Version": "2026-02-09",
  "Content-Type": "application/json",
};

async function createBusinessObject() {
  const res = await fetch(`${BASE_URL}/business-objects`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Chat Events",
      isActive: false,
      subkeys: [SUBSCRIBE_KEY],
      fields: [
        { name: "User ID", source: "JSONPATH", jsonPath: "$.message.body.user_id", jsonFieldType: "TEXT" },
        { name: "Channel", source: "JSONPATH", jsonPath: "$.message.body.channel", jsonFieldType: "TEXT" },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function activateBusinessObject(bo) {
  const res = await fetch(`${BASE_URL}/business-objects/${bo.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ ...bo, isActive: true }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

(async () => {
  const bo = await createBusinessObject();
  console.log("Created BO:", bo.id);
  await activateBusinessObject(bo);
  console.log("Activated BO:", bo.id);
})();
```

---

## CI/CD integration pattern

Store `ILLUMINATE_API_KEY` and `PUBNUB_SUBSCRIBE_KEY` as environment secrets in your CI system.

```bash
# Example GitHub Actions step
- name: Deploy Illuminate pipeline
  env:
    ILLUMINATE_API_KEY: ${{ secrets.ILLUMINATE_API_KEY }}
    PUBNUB_SUBSCRIBE_KEY: ${{ secrets.PUBNUB_SUBSCRIBE_KEY }}
  run: python scripts/deploy_illuminate.py
```

**Idempotency tip:** Before creating a resource, call `GET /business-objects` and check if a resource with the same `name` already exists. If it does, skip creation and use the existing ID. This makes your script safe to re-run on every deploy.

---

## Common errors in scripts

| HTTP | Cause | Fix |
|---|---|---|
| `400` — subkeys empty on activate | `isActive: true` sent before `subkeys` is populated | Always populate `subkeys` before activating |
| `400` — field editing while active | Trying to add/remove fields on an active BO | Deactivate, edit, reactivate |
| `400` — count metrics cannot have a measure | Providing `measureId` with `COUNT` function | Omit `measureId` for `COUNT` and `COUNT_DISTINCT` |
| `500` on Decision POST | Missing `hitType` or `executeOnce` | Always include both; see [how_to_create_illuminate_decisions.md](how_to_create_illuminate_decisions.md) |
| `401` | Wrong or expired API key | Verify key starts with `si_` and is active in PubNub Portal |

---

## Using the manage_illuminate Tool

If you are using the PubNub MCP server rather than writing raw scripts, the `manage_illuminate` tool handles the same operations:

```json
{
  "resource": "business-object",
  "operation": "create",
  "data": {
    "name": "Chat Events",
    "isActive": false,
    "subkeys": ["sub-c-..."],
    "fields": [
      { "name": "User ID", "source": "JSONPATH", "jsonPath": "$.message.body.user_id", "jsonFieldType": "TEXT" }
    ]
  }
}
```

The MCP tool's `create` → `activate` → `create metric` flow produces the same result as the scripts above. Use the MCP tool for interactive sessions and scripts for automation.

---

## Best practices

- Always create Business Objects with `isActive: false` first and verify field JSONPaths before activating.
- Store all created IDs (BO id, field ids, metric id, decision id) in a state file or CI artifact so subsequent runs can reference existing resources.
- Use `field-health` (via the MCP tool or the ad-hoc query endpoint) after activating to confirm JSONPath expressions are resolving correctly against live data.
- For production deployments, pin the API version header (`PubNub-Version: 2026-02-09`) so your scripts are unaffected by future API changes.
