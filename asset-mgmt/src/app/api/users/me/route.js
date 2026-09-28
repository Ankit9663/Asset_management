import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * GET /api/users/me
 * Returns the currently active demo user session.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Fetch me error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve user', details: error.message },
      { status: 500 }
    );
  }
}
