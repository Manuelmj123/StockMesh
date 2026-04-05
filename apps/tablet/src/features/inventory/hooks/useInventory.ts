import { useMemo, useState } from 'react';
import {
  InventoryHookResult,
  ProductFormValues,
  ProductItem,
} from '../../../types/inventory';

function buildProductFromForm(values: ProductFormValues): ProductItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    sku: values.sku,
    name: values.name,
    category: values.category,
    vendor: values.vendor,
    quantity: values.quantity,
    reorderLevel: values.reorderLevel,
    cost: values.cost,
    price: values.price,
    aisle: values.aisle,
    notes: values.notes,
    updatedAt: new Date().toISOString(),
  };
}

function sortProducts(products: ProductItem[]) {
  return [...products].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
}

export function useInventory(initialProducts: ProductItem[]): InventoryHookResult {
  const [products, setProducts] = useState<ProductItem[]>(() =>
    sortProducts(initialProducts),
  );

  const value = useMemo<InventoryHookResult>(() => {
    return {
      products,
      addProduct: (formValues: ProductFormValues) => {
        const nextProduct = buildProductFromForm(formValues);

        setProducts(currentProducts => {
          return sortProducts([nextProduct, ...currentProducts]);
        });
      },
    };
  }, [products]);

  return value;
}