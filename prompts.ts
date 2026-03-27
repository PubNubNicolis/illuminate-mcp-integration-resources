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

const illuminateSpamDetectionShort = {
  name: "illuminate-spam-detection-short",
  definition: {
    title: "Set Up Illuminate Spam Detection",
    description:
      "Guided setup of a complete Illuminate spam detection pipeline (message flooding and cross-posting) - short version",
  },
  handler: generateHandler(
    "Act as a senior developer and use PubNub MCP to set up Illuminate spam detection for my chat application."
  ),
};

const illuminateSpamDetectionLong = {
  name: "illuminate-spam-detection-long",
  definition: {
    title: "Set Up Illuminate Spam Detection",
    description:
      "Guided setup of a complete Illuminate spam detection pipeline (message flooding and cross-posting) - long version",
  },
  handler: generateHandler(
    "Act as a senior developer and use PubNub MCP to build a complete Illuminate spam detection pipeline for a chat application. 1. Create a Business Object with fields for user_id (TEXT), channel (TEXT), and message_body (TEXT). Activate it against the subscribe key. 2. Create a COUNT metric grouped by user_id with a 60-second evaluation window. 3. Create a METRIC-sourced Decision that fires when the count exceeds 10. Actions: set the user's App Context status to 'muted' and publish an alert to the moderation channel. Enable the Decision after verifying rules. 4. Create a saved Query using the cross-posting spam template. Create a QUERY-sourced Decision that flags users posting the same content to more than 5 channels. 5. Publish fake test data to verify both Decisions fire correctly. Show the action log to confirm."
  ),
};

const illuminateUseCaseShort = {
  name: "illuminate-use-case-short",
  definition: {
    title: "Set Up an Illuminate Use Case",
    description:
      "Guided setup of a new Illuminate analytics and automation use case - short version",
  },
  handler: generateHandler(
    "Act as a senior developer and use PubNub MCP to set up a new Illuminate use case for my PubNub application."
  ),
};

const illuminateUseCaseLong = {
  name: "illuminate-use-case-long",
  definition: {
    title: "Set Up an Illuminate Use Case",
    description:
      "Guided setup of a new Illuminate analytics and automation use case - long version",
  },
  handler: generateHandler(
    "Act as a senior developer and use PubNub MCP to set up a complete Illuminate use case. Start by asking me what events I want to track and what automation I want to trigger. Then: 1. Create a Business Object that captures the relevant fields from my PubNub messages using JSONPath expressions. Activate it against my subscribe key. 2. Create the appropriate Metric (COUNT, SUM, or AVG) based on the use case. 3. Create a Decision sourced from the Metric or Business Object with rules and actions that match my automation goal. Enable the Decision after verifying rules. 4. Create a Dashboard to visualize the Metric over time. 5. Publish fake test data to confirm the setup is working end-to-end."
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
    "Act as a senior developer and use PubNub MCP to test and verify my existing Illuminate setup. 1. List all Business Objects and confirm the relevant one is active. 2. Check which fields are populated using a field-health query — flag any fields returning empty strings as potential JSONPath mismatches. 3. Publish a small set of fake test messages (generic scenario) to the subscribe key. Wait 30 seconds for Illuminate ingestion. 4. Run a raw-snapshot query to confirm messages are being captured. 5. Check the action log for any active Decisions to confirm they are evaluating data. Report any issues found and suggest fixes."
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
  illuminateSpamDetectionShort,
  illuminateSpamDetectionLong,
  illuminateUseCaseShort,
  illuminateUseCaseLong,
  illuminateTestVerify,
];
