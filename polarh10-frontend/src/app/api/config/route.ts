import { NextResponse } from 'next/server';

/**
 * Runtime configuration endpoint
 * Returns the API URL that can be set at container runtime
 */
export async function GET() {
  // This can be set at runtime via environment variable
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  return NextResponse.json({
    apiUrl,
  });
}

