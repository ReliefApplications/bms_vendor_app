import { Product } from './product';

export class ChosenProduct {
    static __classname__ = 'ChosenProduct';
    product: Product;
    quantity: number;
    price: number;
    subTotal: number;
    currency: string;
}
