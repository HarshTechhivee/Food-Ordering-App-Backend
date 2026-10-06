
export interface CreateMenuItemInput {
    name: string;
    description: string;
    price: number;
    image?: string | null;
    category: string;
    isAvailable?: boolean;
}

export interface UpdateMenuItemInput {
    name?: string;
    description?: string;
    price?: number;
    image?: string | null;
    category?: string;
    isAvailable?: boolean; 
}

export interface MenuItemParams {
    id: number;
}

export interface MenuQuery {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    sort: "price_asc" | "price_desc" | "newest";
}