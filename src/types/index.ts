export interface MetadataResponse {
  url: string;
  canonical: string | null;
  title: string | null;
  description: string | null;
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    siteName: string | null;
  };
  twitter: {
    card: string | null;
    site: string | null;
  };
  favicon: string | null;
  language: string | null;
  charset: string | null;
  techStack: string[];
  responseTime: number;
  statusCode: number;
  freshness: {
    fetchedAt: string;
    staleness: number;
    confidence: number;
  };
}

export interface BatchMetadataRequest {
  urls: string[];
}

export interface BatchMetadataResponse {
  results: MetadataResponse[];
  errors?: string[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
}
