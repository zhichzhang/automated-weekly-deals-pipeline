import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using env variables
export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

// export const supabase = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_PUBLISHABLE_KEY!
// );

// Simple sanity checks for environment variables
console.log('Supabase URL:', process.env.SUPABASE_URL ? 'loaded' : 'missing');
console.log('Supabase Service Role Key:', process.env.SUPABASE_SECRET_KEY ? 'loaded' : 'missing');
// console.log('Supabase Publishable Key:', process.env.SUPABASE_PUBLISHABLE_KEY ? 'loaded' : 'missing');