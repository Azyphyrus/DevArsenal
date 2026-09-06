import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Registers (or refreshes) the current browser as a known device for the user.
 * Failures are non-fatal — the sync engine keeps working without this table.
 */
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { deviceId?: string; deviceName?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const deviceId = body.deviceId?.slice(0, 128);
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: 'missing_device_id' }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from('user_devices')
      .select('id')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing) {
      await admin
        .from('user_devices')
        .update({
          user_id: session.userId,
          device_name: body.deviceName?.slice(0, 128) ?? null,
          last_seen_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId);
    } else {
      await admin.from('user_devices').insert({
        user_id: session.userId,
        device_id: deviceId,
        device_name: body.deviceName?.slice(0, 128) ?? null,
        last_seen_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[sync/device] failed', err);
    return NextResponse.json({ ok: false, error: 'device_register_failed' }, { status: 500 });
  }
}