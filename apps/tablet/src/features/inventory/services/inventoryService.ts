import { Platform } from 'react-native';

export type CreateInventoryItemRequest = {
  sku: string;
  itemName: string;
  quantityOnHand: number;
  unitPrice: number;
};

export type InventoryItemResponse = {
  inventory_id: number;
  sku: string;
  item_name: string;
  quantity_on_hand: number;
  unit_price: string;
  updated_at: string;
};

type CreateInventoryApiResponse = {
  success: boolean;
  data: InventoryItemResponse | InventoryItemResponse[];
  count?: number;
  message?: string;
  code?: string | null;
};

type GetInventoryApiResponse = {
  success: boolean;
  count?: number;
  data?: InventoryItemResponse[];
  message?: string;
  code?: string | null;
};

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
}) as string;

async function parseJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || 'Request failed');
  }

  return json as T;
}

export async function createInventoryItem(
  payload: CreateInventoryItemRequest,
): Promise<InventoryItemResponse> {
  const response = await fetch(`${API_BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await parseJsonSafely(response)) as CreateInventoryApiResponse | null;

  if (!response.ok) {
    throw new Error(
      result?.message || `Failed to create inventory item. Status: ${response.status}`,
    );
  }

  if (!result?.success || !result.data || Array.isArray(result.data)) {
    throw new Error('Inventory API returned an unexpected response.');
  }

  return result.data;
}

export async function createInventoryItems(
  payload: CreateInventoryItemRequest[],
): Promise<InventoryItemResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await parseJsonSafely(response)) as CreateInventoryApiResponse | null;

  if (!response.ok) {
    throw new Error(
      result?.message || `Failed to create inventory items. Status: ${response.status}`,
    );
  }

  if (!result?.success || !result.data) {
    throw new Error('Inventory API returned an unexpected response.');
  }

  return Array.isArray(result.data) ? result.data : [result.data];
}

export async function getInventoryItems(): Promise<InventoryItemResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/inventory`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await parseResponse<GetInventoryApiResponse>(response);
  return Array.isArray(result.data) ? result.data : [];
}