/**
 * Sites.Reviews data layer.
 *
 * Reads the public Sites.Reviews REST API (no auth, read-only):
 *   GET /api/public/v1/business/{domain}   -> company summary + trust score
 *   GET /api/public/v1/reviews/{domain}    -> recent published reviews
 * The same data is also exposed as schema.org JSON-LD on each business page;
 * this module uses the JSON API because it is stable and structured.
 *
 * Everything here is read-only, anonymous and polite. No auth, no secrets.
 */

export const SITE_BASE = "https://sites.reviews";
export const API_BASE = `${SITE_BASE}/api/public/v1`;
export const USER_AGENT =
  "sites-reviews-mcp/1.0 (+https://github.com/SitesReviewsTrust/sites-reviews-mcp)";

// A real browser UA is sent as well — the site sits behind Cloudflare, which
// can challenge generic clients. We identify ourselves honestly in X-Client.
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
  /** Trust rating on a 0–5 scale (avg_ratings). */
  trustScore?: number;
  reviewCount?: number;
  verdict?: string;
  reviews?: Review[];
  /** The Sites.Reviews page this data refers to. */
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

export function pageUrl(domain: string): string {
  return `${SITE_BASE}/businesses/${encodeURIComponent(domain)}`;
}

type FetchLike = typeof fetch;

const HEADERS = {
  "User-Agent": BROWSER_UA,
  "X-Client": USER_AGENT,
  Accept: "application/json",
  "Accept-Language": "en,ru;q=0.8",
};

/** GET a public API path. Returns parsed JSON, or null on 404. Throws on other errors. */
async function apiGet(path: string, fetchImpl: FetchLike): Promise<any | null> {
  const res = await fetchImpl(`${API_BASE}${path}`, {
    headers: HEADERS,
    redirect: "follow",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Sites.Reviews API returned HTTP ${res.status} for ${path}`);
  }
  return await res.json();
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

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x : x?.title ?? x?.text))
    .filter((x): x is string => typeof x === "string" && x.length > 0);
}

function parseReviews(rows: any[], bodyLimit: number): Review[] {
  return (Array.isArray(rows) ? rows : []).map((r: any): Review => ({
    author: r?.author ? String(r.author) : "Anonymous",
    rating: toNumber(r?.stars),
    date: r?.created_at ? String(r.created_at) : null,
    title: r?.title ? String(r.title) : null,
    body: r?.body ? truncate(String(r.body), bodyLimit) : "",
    positives: asStringArray(r?.pros),
  }));
}

/**
 * Look up a business on Sites.Reviews via the public API.
 *
 * Tries the normalised domain, and on 404 retries the www-toggled variant.
 * Returns { found: false, ... } when the company is not in the catalog.
 *
 * @param input    Raw domain or URL.
 * @param opts.bodyLimit  Max characters per review body (default 400).
 * @param opts.maxReviews Max reviews to fetch (default 20).
 * @param opts.fetchImpl  Override for testing (defaults to global fetch).
 */
export async function checkDomain(
  input: string,
  opts: { bodyLimit?: number; maxReviews?: number; fetchImpl?: FetchLike } = {}
): Promise<BusinessResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const bodyLimit = opts.bodyLimit ?? 400;
  const maxReviews = opts.maxReviews ?? 20;
  const normalized = normalizeDomain(input);

  if (!normalized || !/[a-z0-9.-]/i.test(normalized)) {
    return {
      found: false,
      domain: normalized,
      message: `"${input}" is not a valid domain.`,
    };
  }

  let biz: any | null = null;
  let resolvedDomain = normalized;
  for (const candidate of domainCandidates(normalized)) {
    biz = await apiGet(`/business/${encodeURIComponent(candidate)}`, fetchImpl);
    if (biz && !biz.error) {
      resolvedDomain = candidate;
      break;
    }
    biz = null;
  }

  if (!biz) {
    return {
      found: false,
      domain: normalized,
      source: pageUrl(normalized),
      message:
        `"${normalized}" is not yet in the Sites.Reviews catalog. ` +
        `Anyone can be the first to review it at ${pageUrl(normalized)}.`,
    };
  }

  const trustScore = toNumber(biz.avg_ratings);
  const reviewCount = toNumber(biz.total_reviews);
  const source = biz.url ? String(biz.url) : pageUrl(resolvedDomain);

  // Pull recent reviews (best-effort — a summary without reviews is still useful).
  let reviews: Review[] = [];
  try {
    const rv = await apiGet(
      `/reviews/${encodeURIComponent(resolvedDomain)}?per_page=${maxReviews}`,
      fetchImpl
    );
    if (rv && Array.isArray(rv.reviews)) reviews = parseReviews(rv.reviews, bodyLimit);
  } catch {
    // Non-fatal: keep the summary even if the reviews call fails.
  }

  return {
    found: true,
    domain: resolvedDomain,
    name: biz.name ? String(biz.name) : resolvedDomain,
    url: source,
    trustScore: trustScore ?? undefined,
    reviewCount: reviewCount ?? undefined,
    verdict: buildVerdict(trustScore, reviewCount),
    reviews,
    source,
  };
}
