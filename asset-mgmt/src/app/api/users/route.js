import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SEEDED_USERS } from '@/lib/constants';

/**
 * GET /api/users
 * Returns list of all demonstration accounts.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const role = searchParams.get('role');

    let rows = [];
    try {
      rows = await query('SELECT * FROM users ORDER BY role ASC, name ASC');
    } catch (e) {
      // Fallback to static constants if DB query fails
      rows = SEEDED_USERS;
    }

    let users = rows.length > 0 ? rows.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      designation: u.designation,
      category: u.category,
      divisionName: u.division_name || u.divisionName,
      divisionId: u.division_id || u.divisionId,
      avatar: u.avatar,
    })) : SEEDED_USERS;

    if (category) {
      users = users.filter(u => u.category === category || u.category === 'ALL');
    }
    if (role) {
      users = users.filter(u => u.role === role);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
