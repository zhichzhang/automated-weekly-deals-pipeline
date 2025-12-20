import { ingestData } from '../ingestData';
import { sendEmails } from '../sendEmails';

async function main() {
    console.log('Starting weekly email workflow...');

    await ingestData();   // Load JSON → upsert users, retailers, products, deals
    await sendEmails();   // Fetch users → fetch deals → render template → send emails

    console.log('Weekly email workflow finished.');
}

// Top‑level error handling
main().catch(err => {
    console.error('Error in weekly email workflow:', err);
});