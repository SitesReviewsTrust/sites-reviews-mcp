/**
 * Live smoke test for the Sites.Reviews data layer.
 *
 * Hits the real site (no mocks) to confirm parsing still matches the live
 * JSON-LD. Run with: npm test
 */
import assert from "node:assert";
import { checkDomain, normalizeDomain } from "../src/sites-reviews.ts";

let failures = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

async function run() {
  console.log("normalizeDomain:");
  ok("strips protocol+path", normalizeDomain("https://www.Ozon.ru/x?y=1") === "www.ozon.ru");
  ok("bare domain lowercased", normalizeDomain("Bitmex.COM") === "bitmex.com");

  console.log("\ncheck_domain('1ps.ru') [LIVE]:");
  const r = await checkDomain("1ps.ru");
  console.log(JSON.stringify(
    { found: r.found, name: r.name, trustScore: r.trustScore, reviewCount: r.reviewCount, reviews: r.reviews?.length, source: r.source },
    null, 2
  ));
  ok("found", r.found === true);
  ok("has name", !!r.name);
  ok("trustScore ~4.8", r.trustScore !== undefined && Math.abs(r.trustScore - 4.8) < 0.6, `got ${r.trustScore}`);
  ok("reviewCount > 0", (r.reviewCount ?? 0) > 0, `got ${r.reviewCount}`);
  ok("has reviews", (r.reviews?.length ?? 0) > 0);
  ok("has verdict", !!r.verdict);
  ok("source set", r.source === "https://sites.reviews/businesses/1ps.ru");

  console.log("\ncheck_domain(nonexistent) [LIVE]:");
  const nf = await checkDomain("thisdomaindoesnotexist-xyz123.com");
  console.log(JSON.stringify({ found: nf.found, message: nf.message }, null, 2));
  ok("found === false", nf.found === false);
  ok("has helpful message", !!nf.message && /catalog/i.test(nf.message));

  console.log("");
  if (failures > 0) {
    console.error(`${failures} test(s) failed`);
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

run().catch((e) => {
  console.error("Test run crashed:", e);
  process.exit(1);
});
