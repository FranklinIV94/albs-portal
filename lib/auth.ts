import { NextRequest, NextResponse } from 'next/server';

// API key validation helper
export function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  const apiKey = request.headers.get('x-api-key');
  
  // Get key from env - check ZO key first, then fallback to generic
  const validKey = process.env.PORTAL_API_KEY_ZO || process.env.PORTAL_API_KEY || 'albs-portal-dev-key-2026';
  
  // If no key provided
  if (!apiKey) {
    return { 
      valid: false, 
      error: 'Missing API key. Include x-api-key header.' 
    };
  }
  
  // Check key
  if (apiKey !== validKey) {
    return { 
      valid: false, 
      error: 'Invalid API key' 
    };
  }
  
  return { valid: true };
}

// Middleware-like wrapper for API routes
export function withApiKey(handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async function(request: NextRequest, ...args: any[]) {
    const validation = validateApiKey(request);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }
    
    return handler(request, ...args);
  };
}