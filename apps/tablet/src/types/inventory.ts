export type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface StoreLocation {
  name: string;
  address: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  vendor: string;
  quantity: number;
  reorderLevel: number;
  cost: number;
  price: number;
  aisle: string;
  notes: string;
  updatedAt: string;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  vendor: string;
  quantity: number;
  reorderLevel: number;
  cost: number;
  price: number;
  aisle: string;
  notes: string;
}

export interface InventoryHookResult {
  products: ProductItem[];
  addProduct: (values: ProductFormValues) => void;
}