# Security Policy

## Supported versions

The Sites.Reviews MCP server is distributed via npm. Security fixes are applied
to the latest published `1.x` release.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, use GitHub's private vulnerability reporting:

1. Go to the **[Security tab](https://github.com/SitesReviewsTrust/sites-reviews-mcp/security)**
   of this repository.
2. Click **"Report a vulnerability"** to open a private advisory
   ([direct link](https://github.com/SitesReviewsTrust/sites-reviews-mcp/security/advisories/new)).
3. Describe the issue, the impact, and steps to reproduce.

This delivers your report privately to the maintainers. We will acknowledge
receipt, investigate, and keep you updated on remediation and disclosure
timing. We aim to respond within a few business days.

## Scope & threat model

This server is intentionally minimal and low-risk:

- It runs **locally** over stdio under your AI client.
- It makes **read-only, unauthenticated** HTTP GET requests to the public
  Sites.Reviews API (`https://sites.reviews/api/public/v1`).
- It handles **no secrets, no credentials, no API keys, and performs no writes**.
- It does not open network listeners or persist data.

Reports we're especially interested in:

- A way for crafted tool input or API responses to cause unexpected code
  execution, file access, or resource exhaustion in the host process.
- Supply-chain concerns in the dependency tree
  (`@modelcontextprotocol/sdk`, `zod`).
- Any path by which the server could leak data from the host environment.

Thank you for helping keep the Sites.Reviews ecosystem and its users safe.
