# Automated Weekly Deals Pipeline
## Automated Data Ingestion + Personalized Email Delivery (Supabase + Node.js)
This project implements a full workflow that:
- Ingests product deals and user preferences from JSON files
- Normalizes and upserts the data into a Supabase Postgres database
- Generates personalized weekly deal emails using Handlebars templates
- Sends emails to users via the Resend API
  It is designed for scheduled weekly execution (e.g., via cron, GitHub Actions, or Supabase Edge Functions).

## Features
1. Data Ingestion
- Imports users, retailers, products, and deals from JSON files
- Deduplicates retailers/products using in‑memory maps
- Ensures idempotent inserts using Supabase upsert
- Automatically links deals to users based on preferred retailers
2. Email Generation
- Fetches relevant deals per user
- Groups deals by retailer
- Renders HTML using Handlebars templates
- Sends emails via Resend
3. Database Integration
- Fully typed with TypeScript interfaces
- Uses Supabase Postgres with foreign keys and unique constraints
- Clean schema for users, retailers, products, and deals

## Project Source Code Structure
```angular2html
src/
├── db.ts 
├── ingestData.ts 
├── sendEmails.ts 
├── assets/ 
│   ├── data/ 
│   │   ├── sample-deal-data.json
│   │   └── test-user-data.json
│   └── temp/
│       └── email-temp/
│           ├── email-temp.html
│           └── index.css
├── cli/
│   └── sendWeekly.ts 
└── types 
    └── models.ts
```
## Database Schema (Supabase)

### **users**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, defaults to `gen_random_uuid()` |
| name | text | User name |
| email | text | User email, unique and required |
| preferred_retailers | text[] | List of preferred retailer names |

### **retailers**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, defaults to `gen_random_uuid()` |
| name | text | Retailer name, unique |

### **products**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, defaults to `gen_random_uuid()` |
| name | text | Product name (required) |
| size | text | Product size (e.g., 12oz, 1L) |
| category | text | Product category (e.g., beverage, snack) |

### **deals**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, defaults to `gen_random_uuid()` |
| retailer_id | uuid | Foreign key → `retailers.id` |
| product_id | uuid | Foreign key → `products.id` |
| price | numeric(10,2) | Deal price |
| start_date | date | Deal start date |
| end_date | date | Deal end date |
| created_at | timestamp | Defaults to `now()` |
| UNIQUE(retailer_id, product_id, start_date) | constraint | Prevents inserting duplicate deals |

### Row Level Security (RLS)
This project uses Supabase Row Level Security (RLS) to protect all database tables.
The rules are simple:
- `users`:
  Users can only view and update their own profile.
- `deals`:
  Users can only see deals from their preferred retailers.
  Only the backend (using the service‑role key) can insert, update, or delete deals.
- `products` and `retailers`:
  Publicly readable, but only the backend can modify them.
  All write operations in this project are performed through backend scripts using the service‑role key, ensuring full security while keeping the frontend read‑only.

## Workflow Overflow
### ingestData()
- Upsert users
- For each deal in JSON:
- Ensure retailer exists
- Ensure product exists
- Insert deal (idempotent)
- Only insert deals relevant to at least one user
  Uses in‑memory maps to avoid redundant DB lookups.
### sendEmails()
- Fetch all users
- For each user:
  - Resolve preferred retailers → retailer IDs
  - Fetch top 6 cheapest deals 
  - Group deals by retailer
  - Render HTML via Handlebars
  - Send email via Resend

## Environment Variables
Create a `.env` file in the root folder:
```angular2html
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
RESEND_API_KEY=your_resend_api_key
```
## Running the Workflow
### Installation
```angular2html
npm install
```
### Run the full weekly workflow
Executes the ingestion pipeline + email sending:
```angular2html
npm run send:weekly
```
This runs:
```angular2html
npx ts-node src/cli/sendWeekly.ts
```
Which internally calls:
1. ingestData()
2. sendEmails()

```
## Sample Data
These files allow you to test ingestion and email generation without external sources.
```angular2html
assets/data/sample-deal-data.json
assets/data/test-user-data.json
```
## TypeScript Models
Defined in types/models.ts
Includes:
- User
- Retailer
- Product
- Deal
- DealJSON (raw ingestion format)

## Email Template
```angular2html
assets/temp/email-temp.html
```
## Summary
This project provides a complete, production‑ready pipeline for:
- Importing structured deal data
- Normalizing and storing it in Supabase
- Generating personalized weekly emails
- Sending them via Resend
- It is modular, typed, idempotent, and easy to extend.

## If Given 2 More Days — What I’d Build Next
1. Production‑Ready Scheduling & Automation
- Set up a reliable weekly trigger using:
- GitHub Actions
- Supabase Scheduled Functions
- or a lightweight cron job on a server
- Add logging + alerting so failures are surfaced immediately.
2. Admin Dashboard (Minimal Viable UI)
   A small web interface to:
- Upload new deal data
- View ingestion logs
- Preview the next email batch
- Trigger manual re‑runs
  This dramatically improves maintainability.
3. Improved Email Personalization
   Enhance the email content with:
- User‑specific product categories
- “New this week” vs “Returning deals”
- Better grouping + sorting logic
- Optional unsubscribe / preference center
4. Data Quality & Validation Layer
     Before ingestion:
- Validate JSON structure
- Detect duplicate deals
- Normalize retailer/product names
- Add warnings for missing fields
  This prevents bad data from polluting the database.
5. Optional: Move to Real‑Time Deal Sources
   If time allows:
- Add ingestion from APIs instead of static JSON
- Support multiple data providers
- Add a queue-based ingestion pipeline (e.g., using Supabase Functions)




