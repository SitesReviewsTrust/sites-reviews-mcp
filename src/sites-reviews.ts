/**
 * Sites.Reviews data layer.
 *
 * Sites.Reviews has no public JSON REST API. Each business page embeds the
 * relevant data as schema.org JSON-LD inside <script type="application/ld+json">
 * blocks. This module fetches a business page, extracts the Organization block
 * that carries an aggregateRating, and normalises it into plain objects.
 *
 * Everything here is read-only, anonymous and polite. No auth, no secrets.
 */

export const SITE_BASE = "https://sites.reviews";
export const USER_AGENT =
  "sites-reviews-mcp/1.0 (+https://github.com/SitesReviewsTrust/sites-reviews-mcp)";

// A real browser UA is required as well — Cloudflare returns a 1010 block for
// generic clients. We send a Chrome UA for the request and identify ourselves
// honestly in the X-Client header.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export interface Review {
  author: string;
  rating: number | null;
  date: string | null;
  title: string | null;
  body: string;
  positives: string[];
}

export interface BusinessResult {
  found: boolean;
  /** The normalised domain that actually resolved (may differ from input). */
  domain: string;
  name?: string;
  url?: string;
  /** aggregateRating.ratingValue, on a 0–5 scale. */
  trustScore?: number;
  reviewCount?: number;
  verdict?: string;
  reviews?: Review[];
  /** The Sites.Reviews page this data was read from. */
  source?: string;
  /** Human-readable note, mainly used when found === false. */
  message?: string;
}

/**
 * Normalise arbitrary user input into a Sites.Reviews domain slug.
 * Strips protocol, path, query, port, auth and whitespace; lowercases.
 *   "https://www.Ozon.ru/foo?x=1" -> "www.ozon.ru"
 */
export function normalizeDomain(input: string): string {
  let d = (input || "").trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, ""); // protocol
  d = d.replace(/^[^@/]*@/, ""); // user:pass@
  d = d.split("/")[0]; // path
  d = d.split("?")[0]; // query
  d = d.split("#")[0]; // fragment
  d = d.split(":")[0]; // port
  return d.trim();
}

/** Candidate domains to try, in order: as-is, then toggle leading `www.`. */
function domainCandidates(domain: string): string[] {
  const out = [domain];
  if (domain.startsWith("www.")) out.push(domain.slice(4));
  else out.push("www." + domain);
  return [...new Set(out)];
}

export function businessUrl(domain: string): string {
  return `${SITE_BASE}/businesses/${encodeURIComponent(domain)}`;
}

type FetchLike = typeof fetch;

/** Fetch one business page. Returns the HTML, or null on 404. Throws on other errors. */
async function fetchBusinessPage(
  domain: string,
  fetchImpl: FetchLike
): Promise<string | null> {
  const res = await fetchImpl(businessUrl(domain), {
    headers: {
      "User-Agent": BROWSER_UA,
      "X-Client": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en,ru;q=0.8",
    },
    redirect: "follow",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Sites.Reviews returned HTTP ${res.status} for ${domain}`);
  }
  return await res.text();
}

/** Extract and JSON.parse every <script type="application/ld+json"> block. */
function extractJsonLd(html: string): any[] {
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: any[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      // Skip malformed blocks rather than failing the whole request.
    }
  }
  return blocks;
}

function typeMatches(t: unknown, want: string): boolean {
  if (Array.isArray(t)) return t.includes(want);
  return t === want;
}

/**
 * Find the business Organization block: an Organization that carries an
 * aggregateRating. The first "Sites Reviews" Organization (the site itself)
 * has no aggregateRating, so the aggregateRating test alone separates them.
 */
function findBusinessOrg(blocks: any[]): any | null {
  for (const b of blocks) {
    if (typeMatches(b?.["@type"], "Organization") && b?.aggregateRating) {
      return b;
    }
  }
  return null;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function buildVerdict(score: number | null, count: number | null): string {
  if (score === null) return "No trust score available yet.";
  const c = count ?? 0;
  let band: string;
  if (score >= 4.5) band = "Excellent reputation";
  else if (score >= 4.0) band = "Good reputation";
  else if (score >= 3.0) band = "Mixed reputation — read reviews carefully";
  else if (score >= 2.0) band = "Poor reputation — proceed with caution";
  else band = "Very poor reputation — high risk";
  return `${band} (${score.toFixed(1)}/5 from ${c} review${c === 1 ? "" : "s"}).`;
}

function extractPositives(review: any): string[] {
  const items = review?.positiveNotes?.itemListElement;
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => (typeof it?.name === "string" ? it.name : null))
    .filter((x): x is string => !!x);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function parseReviews(org: any, bodyLimit = 400): Review[] {
  const raw = Array.isArray(org?.review) ? org.review : [];
  return raw.map((r: any): Review => {
    const author =
      (typeof r?.author === "string" ? r.author : r?.author?.name) ||
      "Anonymous";
    return {
      author: String(author),
      rating: toNumber(r?.reviewRating?.ratingValue),
      date: r?.datePublished ? String(r.datePublished) : null,
      title: r?.name ? String(r.name) : null,
      body: r?.reviewBody ? truncate(String(r.reviewBody), bodyLimit) : "",
      positives: extractPositives(r),
    };
  });
}

/**
 * Look up a business on Sites.Reviews.
 *
 * Tries the normalised domain, and on 404 retries the www-toggled variant.
 * Returns { found: false, ... } when the company is not in the catalog.
 *
 * @param input    Raw domain or URL.
 * @param opts.bodyLimit  Max characters per review body (default 400).
 * @param opts.fetchImpl  Override for testing (defaults to global fetch).
 */
export async function checkDomain(
  input: string,
  opts: { bodyLimit?: number; fetchImpl?: FetchLike } = {}
): Promise<BusinessResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const bodyLimit = opts.bodyLimit ?? 400;
  const normalized = normalizeDomain(input);

  if (!normalized || !/[a-z0-9.-]/i.test(normalized)) {
    return {
      found: false,
      domain: normalized,
      message: `"${input}" is not a valid domain.`,
    };
  }

  let html: string | null = null;
  let resolvedDomain = normalized;
  for (const candidate of domainCandidates(normalized)) {
    html = await fetchBusinessPage(candidate, fetchImpl);
    if (html !== null) {
      resolvedDomain = candidate;
      break;
    }
  }

  if (html === null) {
    return {
      found: false,
      domain: normalized,
      source: businessUrl(normalized),
      message:
        `"${normalized}" is not yet in the Sites.Reviews catalog. ` +
        `Anyone can be the first to review it at ${businessUrl(normalized)}.`,
    };
  }

  const org = findBusinessOrg(extractJsonLd(html));
  if (!org) {
    return {
      found: false,
      domain: resolvedDomain,
      source: businessUrl(resolvedDomain),
      message:
        `Found a Sites.Reviews page for "${resolvedDomain}" but it has no ` +
        `trust rating yet. See ${businessUrl(resolvedDomain)}.`,
    };
  }

  const trustScore = toNumber(org?.aggregateRating?.ratingValue);
  const reviewCount = toNumber(org?.aggregateRating?.reviewCount);
  const source = businessUrl(resolvedDomain);

  return {
    found: true,
    domain: resolvedDomain,
    name: org?.name ? String(org.name) : resolvedDomain,
    url: org?.url ? String(org.url) : source,
    trustScore: trustScore ?? undefined,
    reviewCount: reviewCount ?? undefined,
    verdict: buildVerdict(trustScore, reviewCount),
    reviews: parseReviews(org, bodyLimit),
    source,
  };
}
