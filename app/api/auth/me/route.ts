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
    // The DB lookup failed (timeout, network). The JWT is still valid, so
    // return the session data we already trust instead of dropping the user
    // to null — otherwise the UI would flash "signed out" intermittently.
    console.error('Failed to load user profile, falling back to session', err);
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: null,
        avatar_url: null,
      },
    });
  }
}