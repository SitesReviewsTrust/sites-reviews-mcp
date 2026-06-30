<div align="center">

# 🛡️ Sites.Reviews MCP server

**Give any AI assistant a website's trust score, real reviews and scam-check signals — before you trust or pay it.**

[![npm version](https://img.shields.io/npm/v/@sitesreviews/mcp?logo=npm&color=cb3837)](https://www.npmjs.com/package/@sitesreviews/mcp)
[![CI](https://github.com/SitesReviewsTrust/sites-reviews-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/SitesReviewsTrust/sites-reviews-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blueviolet)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-43853d?logo=node.js&logoColor=white)](https://nodejs.org)

A [Model Context Protocol](https://modelcontextprotocol.io) server backed by [**Sites.Reviews**](https://sites.reviews) — the independent catalog of company & website reviews. Connect it once, then just *ask*.

</div>

---

## ✨ What you can ask

Once connected, talk to your assistant in plain language — it picks the right tool automatically:

> 💬 **You:** *Is **ozon.ru** safe to buy from?*
>
> 🤖 **Assistant:** *Ozon has a **good reputation** on Sites.Reviews — a trust score of **4.2/5** across 128 reviews. Buyers generally report reliable delivery and working refunds. Source: https://sites.reviews/businesses/ozon.ru*

More things people ask:

- *"Check **bitmex.com** before I sign up."*
- *"What's the trust score for **1ps.ru**?"*
- *"Show me recent reviews of **aliexpress.com** — what do people complain about?"*
- *"Is this a scam: `https://some-shop.example/checkout`?"*
- *"I'm choosing between two marketplaces — which is more trusted?"*

The assistant calls Sites.Reviews, gets a trust score (0–5), a one-line verdict and real reviews, and **cites the source** so you can verify.

➡️ See [`examples/USAGE.md`](./examples/USAGE.md) for full prompt → tool → answer walkthroughs.

---

## 🚀 Install anywhere

No clone, no global install needed — every client below runs the server on demand with `npx -y @sitesreviews/mcp`. It's a tiny, read-only server: **no API key, no auth, no secrets.**

<details open>
<summary><b>Claude Desktop</b></summary>

Edit `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sites-reviews": {
      "command": "npx",
      "args": ["-y", "@sitesreviews/mcp"]
    }
  }
}
```

Restart Claude Desktop — the **sites-reviews** tools appear in the tool menu.
File: [`examples/claude_desktop_config.json`](./examples/claude_desktop_config.json).
</details>

<details>
<summary><b>Claude Code</b></summary>

One command:

```bash
claude mcp add sites-reviews -- npx -y @sitesreviews/mcp
```

Or add it to `.mcp.json` (project) / `~/.claude.json` (user) manually:

```json
{
  "mcpServers": {
    "sites-reviews": {
      "command": "npx",
      "args": ["-y", "@sitesreviews/mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Cursor</b></summary>

Create `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "sites-reviews": {
      "command": "npx",
      "args": ["-y", "@sitesreviews/mcp"]
    }
  }
}
```

Then enable **sites-reviews** under *Settings → MCP*.
File: [`examples/cursor_config.json`](./examples/cursor_config.json).
</details>

<details>
<summary><b>Windsurf</b></summary>

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "sites-reviews": {
      "command": "npx",
      "args": ["-y", "@sitesreviews/mcp"]
    }
  }
}
```

Then click **Refresh** in the Windsurf MCP panel (Cascade).
</details>

<details>
<summary><b>VS Code — Cline / Continue</b></summary>

**VS Code (native MCP)** — create `.vscode/mcp.json`:

```json
{
  "servers": {
    "sites-reviews": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sitesreviews/mcp"]
    }
  }
}
```

**Cline** — add to its MCP settings (`cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "sites-reviews": {
      "command": "npx",
      "args": ["-y", "@sitesreviews/mcp"]
    }
  }
}
```

**Continue** — same `mcpServers` block in your Continue config.
File: [`examples/vscode_mcp.json`](./examples/vscode_mcp.json).
</details>

> 💡 The config is identical for almost every MCP client: a `command` of `npx` with args `["-y", "@sitesreviews/mcp"]`. Prefer a pinned global install? `npm install -g @sitesreviews/mcp` and point `command` at `sites-reviews-mcp`.

---

## 🧰 Tools

| Tool | Input | Returns |
| --- | --- | --- |
| **`check_domain`** | `domain` *(string — bare domain or full URL)* | `found`, `name`, `url`, `trustScore` (0–5), `reviewCount`, a one-line `verdict`, and the `source` URL. If the company isn't in the catalog → `found: false` with a helpful message. |
| **`get_reviews`** | `domain` *(string)*, `limit` *(integer 1–20, default 5)* | Up to `limit` recent reviews — `author`, `rating`, `date`, `title`, `body` (truncated to ~400 chars) — plus the trust score and source URL. |

Both tools accept a **bare domain** (`ozon.ru`) or a **full URL** (`https://ozon.ru/path?x=1`): the input is normalised automatically, and on a miss it retries with/without a leading `www.`.

Every response includes a readable text block, a compact **JSON summary**, and a link back to https://sites.reviews so the assistant can cite it.

<details>
<summary>Sample <code>check_domain</code> output</summary>

````text
🏢 1PS.RU (1ps.ru)
Trust score: 4.8/5 ★★★★★  ·  34 reviews
Verdict: Excellent reputation (4.8/5 from 34 reviews).
Page: https://sites.reviews/businesses/1ps.ru

```json
{
  "found": true,
  "domain": "1ps.ru",
  "name": "1PS.RU",
  "trustScore": 4.8,
  "reviewCount": 34,
  "verdict": "Excellent reputation (4.8/5 from 34 reviews).",
  "source": "https://sites.reviews/businesses/1ps.ru"
}
```
Source: Sites.Reviews (https://sites.reviews) — independent website & company review catalog.
````
</details>

---

## ⚙️ How it works

- **Source:** the public Sites.Reviews REST API — `GET /api/public/v1/business/{domain}` and `/reviews/{domain}` (the same data Sites.Reviews also publishes as schema.org JSON-LD on each business page).
- **Read-only & anonymous.** No API key, no auth, no secrets, no writes — just polite, rate-limited HTTP GETs.
- **Local & private.** The server runs on your machine over stdio under your AI client. It opens no listeners and stores nothing.
- **Per-domain lookups.** Precise lookups by domain; a domain that isn't in the catalog returns `found: false` (not an error), with a link to be the first to review it.

```
AI client ──stdio──▶ sites-reviews-mcp ──HTTPS GET──▶ sites.reviews public API
  (Claude,             (this server)                    (trust score + reviews)
   Cursor, …)
```

---

## 🩺 Troubleshooting

| Symptom | Fix |
| --- | --- |
| **Tools don't appear** | Fully **restart** the client after editing its config (Claude Desktop especially). Confirm the JSON is valid (no trailing commas). |
| **`npx: command not found`** | Install Node.js ≥ 18 from [nodejs.org](https://nodejs.org). Check with `node --version`. |
| **First call is slow** | The first `npx -y` run downloads the package; subsequent runs are cached and fast. For zero-latency startup, `npm install -g @sitesreviews/mcp` and use `command: "sites-reviews-mcp"`. |
| **`found: false` for a real site** | The site may not be in the catalog yet, or the domain differs (try the apex vs `www.`, e.g. `ozon.ru` vs `www.ozon.ru`). The server already retries the `www.` toggle automatically. |
| **Corporate proxy / firewall** | The server needs outbound HTTPS to `sites.reviews`. Allow it, or set the standard `HTTPS_PROXY` env var for the client process. |
| **Want to see raw logs** | The server logs to **stderr** (stdout is reserved for the MCP protocol). Check your client's MCP log panel. |
| **Verify it runs at all** | `npx -y @modelcontextprotocol/inspector npx -y @sitesreviews/mcp` opens the MCP Inspector to exercise the tools by hand. |

---

## 🛠️ Develop

Requires **Node.js ≥ 18**.

```bash
git clone https://github.com/SitesReviewsTrust/sites-reviews-mcp.git
cd sites-reviews-mcp
npm install
npm run build      # compile TypeScript -> dist/
npm start          # run the server over stdio
npm test           # live smoke test against sites.reviews
```

- `src/sites-reviews.ts` — public-API client + normalisation (pure, unit-testable).
- `src/index.ts` — MCP server wiring (`McpServer` + `registerTool`, stdio transport).

Contributions welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [SECURITY.md](./SECURITY.md) for private vulnerability reporting. Changes are tracked in [CHANGELOG.md](./CHANGELOG.md).

---

## 🔗 Sites.Reviews ecosystem
- 🌐 **Website** — https://sites.reviews
- 🔍 **Trust score / scam-check** — search any domain on [sites.reviews](https://sites.reviews)
- 🤖 **Telegram bot** — [@SitesReviews_bot](https://t.me/SitesReviews_bot)
- 🧩 **Browser extension** — [sites.reviews/extension](https://sites.reviews/extension) · [repo](https://github.com/SitesReviewsTrust/sites-reviews-extension)
- 📚 **Docs** — [sites-reviews-docs](https://github.com/SitesReviewsTrust/sites-reviews-docs)
- 🔌 **API & widgets** — [sites-reviews-api](https://github.com/SitesReviewsTrust/sites-reviews-api)
- 🧠 **MCP server** — [sites-reviews-mcp](https://github.com/SitesReviewsTrust/sites-reviews-mcp)
- 🏛 **All repositories** — https://github.com/orgs/SitesReviewsTrust/repositories

---

## License

[MIT](./LICENSE) © 2026 Sites.Reviews
