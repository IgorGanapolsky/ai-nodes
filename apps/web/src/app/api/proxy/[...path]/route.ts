import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Helper to get authorization header
function getAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return authHeader;
  }

  // If no auth header, check for basic auth from middleware
  const basicAuth = request.headers.get('x-forwarded-authorization');
  if (basicAuth) {
    return `Basic ${basicAuth}`;
  }

  return null;
}

// Helper to build API URL
function buildApiUrl(path: string[], searchParams: URLSearchParams) {
  const apiPath = path.join('/');
  const url = new URL(`/api/${apiPath}`, API_BASE_URL);

  // Forward all search parameters
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

// Helper to forward headers
function getForwardedHeaders(request: NextRequest) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'DePIN-Autopilot-Web/1.0',
  };

  // Forward authorization
  const auth = getAuthHeader(request);
  if (auth) {
    headers['Authorization'] = auth;
  }

  // Forward other relevant headers
  const relevantHeaders = ['x-correlation-id', 'x-request-id', 'accept-language'];
  relevantHeaders.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  return headers;
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const { path } = params;
    const searchParams = request.nextUrl.searchParams;

    const apiUrl = buildApiUrl(path, searchParams);
    const headers = getForwardedHeaders(request);

    console.log(`[API Proxy] GET ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await response.json();

    // Forward the response status and headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');

    // Forward cache-related headers
    const cacheHeaders = ['cache-control', 'etag', 'last-modified'];
    cacheHeaders.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch data from API' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const { path } = params;
    const body = await request.text();

    const apiUrl = buildApiUrl(path, new URLSearchParams());
    const headers = getForwardedHeaders(request);

    console.log(`[API Proxy] POST ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[API Proxy] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to send data to API' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const { path } = params;
    const body = await request.text();

    const apiUrl = buildApiUrl(path, new URLSearchParams());
    const headers = getForwardedHeaders(request);

    console.log(`[API Proxy] PUT ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[API Proxy] PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update data via API' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const { path } = params;

    const apiUrl = buildApiUrl(path, new URLSearchParams());
    const headers = getForwardedHeaders(request);

    console.log(`[API Proxy] DELETE ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers,
    });

    const data = response.headers.get('content-length') !== '0' ? await response.json() : {};

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[API Proxy] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to delete data via API' },
      { status: 500 },
    );
  }
}
