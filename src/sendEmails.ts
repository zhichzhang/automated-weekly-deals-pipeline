import { supabase } from './db';
import { User } from './types/models';
import Handlebars from 'handlebars';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import juice from 'juice';

dotenv.config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmails() {
    // Fetch all users
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Failed to fetch users:', error);
        return;
    }
    if (!users || users.length === 0) return;

    // Load HTML template
    const templatePath = path.resolve(
        __dirname,
        './assets/temp/email-temp/email-temp.html'
    );
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Load CSS file
    const cssPath = path.resolve(
        __dirname,
        './assets/temp/email-temp/index.css'
    );
    const css = fs.readFileSync(cssPath, 'utf-8');

    // Process each user
    for (const user of users) {
        if (!user.preferred_retailers?.length) continue;

        // Fetch retailer IDs matching user preferences
        const { data: retailerIds, error: retailerError } = await supabase
            .from('retailers')
            .select('id')
            .in('name', user.preferred_retailers);

        if (retailerError || !retailerIds?.length) continue;

        // Fetch top deals for those retailers
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select(`
                id,
                price,
                start_date,
                end_date,
                product:products(name, size),
                retailer:retailers(name)
            `)
            .in('retailer_id', retailerIds.map(r => r.id))
            .order('price', { ascending: true })
            .limit(6);

        if (dealsError || !deals || deals.length === 0) continue;

        // Group deals by retailer name
        const grouped: Record<string, any[]> = {};
        deals.forEach(d => {
            const retailerName = (d as any).retailer.name;
            if (!grouped[retailerName]) grouped[retailerName] = [];
            grouped[retailerName].push({
                product: (d as any).product.name,
                size: (d as any).product.size,
                price: d.price,
                start_date: d.start_date,
                end_date: d.end_date
            });
        });

        // Render HTML with Handlebars
        const rawHtml = template({
            retailers: Object.entries(grouped).map(([name, deals]) => ({
                name,
                deals
            }))
        });

        // Inline CSS into HTML (critical for email clients)
        const finalHtml = juice.inlineContent(rawHtml, css);

        // Send email
        try {
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: user.email,
                subject: 'Your Weekly Deals',
                html: finalHtml,
                text:
                    'Your weekly Prox deals are ready. Please view this email in an HTML-capable email client.'
            });

            console.log(`Sent email to ${user.email}`);
        } catch (err) {
            console.error(`Failed to send email to ${user.email}`, err);
        }
    }
}