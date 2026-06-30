# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-28

First public release of the **Sites.Reviews MCP server** — a
[Model Context Protocol](https://modelcontextprotocol.io) server that gives any
AI assistant a website's trust score, real user reviews, and scam-check signals
from [Sites.Reviews](https://sites.reviews).

### Added

- `check_domain` tool — returns the trust score (0–5), review count, and a
  one-line verdict for any domain or URL.
- `get_reviews` tool — returns up to 20 recent reviews (author, rating, date,
  title, body) with a configurable `limit`.
- Input normalisation for bare domains and full URLs, with automatic
  `www.`-toggle retry on a miss.
- Human-readable text output plus a compact JSON summary and a source link back
  to Sites.Reviews for citation.
- Live smoke test (`npm test`) that validates parsing against the real API.
- Multi-client install docs and example configs for Claude Desktop, Claude Code,
  Cursor, Windsurf, and VS Code (Cline / Continue).
- CI matrix (Node 18 / 20 / 22), community-health files, and contribution guides.

### Changed

- **Data source switched to the public Sites.Reviews REST API**
  (`GET /api/public/v1/business/{domain}` and `/reviews/{domain}`) instead of
  scraping schema.org JSON-LD from business pages. The API is stable, structured,
  and read-only — no auth, no secrets, no writes.

[Unreleased]: https://github.com/SitesReviewsTrust/sites-reviews-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/SitesReviewsTrust/sites-reviews-mcp/releases/tag/v1.0.0
