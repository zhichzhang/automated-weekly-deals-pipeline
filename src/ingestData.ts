import { supabase } from './db';
import { DealJSON, User } from './types/models';
import dealsDataRaw from './assets/data/sample-deal-data.json';
import usersDataRaw from './assets/data/test-user-data.json';

// Load JSON as typed arrays
const dealsData: DealJSON[] = dealsDataRaw as any;
const usersData: User[] = usersDataRaw as any;

// Insert or update users (email = unique key)
async function ingestUsers(users: User[]) {
    const { error } = await supabase
        .from('users')
        .upsert(
            users.map(u => ({
                name: u.name,
                email: u.email,
                preferred_retailers: u.preferred_retailers
            })),
            { onConflict: 'email' }
        );

    if (error) console.error('Failed to ingest users:', error);
}

// Cache to avoid repeated DB lookups
const retailerMap = new Map<string, string>();
const productMap = new Map<string, string>();

async function ingestDeals(dealsData: DealJSON[]) {
    for (const deal of dealsData) {

        // Ensure retailer exists
        let retailerId = retailerMap.get(deal.retailer);
        if (!retailerId) {
            let { data: retailerData } = await supabase
                .from('retailers')
                .select('id')
                .eq('name', deal.retailer)
                .single();

            retailerId = retailerData?.id;

            if (!retailerId) {
                const { data: newRetailer } = await supabase
                    .from('retailers')
                    .insert({ name: deal.retailer })
                    .select('id')
                    .single();
                retailerId = newRetailer?.id;
            }

            retailerMap.set(deal.retailer, retailerId!);
        }

        // Ensure product exists
        const productKey = `${deal.product}|${deal.size}`;
        let productId = productMap.get(productKey);

        if (!productId) {
            let { data: productData } = await supabase
                .from('products')
                .select('id')
                .eq('name', deal.product)
                .eq('size', deal.size)
                .single();

            productId = productData?.id;

            if (!productId) {
                const { data: newProduct } = await supabase
                    .from('products')
                    .insert({
                        name: deal.product,
                        size: deal.size,
                        category: deal.category
                    })
                    .select('id')
                    .single();

                productId = newProduct?.id;
            }

            productMap.set(productKey, productId!);
        }

        // Skip deals no user cares about
        const interestedUsers = usersData.filter(u =>
            u.preferred_retailers.includes(deal.retailer)
        );
        if (interestedUsers.length === 0) continue;

        // Insert or update deal
        const { error } = await supabase
            .from('deals')
            .upsert(
                [{
                    retailer_id: retailerId,
                    product_id: productId,
                    price: deal.price,
                    start_date: deal.start,
                    end_date: deal.end
                }],
                { onConflict: 'retailer_id,product_id,start_date' }
            );

        if (error) console.error('Failed to insert deal:', error);
    }
}

// Entry point
export async function ingestData() {
    await ingestUsers(usersData);
    await ingestDeals(dealsData);
}