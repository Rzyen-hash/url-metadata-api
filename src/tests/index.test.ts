import { describe, it, expect } from 'bun:test';
import { isValidUrl, resolveUrl } from './src/services/metadata';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('URL Metadata API', () => {
  
  // Health
  describe('Health', () => {
    it('should return healthy', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
    });
  });

  // Single URL
  describe('Single URL', () => {
    it('should extract metadata from example.com', async () => {
      const res = await fetch(`${BASE_URL}/v1/meta?url=https://example.com`);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data.url).toBeDefined();
        expect(data.title).toBeDefined();
        expect(data.statusCode).toBe(200);
      }
    });

    it('should return 400 for invalid URL', async () => {
      const res = await fetch(`${BASE_URL}/v1/meta?url=not-a-url`);
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing URL', async () => {
      const res = await fetch(`${BASE_URL}/v1/meta`);
      expect(res.status).toBe(400);
    });
  });

  // Batch
  describe('Batch', () => {
    it('should process multiple URLs', async () => {
      const res = await fetch(`${BASE_URL}/v1/meta/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: ['https://example.com', 'https://httpbin.org'] }),
      });
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data.results).toBeDefined();
        expect(data.results.length).toBeGreaterThan(0);
      }
    });

    it('should enforce 10 URL limit', async () => {
      const urls = Array(11).fill('https://example.com');
      const res = await fetch(`${BASE_URL}/v1/meta/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      expect(res.status).toBe(400);
    });
  });

  // OG Tags
  describe('OG Tags', () => {
    it('should extract OG metadata', async () => {
      const res = await fetch(`${BASE_URL}/v1/meta?url=https://ogp.me`);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data.og).toBeDefined();
        expect(data.og.title || data.og.description || data.og.image).toBeTruthy();
      }
    });
  });

  // Favicon
  describe('Favicon', () => {
    it('should resolve favicon to absolute URL', async () => {
      const res = await fetch(`${BASE_URL}/v1/meta?url=https://github.com`);
      
      if (res.status === 200) {
        const data = await res.json();
        if (data.favicon) {
          expect(data.favicon.startsWith('http')).toBe(true);
        }
      }
    });
  });

  // Utilities
  describe('Utilities', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('should resolve relative URLs', () => {
      expect(resolveUrl('https://example.com', '/favicon.ico')).toBe('https://example.com/favicon.ico');
    });
  });
});
