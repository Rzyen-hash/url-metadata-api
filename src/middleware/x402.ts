import type { Context, Next } from 'hono';

// x402 Payment Configuration
const X402_CONFIG = {
  payTo: '0x84FDEbBfe9692392abd30429e1a6Ae75D8B7fb3B',
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  chainId: 8453,
  defaultAmount: '10000',
};

function createPaymentRequirement(amount: string): string {
  const requirement = {
    scheme: 'exact',
    network: 'base',
    asset: X402_CONFIG.asset,
    amount: amount,
    payTo: X402_CONFIG.payTo,
    maxTimeoutSeconds: 300,
  };
  return Buffer.from(JSON.stringify(requirement)).toString('base64');
}

function verifyPayment(paymentHeader: string): boolean {
  try {
    const payment = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
    if (!payment.signature || !payment.amount || !payment.payTo) return false;
    if (payment.payTo.toLowerCase() !== X402_CONFIG.payTo.toLowerCase()) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export function x402Middleware(amount?: string) {
  return async (c: Context, next: Next) => {
    const paymentAmount = amount || X402_CONFIG.defaultAmount;
    const paymentHeader = c.req.header('X-PAYMENT') || c.req.header('PAYMENT-SIGNATURE');
    
    if (!paymentHeader) {
      const requirement = createPaymentRequirement(paymentAmount);
      return c.json({
        error: 'Payment Required',
        message: 'This endpoint requires x402 payment. Include X-PAYMENT header.',
        paymentRequired: requirement,
        documentation: 'https://x402.org',
      }, 402, {
        'X-PAYMENT-REQUIRED': requirement,
        'X-PAYMENT-VERSION': '2',
      });
    }
    
    if (!verifyPayment(paymentHeader)) {
      return c.json({ error: 'Invalid Payment', message: 'Payment signature verification failed' }, 402);
    }
    
    await next();
  };
}

export function x402MetaMiddleware() { return x402Middleware('10000'); }
export function x402BatchMiddleware() { return x402Middleware('60000'); }

export function getX402Manifest() {
  return {
    resource: 'https://url-metadata-api-production.up.railway.app',
    type: 'http',
    x402Version: 2,
    networks: ['eip155:8453'],
    assets: [X402_CONFIG.asset],
    maxAmountRequired: '60000',
    payTo: [X402_CONFIG.payTo],
    accepts: [
      {
        asset: X402_CONFIG.asset,
        description: 'Fetch metadata from any URL. Returns title, description, images, favicon, OpenGraph tags. GET /v1/meta?url=https://example.com (0.01 USDC)',
        extra: { name: 'USD Coin', version: '2' },
        maxAmountRequired: '10000',
        maxTimeoutSeconds: 300,
        mimeType: 'application/json',
        network: 'eip155:8453',
        payTo: X402_CONFIG.payTo,
        resource: 'https://url-metadata-api-production.up.railway.app/v1/meta',
        scheme: 'exact',
      },
      {
        asset: X402_CONFIG.asset,
        description: 'Batch metadata fetch for up to 10 URLs. POST /v1/meta/batch with {urls: [...]} (0.06 USDC)',
        extra: { name: 'USD Coin', version: '2' },
        maxAmountRequired: '60000',
        maxTimeoutSeconds: 300,
        mimeType: 'application/json',
        network: 'eip155:8453',
        payTo: X402_CONFIG.payTo,
        resource: 'https://url-metadata-api-production.up.railway.app/v1/meta/batch',
        scheme: 'exact',
      },
    ],
    metadata: {},
    lastUpdated: new Date().toISOString(),
  };
}