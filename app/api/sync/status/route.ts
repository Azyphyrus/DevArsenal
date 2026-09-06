import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const deviceId = req.nextUrl.searchParams.get('deviceId');

  try {
    const logQuery = getSupabaseAdmin()
      .from('sync_logs')
      .select('created_at, error, pushed_snapshots, pulled_rows, device_id')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const query = deviceId ? logQuery.eq('device_id', deviceId) : logQuery;

    const { data: logs } = await query.maybeSingle();
    return NextResponse.json({
      lastSyncAt: logs?.created_at ?? null,
      lastSync: logs ?? null,
    });
  } catch (err) {
    console.error('[sync/status] failed', err);
    return NextResponse.json({ lastSyncAt: null, lastSync: null }, { status: 200 });
  }
}