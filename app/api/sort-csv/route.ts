import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/server';

type CsvRow = Record<string, string>;

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const mode = formData.get('mode') as string || 'basic';

        if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });

        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        let data = parsed.data as CsvRow[];
        const totalRows = data.length;

        if (totalRows === 0) return NextResponse.json({ error: 'CSV file is empty.' }, { status: 400 });

        const fields = parsed.meta.fields?.map(f => f.toLowerCase()) || [];
        if (!fields.includes('status') || !fields.includes('email')) {
            return NextResponse.json({ error: 'Invalid format: Missing "email" or "status" column.' }, { status: 400 });
        }

        const statusKey = parsed.meta.fields?.find(f => f.toLowerCase() === 'status') as string;
        const emailKey = parsed.meta.fields?.find(f => f.toLowerCase() === 'email') as string;

        // --- BILLING ENGINE ---
        const { data: profile } = await supabase
            .from('profiles')
            .select('monthly_basic_used, wallet_credits')
            .eq('id', user.id)
            .single();

        if (!profile) return NextResponse.json({ error: 'User profile not found.' }, { status: 400 });

        const basicUsed = profile.monthly_basic_used || 0;
        const walletCredits = profile.wallet_credits || 0;
        const freeCreditsAvailable = Math.max(0, 100 - basicUsed);

        let isPartial = false;
        let rowsToProcess = totalRows;

        if (mode === 'basic') {
            if (freeCreditsAvailable <= 0) {
                return NextResponse.json({ 
                    error: 'Your basic free tier limit is crossed. Please select Full Validation to continue.' 
                }, { status: 402 });
            }

            if (totalRows > freeCreditsAvailable) {
                isPartial = true;
                rowsToProcess = freeCreditsAvailable;
                data = data.slice(0, rowsToProcess);
            }

            const { error: updateError } = await supabase.from('profiles')
                .update({ monthly_basic_used: basicUsed + rowsToProcess })
                .eq('id', user.id);
            if (updateError) throw updateError;

        } else {
            if (walletCredits < totalRows) {
                return NextResponse.json({ error: `Insufficient wallet credits. You need ${totalRows} credits.` }, { status: 402 });
            }

            const { error: updateError } = await supabase.from('profiles')
                .update({ wallet_credits: walletCredits - totalRows })
                .eq('id', user.id);
            if (updateError) throw updateError;
        }

        // --- SMART DEDUPLICATION & SORTING ENGINE ---
        const softBounce: CsvRow[] = [];
        const hardBounce: CsvRow[] = [];
        const duplicate: CsvRow[] = [];
        const valid: CsvRow[] = [];
        const others: CsvRow[] = [];

        const seenEmails = new Set<string>();

        data.forEach((row) => {
            const emailAddress = String(row[emailKey] || '').toLowerCase().trim();
            const originalStatus = String(row[statusKey] || '').toLowerCase().trim();

            // 1. If it's an explicit bounce, sort it immediately
            if (originalStatus === 'soft bounce') {
                softBounce.push(row);
                seenEmails.add(emailAddress); // Mark seen so duplicates of bounces don't show up as valid
            } else if (originalStatus === 'hard bounce') {
                hardBounce.push(row);
                seenEmails.add(emailAddress);
            } 
            // 2. For non-bouncing emails (valid, duplicate, etc.)
            else {
                if (seenEmails.has(emailAddress)) {
                    // This is a repeating instance -> strictly flag as duplicate
                    row[statusKey] = 'duplicate';
                    duplicate.push(row);
                } else {
                    // This is the FIRST instance of a unique non-bouncing email -> Treat as Valid!
                    seenEmails.add(emailAddress);
                    row[statusKey] = 'valid';
                    valid.push(row);
                }
            }
        });

        const finalData = [...softBounce, ...hardBounce, ...duplicate, ...valid, ...others];

        return NextResponse.json({
            success: true,
            isPartial,
            processedCount: rowsToProcess,
            totalCount: totalRows,
            counts: {
                softBounce: softBounce.length,
                hardBounce: hardBounce.length,
                duplicate: duplicate.length,
                valid: valid.length, // Reflects unique valid instances
                total: finalData.length
            },
            sortedData: finalData,
            statusColumnName: statusKey
        });

    } catch (error) {
        console.error("CSV Sorting Error:", error);
        return NextResponse.json({ error: 'Failed to process the CSV file.' }, { status: 500 });
    }
}