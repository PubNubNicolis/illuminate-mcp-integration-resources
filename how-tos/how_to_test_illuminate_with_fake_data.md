---
resource: testing
script: MCP/skills/scripts/illuminate/test_illuminate.py
triggers:
  - test illuminate
  - publish fake data illuminate
  - verify illuminate working
  - simulate spam illuminate
  - check action log illuminate
  - debug decision not firing
  - dummy data illuminate
requires:
  - illuminate api key
  - pubnub publish key (pub-c-...)
  - pubnub subscribe key (sub-c-...) — must match the BO's subkeys array
  - python 3.8+
  - pip install -r MCP/skills/scripts/illuminate/requirements.txt
  - active business object id
---

# How to Test Illuminate Resources with Fake Data

> **Prerequisites**
>
> - An Illuminate API key (see [how_to_get_an_illuminate_api_key.md](how_to_get_an_illuminate_api_key.md))
> - PubNub publish key (`pub-c-...`) and subscribe key (`sub-c-...`) for the keyset registered in your Business Object
> - Python 3.8+ with dependencies installed: `pip install -r MCP/skills/scripts/illuminate/requirements.txt`
> - An active Business Object — see [how_to_create_illuminate_business_objects.md](how_to_create_illuminate_business_objects.md)

Testing your Illuminate setup with fake data lets you verify the full pipeline — from data ingestion through query results to decision actions — before any real user traffic arrives.

## Why You Need Fake Data

Illuminate Decisions evaluate on a **schedule** (`executionFrequency`). A Decision with `executionFrequency: 60` checks conditions every 60 seconds. If no messages have been published to your Business Object's subscribe key, there is nothing to evaluate and nothing will ever fire.

Publishing fake messages simulates real user activity so you can:

- Confirm that Illuminate is ingesting messages from your subscribe key
- Verify your JSONPath field mappings are extracting values correctly
- Check that query pipelines return the expected aggregations
- Trigger Decision rules on demand to confirm actions fire correctly
- Debug thresholds before going live (e.g. "does my spam rule actually trigger at 10 messages?")

## How Illuminate Ingests Messages

Illuminate listens to **all channels** on the subscribe key(s) in your Business Object's `subkeys` array. You do not need to publish to a specific channel — any channel on that keyset will be ingested.

Illuminate wraps each message before extracting fields:

```json
{ "message": { "body": <your_pubnub_message> } }
```

So if your Business Object has a field with JSONPath `$.message.body.user_id`, publish a message like:

```json
{ "user_id": "user-123", "channel": "lobby", "message_body": "hello world" }
```

The `user_id` field will be extracted correctly.

## Option 1: Use the Test Script (Recommended)

The `test_illuminate.py` script handles message generation, publishing, and verification in one command.

### Install dependencies

```bash
pip install -r MCP/skills/scripts/illuminate/requirements.txt
```

### Generic publish — N messages based on your BO's schema

```bash
python MCP/skills/scripts/illuminate/test_illuminate.py publish \
  --pubkey pub-c-... \
  --subkey sub-c-... \
  --bo-id <business-object-id> \
  --count 20 \
  --channel test-channel
```

The script fetches the Business Object's field schema and generates realistic fake values for each field type automatically.

### Chat flooding scenario

Publishes many messages rapidly from a single user — designed to trigger a flooding threshold (e.g. `message_count > 10` in a 5-minute window):

```bash
python MCP/skills/scripts/illuminate/test_illuminate.py chat-flooding \
  --pubkey pub-c-... \
  --subkey sub-c-... \
  --bo-id <business-object-id> \
  --count 15 \
  --user-id flood-test-user \
  --channel spam-test-channel \
  --query-id <chat-flooding-query-id> \
  --decision-id <flooding-decision-id>
```

### Cross-posting scenario

Publishes the same message body from one user to multiple different channels — designed to trigger a cross-posting threshold (e.g. `channel_count > 2` in a 10-minute window):

```bash
python MCP/skills/scripts/illuminate/test_illuminate.py cross-posting \
  --pubkey pub-c-... \
  --subkey sub-c-... \
  --bo-id <business-object-id> \
  --user-id xpost-test-user \
  --query-id <cross-posting-query-id> \
  --decision-id <cross-posting-decision-id>
```

### Verify data is flowing

> **Ingestion latency:** Illuminate typically ingests published messages within **20–30 seconds**. If you query immediately after publishing and see 0 rows, wait 30 seconds and retry before concluding there is a problem.

Run this after publishing (wait ~30 seconds first) to confirm Illuminate captured your messages:

```bash
python MCP/skills/scripts/illuminate/test_illuminate.py verify-query \
  --api-key $ILLUMINATE_API_KEY \
  --query-id <saved-query-id>
```

### Check the action log

After waiting at least `executionFrequency` seconds, check whether your Decision fired:

```bash
python MCP/skills/scripts/illuminate/test_illuminate.py check-action-log \
  --api-key $ILLUMINATE_API_KEY \
  --decision-id <decision-id>
```

## Option 2: Manual Publish via Python

For a quick one-off test without the script:

```python
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub

pnconfig = PNConfiguration()
pnconfig.publish_key = "pub-c-..."
pnconfig.subscribe_key = "sub-c-..."
pnconfig.user_id = "test-publisher"
pnconfig.ssl = True

pubnub = PubNub(pnconfig)

message = {
    "user_id": "test-user-1",
    "channel": "test-channel",
    "message_body": "hello world"
}

envelope = pubnub.publish().channel("test-channel").message(message).sync()
print(f"Published. Timetoken: {envelope.result.timetoken}")
```

## Option 3: Manual Publish via curl (PubNub REST API)

```bash
curl -s "https://ps.pndsn.com/publish/pub-c-.../sub-c-.../0/test-channel/0/%7B%22user_id%22%3A%22test-user-1%22%2C%22channel%22%3A%22test-channel%22%2C%22message_body%22%3A%22hello%22%7D"
```

URL-encode your JSON message body before inserting it into the URL.

## Verifying Data Capture Immediately

The **ad-hoc query execute** endpoint returns results right now — no waiting for a decision cycle. Use this to confirm your Business Object is capturing messages and your query pipeline is working:

```bash
POST /v2/illuminate/queries/{id}/execute
```

Or with the script:
```bash
python test_illuminate.py verify-query --api-key $ILLUMINATE_API_KEY --query-id <id>
```

If rows are returned: your BO is ingesting data and your field mappings work.
If no rows are returned: see the troubleshooting section below.

## Verifying a Decision Fired

Decisions evaluate on a schedule. After publishing, wait at least `executionFrequency` seconds, then check the action log:

```bash
GET /v2/illuminate/decisions/{id}/action-log
```

A successful entry looks like:
```json
{
  "actionName": "Mute Flooding User",
  "actionType": "APPCONTEXT_SET_USER_METADATA",
  "success": true,
  "triggeringConditions": [
    { "name": "message_count", "inputValue": "15", "operation": "NUMERIC_GREATER_THAN", "thresholdValue": "10" }
  ],
  "outputValues": [
    { "name": "Flooded User ID", "value": "flood-test-user" }
  ],
  "timestamp": "2026-03-12T15:00:00Z"
}
```

## Re-running Tests After an Action Already Fired

If your Decision uses `ONCE_PER_INTERVAL_PER_CONDITION_GROUP` or similar execution limits, the action will not fire again until the interval expires. Reset the limits manually:

```bash
POST /v2/illuminate/decisions/{id}/reset-action-limits?all=true
```

Or with the script:
```bash
python MCP/skills/scripts/illuminate/manage_illuminate.py decision reset-limits \
  --api-key $ILLUMINATE_API_KEY \
  --id <decision-id>
```

After resetting, publish more test messages and the action can fire again immediately.

## Scenario Message Patterns

| Use case | What to publish | What to check |
|---|---|---|
| Chat flooding | 15+ messages, same `user_id`, same or varied `channel`, within 5 min | Query: `message_count > 10`; Action log: mute action |
| Cross-posting | 3+ messages, same `user_id` + same `message_body`, different `channel` each time | Query: `channel_count > 2`; Action log: flag action |
| METRIC threshold | Enough events to exceed the rule value within the evaluation window | Action log after `executionFrequency` seconds |
| JSONPath mapping | 1–5 messages with known field values | Ad-hoc query: verify field values appear correctly in results |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Ad-hoc query returns 0 rows | BO is inactive or wrong subscribe key | Check `isActive: true` on the BO; check the `subkeys` array matches your publish key's keyset |
| Fields appear as `null` in query results | JSONPath mismatch | Compare your message body structure against the BO's JSONPath expressions (remember: `$.message.body.*`) |
| Decision never fires | Threshold not met, or evaluation frequency not elapsed | Publish more messages and wait `executionFrequency` seconds; check the action log time filter |
| Action fired once but not again | Execution limit active | Reset action limits with `reset-action-limits?all=true` |
| `401` from PubNub publish | Wrong publish key | Double-check the `pub-c-` key matches the same keyset as the `sub-c-` key in the BO |
