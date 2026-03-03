import * as cheerio from 'cheerio';
import type { MetadataResponse } from '../types';

const CACHE_TTL = 300000; // 5 minutes

interface CacheEntry {
  data: MetadataResponse;
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function detectTechStack(headers: Headers, $: cheerio.CheerioAPI): string[] {
  const tech: string[] = [];
  
  // Server header
  const server = headers.get('server');
  if (server) {
    if (server.includes('nginx')) tech.push('nginx');
    if (server.includes('Apache')) tech.push('apache');
    if (server.includes('cloudflare')) tech.push('cloudflare');
  }
  
  // X-Powered-By
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy) {
    if (poweredBy.includes('PHP')) tech.push('php');
    if (poweredBy.includes('Express')) tech.push('express');
  }
  
  // Meta generator
  const generator = $('meta[name="generator"]').attr('content');
  if (generator) {
    if (generator.includes('WordPress')) tech.push('wordpress');
    if (generator.includes('Next.js')) tech.push('nextjs');
    if (generator.includes('Gatsby')) tech.push('gatsby');
  }
  
  // Check for React
  if ($('[data-reactroot]').length || $('#__next').length) {
    tech.push('react');
  }
  
  // Check for Vue
  if ($('[data-v-]').length) {
    tech.push('vue');
  }
  
  return tech;
}

export async function getMetadata(url: string): Promise<MetadataResponse | null> {
  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      ...cached.data,
      freshness: {
        ...cached.data.freshness,
        staleness: Math.floor((Date.now() - cached.timestamp) / 1000),
      },
    };
  }
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    
    const responseTime = Date.now() - startTime;
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract metadata
    const title = $('title').text() || null;
    const description = $('meta[name="description"]').attr('content') || null;
    const canonical = $('link[rel="canonical"]').attr('href') || null;
    const language = $('html').attr('lang') || null;
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^;]+)/)?.[1] || null;
    
    // OG tags
    const ogTitle = $('meta[property="og:title"]').attr('content') || null;
    const ogDescription = $('meta[property="og:description"]').attr('content') || null;
    const ogImage = $('meta[property="og:image"]').attr('content') || null;
    const ogType = $('meta[property="og:type"]').attr('content') || null;
    const ogSiteName = $('meta[property="og:site_name"]').attr('content') || null;
    
    // Twitter tags
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || null;
    const twitterSite = $('meta[name="twitter:site"]').attr('content') || null;
    
    // Favicon
    let favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || null;
    if (favicon) {
      favicon = resolveUrl(url, favicon);
    }
    
    // Tech stack detection
    const techStack = detectTechStack(response.headers, $);
    
    const result: MetadataResponse = {
      url: response.url || url,
      canonical: canonical ? resolveUrl(url, canonical) : null,
      title,
      description,
      og: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage ? resolveUrl(url, ogImage) : null,
        type: ogType,
        siteName: ogSiteName,
      },
      twitter: {
        card: twitterCard,
        site: twitterSite,
      },
      favicon,
      language,
      charset,
      techStack,
      responseTime,
      statusCode: response.status,
      freshness: {
        fetchedAt: new Date().toISOString(),
        staleness: 0,
        confidence: 0.9,
      },
    };
    
    // Cache result
    cache.set(url, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

export async function getBatchMetadata(urls: string[]): Promise<{ results: MetadataResponse[]; errors: string[] }> {
  const results: MetadataResponse[] = [];
  const errors: string[] = [];
  
  // Limit to 10 URLs
  const limitedUrls = urls.slice(0, 10);
  
  const promises = limitedUrls.map(async (url) => {
    // Validate URL
    if (!isValidUrl(url)) {
      errors.push(`Invalid URL: ${url}`);
      return;
    }
    
    const result = await getMetadata(url);
    if (result) {
      results.push(result);
    } else {
      errors.push(`Failed to fetch metadata for: ${url}`);
    }
  });
  
  await Promise.all(promises);
  
  return { results, errors };
}
