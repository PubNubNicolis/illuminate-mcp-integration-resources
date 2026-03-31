const generateHandler = (text: string) => {
  return () => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text,
        },
      },
    ],
  });
};

// ─── Existing PubNub MCP prompts ─────────────────────────────────────────────

const hipaaChatShort = {
  name: "hipaa-chat-short",
  definition: {
    title: "Create a HIPAA Compliant Chat app",
    description:
      "Example of how to prompt PubNub MCP to create a HIPAA compliant chat application - short version",
  },
  handler: generateHandler(
    "Act as a senior software engineer and use PubNub MCP server to create a chat application for healthcare that is HIPAA compliant."
  ),
};

const hipaaChatLong = {
  name: "hipaa-chat-long",
  definition: {
    title: "Create a HIPAA Compliant Chat app",
    description:
      "Example of how to prompt PubNub MCP to create a HIPAA compliant chat application - long version",
  },
  handler: generateHandler(
    "Act as a senior software engineer and use PubNub MCP server to create a chat application for healthcare that is HIPAA compliant, with Pub/Sub messaging for real-time chat, Presence for patient/doctor availability, and App Context for roles."
  ),
};

const reactAppShort = {
  name: "react-app-short",
  definition: {
    title: "Scaffold React App with PubNub",
    description:
      "Example of how to scaffold a React application with PubNub Pub/Sub and Presence - short version",
  },
  handler: generateHandler(
    "Act as a frontend developer and use PubNub MCP server to scaffold a React app with Pub/Sub messaging and Presence."
  ),
};

const reactAppLong = {
  name: "react-app-long",
  definition: {
    title: "Scaffold React App with PubNub",
    description:
      "Example of how to scaffold a React application with PubNub Pub/Sub and Presence - long version",
  },
  handler: generateHandler(
    "Act as a frontend developer and use PubNub MCP server to scaffold a React app with Pub/Sub messaging for real-time updates, Presence to show when users are online or typing, and App Context to handle user metadata. Include sample React components for subscribing to a channel, publishing messages, and displaying presence indicators for active participants."
  ),
};

const gamelobbyShort = {
  name: "gamelobby-short",
  definition: {
    title: "Build Multiplayer Game Lobby",
    description:
      "Example of how to build a multiplayer game lobby with chat and presence - short version",
  },
  handler: generateHandler(
    "Act as a game developer and use PubNub MCP server to build a multiplayer lobby with chat and Presence indicators."
  ),
};

const gamelobbyLong = {
  name: "gamelobby-long",
  definition: {
    title: "Build Multiplayer Game Lobby",
    description:
      "Example of how to build a multiplayer game lobby with chat and presence - long version",
  },
  handler: generateHandler(
    "As a game developer, use PubNub MCP server to build a multiplayer game lobby that supports real-time chat using Pub/Sub, Presence for tracking when players come online or leave, and App Context for managing team assignments (e.g., red vs. blue team)."
  ),
};

const oemClientManagement = {
  name: "oem-client-management",
  definition: {
    title: "OEM Client Management",
    description: "Example of how to create apps and configure keysets for OEM clients",
  },
  handler: generateHandler(
    "[OEM (building resources used by someone else)] As a developer, use PubNub MCP to create a new app, configure and assign keysets to clients."
  ),
};

const multiTenantOnboardingShort = {
  name: "multi-tenant-onboarding-short",
  definition: {
    title: "Implement Multi-Tenant Onboarding",
    description:
      "Example of how to implement automated tenant onboarding for multi-tenant applications - short version",
  },
  handler: generateHandler(
    "[OEM] Act as a senior developer and use PubNub MCP server to implement automated tenant onboarding for a multi-tenant chat application in SaaS or healthcare industries."
  ),
};

const multiTenantOnboardingLong = {
  name: "multi-tenant-onboarding-long",
  definition: {
    title: "Implement Multi-Tenant Onboarding",
    description:
      "Example of how to implement automated tenant onboarding for multi-tenant applications - long version",
  },
  handler: generateHandler(
    "Act as a senior developer and use PubNub MCP (which leverages Admin API for Keysets and Usage & Monitoring) to implement a multi-tenant chat application with automated tenant onboarding. The tenant Application will use: pubsub, History, App-Context, Presence For every new tenant or end-customer the application should: Create a new App (if required by your OEM model). Create and configure a new Keyset to ensure data isolation Make sure publish and subscribe keys are properly retrieved and propagated to the tenant's application as configuration variables The implementation should be fully automated, idempotent, and include error handling, and retries."
  ),
};

// ─── Illuminate prompts ───────────────────────────────────────────────────────

const illuminateSpamDetection = {
  name: "illuminate-spam-detection",
  definition: {
    title: "Set Up Illuminate Spam Detection",
    description:
      "Guided setup of a complete Illuminate spam detection pipeline (message flooding and cross-posting)",
  },
  handler: generateHandler(
    "Act as a community moderator and use PubNub MCP to set up Illuminate spam detection. Start by asking: Is the concern chat flooding (one user sending too many messages in one channel), cross-posting (the same message sent to many channels), or both? For each pattern, use the predefined Illuminate Query Builder template — do NOT recreate the query logic manually. For chat spam use cases, the Business Object fields User, Channel, Message, and Message Type are automatically created by Illuminate — do not ask the user to define them. Before creating anything, describe the detection approach in 1–2 sentences in plain English. Then show an escalating decision table with three severity rows: Low → notify moderator (quiet alert); Medium → notify + mute user in channel; High → notify + mute + ban user from channel. Ask the user to confirm: (a) the time window (default: 60 seconds), (b) the message count or channel count thresholds for each severity level, and (c) which actions to enable per row. After confirmation: create the Business Object if not already active, use the Query Builder template for the selected spam pattern(s), create the Decision with the confirmed escalating rules, and activate. Publish fake test data to verify the Decision fires correctly. Show the action log to confirm."
  ),
};

const illuminateUseCase = {
  name: "illuminate-use-case",
  definition: {
    title: "Set Up an Illuminate Use Case",
    description:
      "Guided setup of a new Illuminate analytics and automation use case",
  },
  handler: generateHandler(
    "Act as a product manager and use PubNub MCP to set up a complete Illuminate use case. Follow this guided flow: Step 0 — Identify the goal. Ask: (1) What outcome do you want? Choose from: reward and incentivize desired behavior (e.g. most engaged users, high spenders, poll participants); prevent spam or abuse; alert when operational metrics like wait time or failure rates exceed normal; or automate live event or auction actions. (2) What should Illuminate do when the condition is met? Options: notify via webhook or channel message, reward or badge a user, mute or moderate a user, or trigger an external workflow. (3) How quickly should it react? Immediately on each event, near real-time every 1–5 minutes, or trend-based every 10–60 minutes. Step 1 — Choose the simplest implementation path: if the goal is spam (flooding or cross-posting) or ranking (Top N / Bottom N), use the Query Builder predefined templates. Otherwise use Metrics + Dashboard + Decision. Step 2 — Confirm data. Ask for one of: a sample event (JSON), a list of fields already in the payload, or where the data currently lives. Step 3 — Preview before building. Describe the automation in 1–2 sentences in plain English. Present the decision logic as a conditions → actions table with one rule per row. Ask for confirmation and threshold adjustments before creating any Illuminate resources. Step 4 — Build: create the Business Object (or confirm the existing one is active), create 1–3 Metrics for KPI visibility and tuning, create a Dashboard chart, then create and activate the Decision using the confirmed thresholds. Step 5 — Validate: publish fake test data, check the dashboard and action log, and suggest threshold or rate-limit adjustments based on results."
  ),
};

const illuminateRewardEngagement = {
  name: "illuminate-reward-engagement",
  definition: {
    title: "Reward Engagement in Live Events",
    description:
      "Guided setup of an Illuminate engagement reward pipeline for live events and gaming",
  },
  handler: generateHandler(
    "Act as a live events manager and use PubNub MCP to set up Illuminate engagement rewards. Start by asking which participation behaviors to reward: poll answers, chat messages, reactions, or re-engaging low-engagement users (or a combination). For ranking rewards (Top N most chatty, Top N by reactions, Bottom N by engagement), use the predefined Illuminate Query Builder templates — do NOT recreate the ranking logic manually. Before creating anything, describe the reward approach in 1–2 sentences in plain English. Then show a decision table: Poll answered → reward points or badge; Top N most chatty → Incentive A; Top N by reactions → Incentive B; Bottom N by engagement → Incentive C (re-engagement nudge). Ask the user to confirm: (a) which rows to enable, (b) the reward or incentive for each, (c) the evaluation window, and (d) a per-rule rate limit (default: once per day per user) to prevent duplicate rewards. After confirmation: create the Business Object capturing poll, chat, and reaction events (fields: user, channel, event type). Create COUNT metrics — one per behavior being measured. Create a Dashboard with an engagement trend chart and active vs inactive user breakdown. Create the Decision(s) with the confirmed rules and rate limits, and activate. Optionally: if the user wants an engagement drop alert, add a rule that fires when overall channel activity drops below a threshold and notifies moderators. Publish fake test data to verify rewards fire correctly. Show the action log to confirm."
  ),
};

const illuminateTestVerify = {
  name: "illuminate-test-verify",
  definition: {
    title: "Test and Verify Illuminate Setup",
    description:
      "Step-by-step test and verification workflow for an existing Illuminate configuration",
  },
  handler: generateHandler(
    "Act as a developer and use PubNub MCP to test and verify my existing Illuminate setup. 1. List all Business Objects and confirm the relevant one is active. 2. Check which fields are populated using a field-health query — flag any fields returning empty strings as potential JSONPath mismatches. 3. Publish a small set of fake test messages (generic scenario) to the subscribe key. Wait 30 seconds for Illuminate ingestion. 4. Run a raw-snapshot query to confirm messages are being captured. 5. Check the action log for any active Decisions to confirm they are evaluating data. Report any issues found and suggest fixes. If Decisions are firing too frequently or not at all, suggest adjustments to time window, thresholds, filters, and execution rate limits."
  ),
};

export const prompts = [
  hipaaChatShort,
  hipaaChatLong,
  reactAppShort,
  reactAppLong,
  gamelobbyShort,
  gamelobbyLong,
  oemClientManagement,
  multiTenantOnboardingShort,
  multiTenantOnboardingLong,
  illuminateSpamDetection,
  illuminateRewardEngagement,
  illuminateUseCase,
  illuminateTestVerify,
];
