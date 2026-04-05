export type StoreLocation = {
  id: string;
  name: string;
  address: string;
};

export type ProductFormValues = {
  sku: string;
  itemName: string;
  quantityOnHand: number;
  unitPrice: number;
};

export type InventoryCardItem = {
  inventory_id: number;
  sku: string;
  item_name: string;
  quantity_on_hand: number;
  unit_price: string;
  updated_at: string;
};