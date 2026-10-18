# HelioTrace: An MCP-Powered Space Event Intelligence & Correlation System

![Model Context Protocol](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue)
![Built with NitroStack](https://img.shields.io/badge/Built%20with-NitroStack-0A66FF)
![Deployment](https://img.shields.io/badge/deployment-live-brightgreen)

**HelioTrace** is a Model Context Protocol (MCP) server for investigating and comparing space-weather events using structured records from NASA's [DONKI (Database Of Notifications, Knowledge, Information)](https://ccmc.gsfc.nasa.gov/DONKI/). Built with [NitroStack](https://nitrostack.ai), it makes selected NASA DONKI data and event-correlation workflows available to compatible AI assistants and MCP clients.

> **Scope note:** HelioTrace is an exploratory research and information tool. It is not an official NASA product, an operational warning service, or a forecasting system. Recorded associations are not proof of causation, and record counts are not severity scores.

## Table of Contents

- [Overview](#overview)
- [What is MCP?](#what-is-mcp)
- [Features](#features)
- [MCP Tools](#mcp-tools)
- [Resources and Prompts](#resources-and-prompts)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Connect to an MCP Client](#connect-to-an-mcp-client)
- [Testing](#testing)
- [Deploy Your Own MCP App](#deploy-your-own-mcp-app)
- [Explore More MCP Apps](#explore-more-mcp-apps)
- [FAQ](#faq)
- [Technology](#technology)
- [Limitations and Interpretation](#limitations-and-interpretation)
- [License](#license)

## Overview

Space-weather information is distributed across event records and categories. Looking at one record at a time can make it harder to explore recorded relationships or compare activity across different periods.

HelioTrace brings several investigation workflows together behind MCP. It can query NASA DONKI event categories, inspect recorded links between solar flares and coronal mass ejections (CMEs), create a compact multi-category briefing, and compare event counts across two date ranges. Its responses include source context and interpretation notes to help an MCP client distinguish returned data from conclusions.

The server uses a modular TypeScript architecture built on NitroStack. Tools provide callable operations, resources provide reference material, and prompts offer reusable instructions for common investigations. This separation lets compatible clients discover and use the capabilities through MCP rather than relying on a single custom interface.

Future extensions could add further datasets, richer visualizations, or additional analysis workflows. The current implementation is grounded in NASA DONKI records and should be understood within the limitations described below.

## What is MCP?

The **Model Context Protocol (MCP)** is an open protocol that allows compatible AI applications to discover and use external tools and context sources through a standard interface. An MCP server can expose tools, resources, and prompts so a client can integrate those capabilities into an AI-assisted workflow.

HelioTrace is one such server. Learn more about MCP app development and deployment at [NitroStack](https://nitrostack.ai).

## Features

- **NASA DONKI data access:** Search supported space-weather event categories for a date range.
- **Flare–CME investigation:** Match flare and CME records using relationships recorded in NASA DONKI.
- **Multi-category briefing:** Retrieve a compact overview of solar flares, CMEs, geomagnetic storms, and solar energetic particle records.
- **Period comparison:** Compare record counts and sample events for the same category across two date ranges.
- **MCP tools, resources, and prompts:** Expose structured operations and reusable reference material to compatible clients.
- **Source-aware responses:** Include NASA DONKI source links where available and notes about interpretation and missing fields.
- **Hosted endpoint:** A deployed MCP endpoint is available for compatible clients.

## MCP Tools

| Tool | Purpose |
|---|---|
| `search_space_weather_events` | Search a supported NASA DONKI event category over a date range. |
| `investigate_solar_event` | Investigate NASA-recorded links between solar-flare and CME records, including matched and unmatched records. |
| `get_space_weather_briefing` | Build a compact briefing for FLR, CME, GST, and SEP records. |
| `compare_space_weather_periods` | Compare records for the same event category across two date ranges. |

The search and comparison tools support these event types: CME, FLR, GST, IPS, SEP, MPC, RBE, HSS, and WSA. Use the active MCP server's input schemas for exact argument names and constraints.

Date inputs use `YYYY-MM-DD`. The current implementation limits each queried date range to **less than 30 days between the start and end dates**; invalid dates and reversed ranges are rejected. Responses may be capped to keep results manageable and include truncation indicators where applicable.

## Resources and Prompts

### Resources

| Resource URI | Contents |
|---|---|
| `heliotrace://guide` | Overview of HelioTrace and its available capabilities. |
| `heliotrace://event-types` | JSON reference for supported event types. |
| `heliotrace://methodology` | Methodology, interpretation guidance, and data limitations. |

### Prompts

| Prompt | Required arguments | Use |
|---|---|---|
| `investigate_solar_event` | `start_date`, `end_date` | Guide an investigation of flare–CME links over a period. |
| `space_weather_briefing` | `start_date`, `end_date` | Guide a multi-category space-weather briefing. |
| `compare_solar_activity_periods` | `event_type`, `first_start_date`, `first_end_date`, `second_start_date`, `second_end_date` | Guide a comparison of the same event category across two periods. |

Prompts provide instructions to the MCP client; selecting a prompt does not by itself guarantee that a tool has been executed. Check the client’s operation flow or logs to verify which tools ran and what results they returned.

## Live Demo

**Hosted app:**  
https://my-demo-app-6ad2a1a5-ananya-heapify-global-community.app.nitrocloud.ai

**Streamable HTTP MCP endpoint:**  
https://my-demo-app-6ad2a1a5-ananya-heapify-global-community.app.nitrocloud.ai/mcp

For MCP clients that support Streamable HTTP, use the `/mcp` endpoint. The base app URL is provided for visiting the hosted app; it is not a substitute for the MCP endpoint in client configuration.

## Getting Started

### Prerequisites

- Node.js 24 (the version used during development)
- npm
- Git, to clone the repository
- An MCP-compatible client or NitroStack Studio for connecting and testing

### 1. Clone the repository

```powershell
git clone https://github.com/ananya01705/Helio_Trace.git
cd Helio_Trace
```

If you already have the repository, open its folder in VS Code and select **Terminal → New Terminal**, using PowerShell.

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure environment variables (optional)

To create a local environment file:

```powershell
Copy-Item .env.example .env
```

Review `.env.example` for the available NitroStack configuration options. The project does not require you to put NASA DONKI credentials in source code. Keep any private configuration in your local `.env` file and never commit secrets.

### 4. Start the development server

```powershell
npm run dev
```

Keep the terminal open while testing. Connect NitroStack Studio or another compatible MCP client to the local server using the transport and connection details supported by your environment.

### 5. Build and start

To compile the project:

```powershell
npm run build
```

To build and start the server using the package's start script:

```powershell
npm run start
```

For a production-style start after a build has already completed:

```powershell
npm run start:prod
```

## Connect to an MCP Client

For a client that supports remote MCP servers over Streamable HTTP, configure the deployed endpoint shown below. The exact configuration format varies by client; use that client's current documentation for the correct field names.

- **Server URL:** `https://my-demo-app-6ad2a1a5-ananya-heapify-global-community.app.nitrocloud.ai/mcp`
- **Transport:** Streamable HTTP
- **Authentication:** The current hosted endpoint is configured without a separate authentication step.

A generic configuration shape may look like this, but check your client's documentation before copying it:

```json
{
  "mcpServers": {
    "heliotrace": {
      "url": "https://my-demo-app-6ad2a1a5-ananya-heapify-global-community.app.nitrocloud.ai/mcp"
    }
  }
}
```

Restart or refresh the MCP client if required, then confirm that it discovers HelioTrace's tools, resources, and prompts. Client support and configuration formats differ, so this example is not guaranteed to work unchanged in every application.

## Testing

Run the focused helper tests:

```powershell
npm test
```

The tests cover the date-validation and event-correlation helpers. They do not replace live API checks or end-to-end testing of every MCP handler.

You can also test tools directly in NitroStack Studio or [MCP Inspector](https://github.com/modelcontextprotocol/inspector). For a simple test, call `search_space_weather_events` with:

```json
{
  "event_type": "FLR",
  "start_date": "2026-10-01",
  "end_date": "2026-10-07"
}
```

The result should identify NASA CCMC DONKI as its source and include the selected event type, queried date range, source URL, returned-record count, and event records. Live results can change as NASA's dataset changes or as the API becomes available.

## Deploy Your Own MCP App

Want to build and host an MCP server? Explore [NitroStack](https://nitrostack.ai) and its [documentation](https://docs.nitrostack.ai) for current setup and deployment instructions.

## Explore More MCP Apps

- Discover and discuss MCP projects with the community at [r/mcptothemoon](https://www.reddit.com/r/mcptothemoon/).
- Explore NitroStack and its app ecosystem at [NitroStack](https://nitrostack.ai).

## FAQ

### What is an MCP server?

An MCP server exposes tools, resources, and/or prompts through the Model Context Protocol so a compatible client can discover and use them.

### What does HelioTrace do?

HelioTrace searches NASA DONKI event records, investigates recorded flare–CME relationships, builds a compact briefing across selected event categories, and compares event counts across two date ranges.

### Which AI clients can use it?

Any client that supports remote MCP servers over Streamable HTTP may be able to connect, provided it supports the relevant MCP protocol and configuration. Client compatibility and setup vary; consult the client's documentation.

### Does HelioTrace predict solar storms or Earth impacts?

No. HelioTrace reports and organizes records returned by NASA DONKI. It is not a forecasting model or operational alerting system.

### Why do some records have missing fields?

A source record may not include every field. HelioTrace treats absent values as unavailable rather than assuming a negative result.

### Does a matched flare and CME prove that one caused the other?

No. A match means the relationship is recorded in NASA DONKI according to the project's correlation logic. It does not independently establish causation.

### Why might the client show JSON instead of a custom dashboard?

The current project does not include a dedicated HelioTrace dashboard widget. Clients can still invoke the MCP tools and inspect their structured JSON responses. A custom widget would be a separate enhancement.

## Technology

- **Language/runtime:** TypeScript and Node.js
- **MCP framework:** [NitroStack](https://docs.nitrostack.ai)
- **Input validation:** Zod
- **Data source:** [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)
- **Tests:** Node.js built-in test runner
- **MCP testing:** NitroStack Studio and MCP Inspector

## Limitations and Interpretation

- **Recorded relationships are not proof of causation.** Flare–CME pairs are matched using relationships recorded by NASA DONKI.
- **Unmatched does not mean unrelated.** It means no counterpart was matched in the records queried.
- **Missing data is not a negative result.** Missing arrival, speed, or Earth-impact fields should be reported as unavailable.
- **Counts are not severity.** More records do not automatically mean stronger activity, greater risk, or greater impact.
- **Response limits matter.** Some tools cap the number of records included. Check fields such as `truncated`, `recordsReturned`, and `nextStep` when present.
- **Live data can change.** NASA DONKI availability, data updates, and response formats can affect results.
- **Tests are focused, not exhaustive.** Current automated tests cover helper functions, not every tool, resource, prompt, transport, or task-execution path.
- **Widget status:** The existing widget is the starter calculator demo; a dedicated HelioTrace visualization has not yet been implemented.

## Project Structure

```text
src/
  index.ts
  app.module.ts
  health/
    system.health.ts
  modules/
    calculator/                    # starter-template module retained
    heliotrace/
      heliotrace.module.ts
      heliotrace.tools.ts           # event search and flare/CME investigation
      heliotrace-insights.tools.ts  # briefing and period comparison
      heliotrace.resources.ts       # guide, event types, methodology
      heliotrace.prompts.ts         # reusable prompt templates
      date-utils.ts
      date-utils.test.mjs
      event-correlation.ts
      event-correlation.test.mjs
  widgets/
    app/calculator-result/          # original starter widget
scripts/
  client-demo.ts
.env.example
package.json
README.md
```

## Keywords

`HelioTrace` · `space weather` · `NASA DONKI` · `Model Context Protocol` · `MCP server` · `MCP tools` · `AI agents` · `solar flare` · `coronal mass ejection` · `CME correlation` · `NitroStack`

## License

MIT © 2026

---

Built with the Model Context Protocol and [NitroStack](https://nitrostack.ai) for the **Fly to the Moon** hackathon.
