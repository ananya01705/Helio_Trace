# ☀️ HelioTrace

**NASA-powered space-weather investigation through MCP.**

HelioTrace is a TypeScript MCP server built for the NitroStack **Fly to the Moon** hackathon. It queries NASA's [DONKI (Database Of Notifications, Knowledge, Information)](https://ccmc.gsfc.nasa.gov/DONKI/) records and helps investigate solar flares, coronal mass ejections (CMEs), and other space-weather event categories.

> **Important:** HelioTrace is an exploratory research tool, not an official NASA product, a forecasting system, or an operational warning service. It reports source records and recorded associations; it does not establish causation or predict impacts.

## ✨ What you can do

### MCP tools

| Tool | Purpose |
|---|---|
| `search_space_weather_events` | Search one DONKI event category over a date range. |
| `investigate_solar_event` | Examine NASA-recorded links between solar flare (FLR) and CME records, including matched and unmatched records. |
| `get_space_weather_briefing` | Build a compact multi-category briefing for FLR, CME, GST and SEP records. |
| `compare_space_weather_periods` | Compare the number of records for the same event category across two date ranges. |

The search tool supports the event types implemented in the server schema: CME, FLR, GST, IPS, SEP, MPC, RBE, HSS and WSA. For exact inputs and constraints, use the schemas advertised by the running MCP server.

### Resources

| Resource URI | Contents |
|---|---|
| `heliotrace://guide` | Overview of HelioTrace and its tools. |
| `heliotrace://event-types` | JSON reference for supported event types. |
| `heliotrace://methodology` | Methodology, interpretation guidance and data limitations. |

### Reusable prompts

| Prompt | Required arguments | Use |
|---|---|---|
| `investigate_solar_event` | `start_date`, `end_date` | Investigate flare–CME links over a period. |
| `space_weather_briefing` | `start_date`, `end_date` | Summarize FLR, CME, GST and SEP records. |
| `compare_solar_activity_periods` | `event_type`, `first_start_date`, `first_end_date`, `second_start_date`, `second_end_date` | Compare the same category across two periods. |

Prompts provide instructions to the AI client; they are not themselves a guarantee that a tool was executed. When testing, check the chat's operation flow/logs to confirm that the expected tool was called and that the final answer reflects its returned data.

## 🔬 Interpretation principles

- **Recorded links are not proof of causation.** A flare–CME pair is treated as linked when NASA DONKI records a corresponding link.
- **Unmatched does not mean unrelated.** It means no counterpart was matched in the records queried.
- **Missing data is not a negative result.** If arrival, speed, or Earth-impact fields are absent, report them as unavailable rather than implying no impact.
- **Counts are not severity.** A higher number of records does not automatically mean stronger activity, greater risk, or greater impact.
- **Do not invent predictions.** Cite source records and distinguish observations from interpretation.

## 🚀 Run locally (Windows PowerShell)

### Requirements

- Node.js 24 (the version used during development)
- npm
- Git (optional, for cloning)

### 1. Get the repository

```powershell
git clone https://github.com/ananya01705/Helio_Trace.git
cd Helio_Trace
```

If you already have the repository, open its folder in VS Code and use **Terminal → New Terminal** with PowerShell.

### 2. Install packages

```powershell
npm install
```

### 3. Optional environment configuration

```powershell
Copy-Item .env.example .env
```

Review `.env.example` for available configuration. Keep credentials and local secrets in `.env`; never commit real credentials.

### 4. Start the development server

```powershell
npm run dev
```

Keep this terminal open while using the server. In NitroStudio, connect the local project and confirm that the expected tools, resources and prompts are discovered.

### 5. Build and run helper tests

```powershell
npm run build
node --test src/modules/heliotrace/date-utils.test.mjs src/modules/heliotrace/event-correlation.test.mjs
```

The focused tests cover date validation and the flare–CME correlation helper. They do **not** replace live tool checks or end-to-end MCP tests. Run these commands locally after pulling changes and resolve any failures before treating the build as verified.

## 🧪 Try it in NitroStudio

Use short date windows first. For example, choose the `investigate_solar_event` prompt and enter:

- `start_date`: `2026-10-01`
- `end_date`: `2026-10-07`

Then inspect the operation flow/logs. A successful prompt test should show a call to `investigate_solar_event` and a result from the tool before the assistant summarizes the evidence. If no tool call appears, try invoking the tool directly from **Tools** with the same dates to separate a prompt/client issue from a data-fetching issue.

Example direct input for `search_space_weather_events`:

```json
{
  "event_type": "FLR",
  "start_date": "2026-10-01",
  "end_date": "2026-10-07"
}
```

Dates must use `YYYY-MM-DD`, be valid calendar dates, and follow the server's date-range limit. The current implementation is intended for short windows (under 30 days); confirm the exact boundary in the active tool schema/error message.

## 🧱 Technology

- **Runtime:** Node.js, TypeScript
- **MCP framework:** [NitroStack](https://docs.nitrostack.ai)
- **Input validation:** Zod
- **Data source:** [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)
- **Tests:** Node.js built-in test runner

## 📁 Project structure

```text
src/
  index.ts
  app.module.ts
  health/
    system.health.ts
  modules/
    calculator/                   # starter-template module retained
    heliotrace/
      heliotrace.module.ts
      heliotrace.tools.ts         # search + flare/CME investigation
      heliotrace-insights.tools.ts # briefing + period comparison
      heliotrace.resources.ts     # guide, event types, methodology
      heliotrace.prompts.ts       # reusable prompt templates
      date-utils.ts
      date-utils.test.mjs
      event-correlation.ts
      event-correlation.test.mjs
  widgets/
    app/calculator-result/         # original starter widget
scripts/
  client-demo.ts
.env.example
package.json
README.md
```

## ⚠️ Known limitations

- The widget is still the original calculator demo; a dedicated HelioTrace dashboard has not yet been implemented.
- Current automated tests cover helper functions, not all tool/resource/prompt handlers.
- Live NASA DONKI availability and response formats can affect results.
- Prompt behavior depends partly on the MCP client/model. Verify actual tool calls and results in NitroStudio rather than assuming that selecting a prompt ran the intended tool.
- Task-enabled execution and cancellation behavior should be tested in the target NitroStack runtime before relying on it for long-running operations.

## 📚 References

- [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)
- [NitroStack documentation](https://docs.nitrostack.ai)
- [NitroStack Studio](https://nitrostack.ai/studio)

---

Built for the NitroStack **Fly to the Moon** hackathon.
