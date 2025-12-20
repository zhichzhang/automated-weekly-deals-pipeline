// Retailer record stored in the database
export interface Retailer {
    id?: number;      // Supabase-generated ID
    name: string;     // Retailer name (unique)
}

// Product record stored in the database
export interface Product {
    id?: number;
    name: string;     // Product name
    size: string;     // e.g., "12oz", "1L"
    category: string; // e.g., "beverage", "snack"
}

// Deal record stored in the database
export interface Deal {
    id?: number;
    retailer_id: number; // FK → retailers.id
    product_id: number;  // FK → products.id
    price: number;
    start_date: string;
    end_date: string;
}

// User record stored in the database
export interface User {
    id?: number;
    name: string;
    email: string;
    preferred_retailers: string[]; // List of retailer names
}

// Raw JSON input format before normalization
export interface DealJSON {
    retailer: string;
    product: string;
    size: string;
    price: number;
    start: string;
    end: string;
    category: string;
}