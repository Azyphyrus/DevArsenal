import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// TEMPORARY DEBUG ROUTE — remove after diagnosing session-secret issues.
export async function GET() {
  const secret = process.env.SESSION_SECRET || 'dev-insecure-session-secret-change-me';
  const token = await new SignJWT({ userId: 'cbb36dce-788b-434f-983d-d7aec3908af4', email: 'azersagucio@gmail.com' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
  return NextResponse.json({
    token,
    secretLen: secret.length,
    secretHead: secret.slice(0, 4),
    secretTail: secret.slice(-4),
    source: process.env.SESSION_SECRET ? 'env' : 'fallback',
  });
}