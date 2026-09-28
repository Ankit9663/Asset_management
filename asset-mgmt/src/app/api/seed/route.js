/**
 * POST /api/seed
 * 
 * Seeds the database with demo data or resets it.
 * Query param: ?reset=true to drop all data and re-seed.
 */

import { NextResponse } from 'next/server';
import { runSeed } from '@/lib/seed';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';

    const result = await runSeed(reset);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database.', details: error.message },
      { status: 500 }
    );
  }
}
