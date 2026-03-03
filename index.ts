import { Hono } from 'hono';
import { getMetadata, getBatchMetadata, isValidUrl } from './src/services/metadata';
import { x402MetaMiddleware, x402BatchMiddleware, getX402Manifest } from './src/middleware/x402';
import type { MetadataResponse, BatchMetadataResponse, HealthResponse } from './src/types';

const app = new Hono();
const startTime = Date.now();

// Health check (free)
app.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.1.0-x402',
    uptime: Date.now() - startTime,
  };
  return c.json(response);
});

// x402 Manifest endpoint for discovery
app.get('/.well-known/x402-manifest', (c) => {
  return c.json(getX402Manifest());
});

// GET /v1/meta?url= (0.01 USDC)
app.get('/v1/meta', x402MetaMiddleware(), async (c) => {
  const url = c.req.query('url');
  
  if (!url) {
    return c.json({ error: 'Missing required parameter: url' }, 400);
  }
  
  if (!isValidUrl(url)) {
    return c.json({ error: `Invalid URL: ${url}` }, 400);
  }
  
  const result = await getMetadata(url);
  
  if (!result) {
    return c.json({ error: `Failed to fetch metadata for: ${url}` }, 404);
  }
  
  return c.json(result);
});

// POST /v1/meta/batch (0.06 USDC, max 10)
app.post('/v1/meta/batch', x402BatchMiddleware(), async (c) => {
  try {
    const body = await c.req.json();
    const urls = body.urls;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return c.json({ error: 'Missing or invalid parameter: urls (must be an array)' }, 400);
    }
    
    if (urls.length > 10) {
      return c.json({ error: 'Maximum 10 URLs allowed per batch request' }, 400);
    }
    
    const { results, errors } = await getBatchMetadata(urls);
    
    const response: BatchMetadataResponse = { results };
    if (errors.length > 0) {
      response.errors = errors;
    }
    
    return c.json(response);
  } catch (error) {
    return c.json({ error: 'Invalid JSON in request body' }, 400);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = process.env.PORT || 3000;

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`URL Metadata API running at http://localhost:${port}`);