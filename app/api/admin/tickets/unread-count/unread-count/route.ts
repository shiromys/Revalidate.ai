import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET() {
  try {
    const validStatuses = [
      'open', 'OPEN', 'Open',
      'unread', 'UNREAD', 'Unread',
      'pending', 'PENDING', 'Pending',
      'new', 'NEW', 'New'
    ];

    // 1. Try 'support_tickets' table with status filter
    const res1 = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', validStatuses);

    if (!res1.error && typeof res1.count === 'number' && res1.count > 0) {
      return NextResponse.json(
        { unreadCount: res1.count },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    // 2. Fallback: Try 'support_tickets' total count (if status values differ)
    const res1Total = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true });

    if (!res1Total.error && typeof res1Total.count === 'number' && res1Total.count > 0) {
      return NextResponse.json(
        { unreadCount: res1Total.count },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    // 3. Fallback: Try 'tickets' table with status filter
    const res2 = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', validStatuses);

    if (!res2.error && typeof res2.count === 'number' && res2.count > 0) {
      return NextResponse.json(
        { unreadCount: res2.count },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    // 4. Fallback: Try 'tickets' table total count
    const res2Total = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    if (!res2Total.error && typeof res2Total.count === 'number' && res2Total.count > 0) {
      return NextResponse.json(
        { unreadCount: res2Total.count },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      { unreadCount: 0 },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('Error fetching unread tickets count:', err);
    return NextResponse.json({ unreadCount: 0 });
  }
}