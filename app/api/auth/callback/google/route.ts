// app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSession, findOrCreateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=missing_code', req.url));

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.id_token) return NextResponse.redirect(new URL('/login?error=token_exchange', req.url));

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    const user = await findOrCreateUser(profile);
    await createSession({ userId: user.id, email: user.email });

    return NextResponse.redirect(new URL('/Dashboard', req.url));
  } catch (err) {
    console.error('OAuth callback failed', err);
    const message = err instanceof Error ? err.message : 'auth_error';
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, req.url));
  }
}