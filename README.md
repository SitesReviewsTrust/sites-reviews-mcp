# Sites.Reviews MCP server

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blueviolet)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-43853d?logo=node.js&logoColor=white)](https://nodejs.org)

> **Check a site before you trust or pay it.** An MCP server that gives any AI assistant a website's trust score, real user reviews and scam-check signals — straight from [Sites.Reviews](https://sites.reviews), the independent catalog of company & website reviews.

## What you can ask

Once connected, just ask your assistant in plain language:

- *"Is **ozon.ru** trustworthy?"*
- *"Check **bitmex.com** before I sign up."*
- *"What's the trust score for **1ps.ru**?"*
- *"Show me recent reviews of **aliexpress.com**."*
- *"Is this site a scam: https://some-shop.example?"*

The assistant calls Sites.Reviews, gets a trust score (0–5), a one-line verdict and real reviews, and cites the source.

## Install

```bash
npm install -g sites-reviews-mcp
# or run on demand without installing:
npx -y sites-reviews-mcp
```

## Claude Desktop config

Add this to your `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`,
Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sites-reviews": {
      "command": "npx",
      "args": ["-y", "sites-reviews-mcp"]
    }
  }
}
```

Restart Claude Desktop and the **sites-reviews** tools appear. The same config works with any MCP-compatible client (Cursor, Cline, Windsurf, etc.). A copy lives in [`examples/claude_desktop_config.json`](./examples/claude_desktop_config.json).

## Tools

| Tool | Input | Returns |
| --- | --- | --- |
| `check_domain` | `domain` (string — bare domain or full URL) | `found`, `name`, `url`, `trustScore` (0–5), `reviewCount`, one-line `verdict`, and the source URL. If the company isn't in the catalog → `found: false` with a helpful message. |
| `get_reviews` | `domain` (string), `limit` (1–20, default 5) | Up to `limit` recent reviews: `author`, `rating`, `date`, `title`, `body` (truncated to ~400 chars), plus the trust score and source URL. |

Both tools accept a bare domain (`ozon.ru`) or a full URL (`https://ozon.ru/path`) — the input is normalised automatically, and on a miss it retries with/without a leading `www.`.

Every response includes a compact JSON summary plus a link back to https://sites.reviews so the assistant can cite it.

## How the data works

- **Source:** public schema.org **JSON-LD** embedded in each `https://sites.reviews/businesses/{domain}` page (the same structured data search engines read).
- **Read-only.** No API key, no auth, no secrets, no writes — just polite HTTP GETs with a descriptive `User-Agent`.
- **No search tool by design.** Sites.Reviews has no reliable public search API, so this server only does precise per-domain lookups. A domain that isn't in the catalog returns `found: false` (not an error).

## Develop

```bash
npm install
npm run build      # compile TypeScript -> dist/
npm start          # run the server over stdio
npm test           # live smoke test against sites.reviews
```

- `src/sites-reviews.ts` — fetch + JSON-LD parsing (pure, unit-testable).
- `src/index.ts` — MCP server wiring (`McpServer` + `registerTool`, stdio transport).

## 🔗 Sites.Reviews ecosystem
- 🌐 **Website** — https://sites.reviews
- 🔍 **Trust score / scam-check** — search any domain on [sites.reviews](https://sites.reviews)
- 🤖 **Telegram bot** — [@SitesReviews_bot](https://t.me/SitesReviews_bot)
- 🧩 **Browser extension** — [sites.reviews/extension](https://sites.reviews/extension) · [repo](https://github.com/SitesReviewsTrust/sites-reviews-extension)
- 📚 **Docs** — [sites-reviews-docs](https://github.com/SitesReviewsTrust/sites-reviews-docs)
- 🔌 **API & widgets** — [sites-reviews-api](https://github.com/SitesReviewsTrust/sites-reviews-api)
- 🧠 **MCP server** — [sites-reviews-mcp](https://github.com/SitesReviewsTrust/sites-reviews-mcp)
- 🏛 **All repositories** — https://github.com/orgs/SitesReviewsTrust/repositories

## License

[MIT](./LICENSE) © 2026 Sites.Reviews
