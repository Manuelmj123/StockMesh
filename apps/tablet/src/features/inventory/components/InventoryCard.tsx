import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InventoryCardItem } from '../../../types/inventory';

interface InventoryCardProps {
  item: InventoryCardItem;
}

function getStockStatus(quantityOnHand: number) {
  if (quantityOnHand <= 0) {
    return {
      label: 'Out of Stock',
      accentColor: '#F87171',
      accentBg: '#1C0A0A',
      accentBorder: '#7F1D1D',
      dotColor: '#F87171',
    };
  }

  if (quantityOnHand <= 5) {
    return {
      label: 'Low Stock',
      accentColor: '#FB923C',
      accentBg: '#1C1008',
      accentBorder: '#7C2D12',
      dotColor: '#FB923C',
    };
  }

  return {
    label: 'In Stock',
    accentColor: '#34D399',
    accentBg: '#0A1C13',
    accentBorder: '#134726',
    dotColor: '#34D399',
  };
}

function stockBarWidth(quantityOnHand: number): number {
  if (quantityOnHand <= 0) {
    return 0;
  }

  const maxVisualQuantity = 25;
  return Math.min(1, quantityOnHand / maxVisualQuantity);
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function InventoryCard({ item }: InventoryCardProps) {
  const quantityOnHand = toSafeNumber(item.quantity_on_hand);
  const unitPrice = toSafeNumber(item.unit_price);
  const inventoryValue = quantityOnHand * unitPrice;

  const status = useMemo(() => getStockStatus(quantityOnHand), [quantityOnHand]);
  const barFill = stockBarWidth(quantityOnHand);

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: status.accentColor }]} />

      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.productName}>
            {item.item_name || 'Unnamed Product'}
          </Text>
          <Text numberOfLines={1} style={styles.skuText}>
            {item.sku || 'NO-SKU'}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: status.accentBg,
              borderColor: status.accentBorder,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: status.dotColor }]} />
          <Text style={[styles.statusLabel, { color: status.accentColor }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.stockBarSection}>
        <View style={styles.stockBarTrack}>
          <View
            style={[
              styles.stockBarFill,
              {
                width: `${barFill * 100}%`,
                backgroundColor: status.accentColor,
              },
            ]}
          />
        </View>

        <View style={styles.stockBarLabels}>
          <Text style={styles.stockBarQty}>{quantityOnHand} units</Text>
          <Text style={styles.stockBarReorder}>Store Inventory</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <DataCell label="Unit Price" value={`$${formatCurrency(unitPrice)}`} highlight />
        <DataCell label="Inv. Value" value={`$${formatCurrency(inventoryValue)}`} highlight />
        <DataCell label="Quantity" value={`${quantityOnHand}`} />
        <DataCell label="Record ID" value={`${item.inventory_id ?? '—'}`} />
        <DataCell label="Sync Path" value="Store → Central" />
        <DataCell label="Updated" value={formatUpdatedAt(item.updated_at)} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerVendor}>SymmetricDS Watched Record</Text>
        <Text style={styles.footerUpdated}>Ready for replication</Text>
      </View>
    </View>
  );
}

function DataCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={cellStyles.block}>
      <Text style={cellStyles.label}>{label}</Text>
      <Text
        style={[cellStyles.value, highlight && cellStyles.valueHighlight]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  block: {
    width: '50%',
    paddingRight: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  valueHighlight: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    minHeight: 280,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  skuText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stockBarSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  stockBarTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stockBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  stockBarQty: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4C7',
    fontVariant: ['tabular-nums'],
  },
  stockBarReorder: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginTop: 'auto',
    gap: 12,
  },
  footerVendor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4C7',
    flexShrink: 1,
  },
  footerUpdated: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});