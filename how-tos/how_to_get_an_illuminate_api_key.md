---
resource: authentication
triggers:
  - illuminate api key
  - service integration pubnub
  - authenticate illuminate
  - get illuminate credentials
  - illuminate authorization header
requires:
  - pubnub account with illuminate enabled
  - admin portal access at admin.pubnub.com
produces:
  - api_key — format: si_... — used in Authorization header on all Illuminate API requests
---

# How to Get an Illuminate API Key with PubNub

> **Prerequisites**
>
> - A PubNub account with Illuminate enabled on your plan
> - Admin Portal access at [admin.pubnub.com](https://admin.pubnub.com)

The Illuminate REST API authenticates using an **API key** issued by a **Service Integration** in the PubNub Admin Portal. Service Integrations are machine identities — they represent a program or script that needs programmatic access to your account, without using an interactive login.

All Illuminate API requests require two headers:

```
Authorization: <your_api_key>
PubNub-Version: 2026-02-09
```

## Step 1: Create a Service Integration

1. Log in to [admin.pubnub.com](https://admin.pubnub.com).
2. Click your account name in the top-right corner and select **My Account**.
3. Navigate to **Organization Settings** → **API Management**.
4. Click **Create Service Integration**.
5. Enter a descriptive name — for example, `Illuminate Automation` or `MCP Server`.
6. Add a permission row with these settings:
   - **Level:** Account
   - **PubNub resource:** Illuminate
   - **Access:** Read & write
7. Click **Create**.

> **Principle of least privilege**
>
> Only grant the permissions your integration actually needs. For read-only dashboards or monitoring, use Read access. For creating and managing resources, use Read & write. Create a separate Service Integration per environment (dev, staging, production).

## Step 2: Generate an API Key

1. In the Service Integrations table, click the row for the integration you just created.
2. Click **+ Generate API Key**.
3. Choose an expiration date. API keys have a maximum lifetime of 1 year; use the shortest practical period for your use case.
4. Click **Generate API Key**.

> **Important: Copy the key immediately.**
> The API key is shown only once. If you lose it, generate a new one and revoke the old one. The new key will have the same permissions.

## Step 3: Store the Key Securely

Never commit an API key to source control. Store it in one of:

- An environment variable: `export ILLUMINATE_API_KEY="si_..."`
- A secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- A `.env` file that is listed in `.gitignore`

The `manage_illuminate.py` script reads from `ILLUMINATE_API_KEY` automatically, or accepts `--api-key` as a flag.

## What Else You Will Need

Creating Illuminate resources requires more than just the API key:

| Operation | What you need |
|---|---|
| List, get, delete any resource | API key only |
| Create / activate a Business Object | API key + PubNub **subscribe key** (`sub-c-...`) |
| Create a Decision with `PUBNUB_PUBLISH` action | API key + subscribe key + **publish key** (`pub-c-...`) |
| Create a Decision with `WEBHOOK_EXECUTION` or App Context action | API key only |

Your subscribe and publish keys are found in the Admin Portal under your keyset.

## Step 4: Test Your Key

Confirm the key works by listing your Business Objects:

```bash
curl -s \
  -H "Authorization: $ILLUMINATE_API_KEY" \
  -H "PubNub-Version: 2026-02-09" \
  https://admin-api.pubnub.com/v2/illuminate/business-objects
```

A `200 OK` with a JSON array confirms the key is valid. A `401` means the key is wrong or expired.

## Managing API Keys

**Rotation (zero-downtime):**

Each Service Integration supports up to three active API keys. To rotate without downtime:

1. Generate a second key in the same Service Integration.
2. Update your application to use the new key.
3. Revoke the old key once all clients have switched.

**Revocation:**

1. Navigate to My Account → Organization Settings → API Management.
2. Click the Service Integration row.
3. Click **Revoke API key** next to the key you want to invalidate. It stops working immediately.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Key is wrong, expired, or revoked | Check the key value and expiration date |
| `403 Forbidden` | Key lacks the required permission | Edit the Service Integration to add the missing permission |
| `500 Internal Server Error` on decision POST | `activeFrom`/`activeUntil` missing from request body | Always include both date fields when creating decisions — see [how_to_create_illuminate_decisions.md](how_to_create_illuminate_decisions.md) |

## Best Practices

- Use a separate Service Integration per environment (dev, staging, production).
- Set the shortest practical expiration. Rotate keys before they expire.
- Name integrations after their purpose: `Production MCP Server`, `CI Pipeline`, etc.
- Never log or print API keys in application output.
- Review the API Management page periodically and revoke any integrations that are no longer in use.
