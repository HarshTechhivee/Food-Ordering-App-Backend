export type CreateReviewBody = {
    rating: number;
    comment?: string | null;
};

export type UpdateReviewBody = {
    rating?: number;
    comment?: string | null;
};

export type OrderParams = {
    orderId: number;
};

export type MenuItemParams = {
    menuItemId: number;
};

export type ReviewParams = {
    reviewId: number;
};

export type PaginationQuery = {
    page: number;
    limit: number;
};