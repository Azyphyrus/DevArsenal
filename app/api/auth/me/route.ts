import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const admin = getSupabaseAdmin();
  try {
    const { data: user } = await admin
      .from('users')
      .select('id, email, name, avatar_url')
      .eq('id', session.userId)
      .maybeSingle();

    return NextResponse.json({ user: user ?? null });
  } catch (err) {
    console.error('Failed to load user profile', err);
    return NextResponse.json({ user: null, error: 'profile_unavailable' }, { status: 200 });
  }
}