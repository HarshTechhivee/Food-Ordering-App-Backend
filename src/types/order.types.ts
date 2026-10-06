export interface CreateOrderItemInput {
    menuItemId: number;
    quantity: number;
}

export interface CreateOrderInput {
    items: CreateOrderItemInput[];
}

export type UpdateOrderStatusInput = {
  status:
    | "APPROVED"
    | "REJECTED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED";
};