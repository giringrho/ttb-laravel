export type OrderData = {
    order_number: string;
    sku: string;
    qty: number;
    price: number;
};

export type Order = {
    data: OrderData;
    error: string[];
}[];