export type StockStatus = "in_stock" | "limited" | "out_of_stock";

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string;
  categoryId: string;
  stockStatus: StockStatus;
  isFeatured: boolean;
};

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  unit: string;
  imageUrl: string;
  quantity: number;
};
