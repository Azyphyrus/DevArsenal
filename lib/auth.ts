import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-insecure-session-secret-change-me'
);
const SESSION_COOKIE = 'session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days, in seconds

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, {
      // Tolerate up to 60s of clock skew between the signing environment and
      // this server. Without this, a token signed by a machine whose clock is
      // slightly ahead is rejected as "not yet valid" (in the future).
      clockTolerance: 60,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// For use in server components / API routes
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Find or create a user record from Google profile data
export async function findOrCreateUser(googleProfile: {
  sub: string;
  email: string;
  name: string;
  picture: string;
}) {
  const admin = getSupabaseAdmin();
  try {
    const { data: existing } = await admin
      .from('users')
      .select('*')
      .or(`google_id.eq.${googleProfile.sub},email.eq.${googleProfile.email}`)
      .maybeSingle();

    if (existing) {
      // If the account previously existed with a different Google id, link it.
      if (existing.google_id !== googleProfile.sub) {
        const { data: linked, error: linkError } = await admin
          .from('users')
          .update({ google_id: googleProfile.sub, name: googleProfile.name, avatar_url: googleProfile.picture })
          .eq('id', existing.id)
          .select()
          .single();
        if (linkError) throw linkError;
        return linked;
      }
      return existing;
    }

    const { data: created, error } = await admin
      .from('users')
      .insert({
        google_id: googleProfile.sub,
        email: googleProfile.email,
        name: googleProfile.name,
        avatar_url: googleProfile.picture,
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === '42P01' || String((err as Error)?.message ?? '').includes('does not exist')) {
      throw new Error(
        'The "users" table is missing. Run the SQL migration in supabase/migrations/0001_sync_schema.sql first.'
      );
    }
    throw err;
  }
}