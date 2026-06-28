# Usage walkthroughs

Real-world prompt → tool call → assistant answer flows for the **Sites.Reviews MCP server**.
Once the server is connected (see the [README](../README.md#-install-anywhere)),
just ask your assistant in plain language — it picks the right tool on its own.

The JSON blocks below are illustrative of the structured summary each tool returns;
exact scores and counts change over time as new reviews are published.

---

## 1. "Is this shop safe to buy from?"

> **You:** Is **ozon.ru** safe to buy from?

The assistant calls `check_domain`:

```json
{ "domain": "ozon.ru" }
```

Tool returns:

```json
{
  "found": true,
  "domain": "ozon.ru",
  "name": "Ozon",
  "trustScore": 4.2,
  "reviewCount": 128,
  "verdict": "Good reputation (4.2/5 from 128 reviews).",
  "source": "https://sites.reviews/businesses/ozon.ru"
}
```

> **Assistant:** Yes — **ozon.ru** has a **good reputation** on Sites.Reviews: a
> trust score of **4.2/5** across **128 reviews**. Buyers generally report
> reliable delivery and working refunds. I'd still pay with a method that offers
> buyer protection. Source: https://sites.reviews/businesses/ozon.ru

---

## 2. "Check this site before I sign up"

> **You:** Check **bitmex.com** before I create an account.

The assistant calls `check_domain` with `{ "domain": "bitmex.com" }`, gets the
trust score and verdict, then summarises the risk band and points you to the page
to read the full reviews. If the verdict is "Mixed" or "Poor", it will suggest
calling `get_reviews` to see *why*.

---

## 3. "Why does this site have a low score?"

> **You:** Show me recent reviews for **1ps.ru** and tell me what people complain about.

The assistant calls `get_reviews`:

```json
{ "domain": "1ps.ru", "limit": 5 }
```

Tool returns the trust score plus the most recent reviews (author, rating, date,
title, body). The assistant then synthesises the themes:

> **Assistant:** **1ps.ru** scores **4.8/5** from 34 reviews. Recent feedback is
> mostly positive — users praise the SEO promotion results and responsive
> support. The handful of lower ratings mention pricing. On balance, a strong
> reputation. Source: https://sites.reviews/businesses/1ps.ru

---

## 4. "Is this a scam?" (full URL, unknown domain)

> **You:** Is this a scam? `https://some-shop.example/checkout?ref=ad`

The assistant normalises the URL to `some-shop.example` and calls `check_domain`.
When the domain isn't in the catalog yet:

```json
{
  "found": false,
  "domain": "some-shop.example",
  "message": "\"some-shop.example\" is not yet in the Sites.Reviews catalog. Anyone can be the first to review it at https://sites.reviews/businesses/some-shop.example."
}
```

> **Assistant:** I couldn't find **some-shop.example** in the Sites.Reviews
> catalog, so there's no independent reputation data yet. That's not proof it's a
> scam, but treat an unknown shop with caution: verify contact details, look for
> HTTPS, and prefer a payment method with chargeback protection. You can be the
> first to review it at https://sites.reviews/businesses/some-shop.example

---

## 5. "Compare two providers"

> **You:** I'm choosing between **aliexpress.com** and another marketplace —
> which is more trusted?

The assistant calls `check_domain` **twice** (once per domain) and compares the
two trust scores and review counts side by side, then recommends the better-rated
option while flagging any notable complaint themes from `get_reviews`.

This "call the tool once per entity, then compare" pattern works for any number
of domains you want to evaluate against each other.
