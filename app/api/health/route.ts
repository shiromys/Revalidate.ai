import { createClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient();
    
    // We explicitly type the response to avoid the "any" error
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Next.js is successfully connected to Supabase!',
      profileCount: count ?? 0
    });
    
  } catch (err) {
    // Cast err to Error so TypeScript can read .message
    const error = err as Error;
    return NextResponse.json({ 
      status: 'error', 
      message: 'An unexpected error occurred',
      details: error.message 
    }, { status: 500 });
  }
}