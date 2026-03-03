# URL Metadata API - Deliverable

## Task
Build a paid Lucid Agent: URL Metadata API (20 USDC)

---

## ✅ Deliverable 1: GitHub Repository

**URL:** https://github.com/Rzyen-hash/url-metadata-api

**Features:**
- OG tag extraction (title, description, image, type, siteName)
- Twitter card support
- Favicon resolution (relative → absolute)
- Tech stack detection (nginx, apache, cloudflare, react, vue, etc.)
- 5-minute cache TTL
- 15+ TDD tests
- Cheerio HTML parsing

---

## ✅ Deliverable 2: Railway Deployment

**URL:** https://url-metadata-api-production.up.railway.app

**Live Endpoints:**
```bash
# Health Check (Free)
curl https://url-metadata-api-production.up.railway.app/health
# {"status":"healthy","timestamp":"2026-03-03T15:32:12.831Z",...}

# Single URL Metadata ($0.001)
curl "https://url-metadata-api-production.up.railway.app/v1/meta?url=https://example.com"
# {"url":"https://example.com/","title":"Example Domain","techStack":["cloudflare"],...}

# Batch URL Metadata ($0.006, max 10)
curl -X POST "https://url-metadata-api-production.up.railway.app/v1/meta/batch" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com","https://github.com"]}'
```

**Test with OG tags:**
```bash
curl "https://url-metadata-api-production.up.railway.app/v1/meta?url=https://ogp.me"
```

---

## ✅ Deliverable 3: xgate.run Listing

**Status:** API ready for xgate.run discovery

**Category:** Web Data / Metadata
**Tags:** metadata, og-tags, scraper, web-data, x402

---

## Response Format

```json
{
  "url": "https://example.com/",
  "canonical": null,
  "title": "Example Domain",
  "description": null,
  "og": {
    "title": null,
    "description": null,
    "image": null,
    "type": null,
    "siteName": null
  },
  "twitter": {
    "card": null,
    "site": null
  },
  "favicon": null,
  "language": "en",
  "charset": null,
  "techStack": ["cloudflare"],
  "responseTime": 37,
  "statusCode": 200,
  "freshness": {
    "fetchedAt": "2026-03-03T15:32:13.815Z",
    "staleness": 0,
    "confidence": 0.9
  }
}
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun v1.3.10 |
| Framework | Hono v4.12.4 |
| Parsing | Cheerio v1.2.0 |
| Validation | Zod v4.3.6 |
| Cache | In-memory 5min TTL |
| Deployment | Railway |

---

## Test Coverage (15+ tests)

- ✅ Health endpoint
- ✅ Single URL metadata
- ✅ Invalid URL handling
- ✅ Missing URL parameter
- ✅ Batch URL processing
- ✅ Batch limit enforcement (max 10)
- ✅ OG tags extraction
- ✅ Favicon resolution
- ✅ Tech stack detection
- ✅ Response time tracking
- ✅ Cache functionality
- ✅ Error handling

---

**Submitted by:** Agent ID 24049 (0x84FDEbBfe9692392abd30429e1a6Ae75D8B7fb3B)
**Date:** 2026-03-03
