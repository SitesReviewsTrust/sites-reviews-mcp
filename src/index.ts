#!/usr/bin/env node
/**
 * Sites.Reviews MCP server.
 *
 * Exposes two read-only tools that let an AI assistant check a website's trust
 * score and read real reviews from https://sites.reviews before the user
 * trusts or pays it.
 *
 * Transport: stdio. No auth, no secrets, no writes.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Import from `zod/v3` (not the bare `zod` entrypoint) to match the type
// identity the MCP SDK's zod-compat layer references. Using the bare entry
// with zod 3.25 triggers TS2589 "type instantiation excessively deep".
import { z } from "zod/v3";
import {
  checkDomain,
  type BusinessResult,
  type Review,
  SITE_BASE,
} from "./sites-reviews.js";

const SITE_LINK = `Source: Sites.Reviews (${SITE_BASE}) — independent website & company review catalog.`;

function ratingStars(score?: number): string {
  if (score === undefined) return "";
  const full = Math.round(score);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

/** Render check_domain result as readable text + a compact JSON summary. */
function renderCheck(result: BusinessResult): string {
  const lines: string[] = [];
  if (!result.found) {
    lines.push(`❓ Not found: ${result.domain}`);
    if (result.message) lines.push(result.message);
  } else {
    lines.push(`🏢 ${result.name} (${result.domain})`);
    lines.push(
      `Trust score: ${result.trustScore?.toFixed(1) ?? "n/a"}/5 ${ratingStars(
        result.trustScore
      )}  ·  ${result.reviewCount ?? 0} reviews`
    );
    if (result.verdict) lines.push(`Verdict: ${result.verdict}`);
    if (result.source) lines.push(`Page: ${result.source}`);
  }

  const summary = {
    found: result.found,
    domain: result.domain,
    name: result.name,
    url: result.url,
    trustScore: result.trustScore,
    reviewCount: result.reviewCount,
    verdict: result.verdict,
    source: result.source,
  };

  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(summary, null, 2));
  lines.push("```");
  lines.push(SITE_LINK);
  return lines.join("\n");
}

function renderReview(r: Review, idx: number): string {
  const parts: string[] = [];
  const stars = r.rating !== null ? `${r.rating}/5 ${ratingStars(r.rating)}` : "no rating";
  parts.push(`${idx}. ${r.title ?? "(untitled)"} — ${stars}`);
  parts.push(`   by ${r.author}${r.date ? ` on ${r.date}` : ""}`);
  if (r.body) parts.push(`   ${r.body}`);
  if (r.positives.length) parts.push(`   👍 ${r.positives.join(", ")}`);
  return parts.join("\n");
}

/** Render get_reviews result as readable text + a compact JSON summary. */
function renderReviews(result: BusinessResult, limit: number): string {
  const lines: string[] = [];
  if (!result.found) {
    lines.push(`❓ Not found: ${result.domain}`);
    if (result.message) lines.push(result.message);
    lines.push("");
    lines.push(SITE_LINK);
    return lines.join("\n");
  }

  const reviews = (result.reviews ?? []).slice(0, limit);
  lines.push(`📝 Reviews for ${result.name} (${result.domain})`);
  lines.push(
    `Trust score: ${result.trustScore?.toFixed(1) ?? "n/a"}/5 · ${
      result.reviewCount ?? 0
    } total reviews · showing ${reviews.length}`
  );
  lines.push("");
  if (reviews.length === 0) {
    lines.push("No individual reviews available on the page.");
  } else {
    reviews.forEach((r, i) => lines.push(renderReview(r, i + 1), ""));
  }

  const summary = {
    found: true,
    domain: result.domain,
    name: result.name,
    trustScore: result.trustScore,
    reviewCount: result.reviewCount,
    returned: reviews.length,
    source: result.source,
    reviews: reviews.map((r) => ({
      author: r.author,
      rating: r.rating,
      date: r.date,
      title: r.title,
      body: r.body,
    })),
  };

  lines.push("```json");
  lines.push(JSON.stringify(summary, null, 2));
  lines.push("```");
  lines.push(`Page: ${result.source}`);
  lines.push(SITE_LINK);
  return lines.join("\n");
}

const server = new McpServer({
  name: "sites-reviews-mcp",
  version: "1.0.0",
});

server.registerTool(
  "check_domain",
  {
    title: "Check a domain's trust score",
    description:
      "Check whether a website/company is trustworthy using Sites.Reviews. " +
      "Returns the trust score (0–5), review count and a one-line verdict — " +
      "useful before paying, signing up or sharing data with a site. " +
      "Accepts a bare domain or a full URL (e.g. ozon.ru, https://bitmex.com).",
    inputSchema: {
      domain: z
        .string()
        .min(1)
        .describe("Domain or URL to check, e.g. 'ozon.ru' or 'https://bitmex.com'."),
    },
  },
  async ({ domain }) => {
    try {
      const result = await checkDomain(domain);
      return { content: [{ type: "text", text: renderCheck(result) }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to check "${domain}" on Sites.Reviews: ${msg}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "get_reviews",
  {
    title: "Get recent reviews for a domain",
    description:
      "Fetch recent user reviews for a website/company from Sites.Reviews: " +
      "author, rating, date, title and body. Use this to understand WHY a " +
      "site has its trust score. Accepts a bare domain or a full URL.",
    inputSchema: {
      domain: z
        .string()
        .min(1)
        .describe("Domain or URL to fetch reviews for, e.g. '1ps.ru'."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum number of reviews to return (default 5, max 20)."),
    },
  },
  async ({ domain, limit }) => {
    const lim = limit ?? 5;
    try {
      const result = await checkDomain(domain);
      return { content: [{ type: "text", text: renderReviews(result, lim) }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to get reviews for "${domain}" on Sites.Reviews: ${msg}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is reserved for the MCP protocol.
  console.error("sites-reviews-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal error in sites-reviews-mcp:", err);
  process.exit(1);
});
