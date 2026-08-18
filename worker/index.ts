import { createClient } from '@supabase/supabase-js';
import { GreylistValidator } from './smtp-validator';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load your environment variables from your Next.js project
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Supabase (Use your SERVICE_ROLE key here so the worker has admin access to update rows)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // NOT the anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize our new Anti-Greylisting Engine
const validator = new GreylistValidator();

async function startWorker() {
    console.log("🚀 Email Validation Worker started. Waiting for jobs...");

    // Infinite loop so the worker runs 24/7 in the background
    while (true) {
        try {
            // 1. Check database for any jobs marked 'PENDING'
            const { data: jobs, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'PENDING')
                .limit(1);

            if (error) throw error;

            if (jobs && jobs.length > 0) {
                const job = jobs[0];
                console.log(`\n📦 Found pending job: ${job.id}. Starting processing...`);

                // 2. Mark job as 'PROCESSING' so we don't grab it twice
                await supabase.from('jobs').update({ status: 'PROCESSING' }).eq('id', job.id);

                // ====================================================================
                // 3. THIS IS WHERE YOU FETCH THE EMAILS FOR THE JOB
                // (E.g., Fetching the list of emails from Redis or Supabase)
                // For demonstration, let's pretend we pulled these two emails:
                const emailsToValidate = ['test@gmail.com', 'admin@example.com']; 
                // ====================================================================

                // 4. Feed emails into our Anti-Greylisting Engine
                for (const email of emailsToValidate) {
                    console.log(`Verifying: ${email}...`);
                    
                    // The validator handles all the retries, greylisting, and MX checks automatically!
                    const result = await validator.validateEmail(email); 
                    
                    console.log(`Result for ${email}:`, result);
                    
                    // TODO: Save this specific result back to Redis/Supabase
                }

                // 5. Mark the overall job as 'COMPLETED'
                await supabase.from('jobs').update({ status: 'COMPLETED' }).eq('id', job.id);
                console.log(`✅ Job ${job.id} finished successfully!`);
            }

        } catch (err) {
            console.error("Worker encountered an error:", err);
        }

        // Wait 3 seconds before checking the database for new jobs again
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

// Start the loop
startWorker();