import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProductItem } from '../../../types/inventory';

interface InventoryCardProps {
  item: ProductItem;
}

function stockBarWidth(quantity: number, reorderLevel: number): number {
  const max = Math.max(reorderLevel * 3, quantity, 1);
  return Math.min(1, quantity / max);
}

export default function InventoryCard({ item }: InventoryCardProps) {
  const status = useMemo(() => {
    if (item.quantity <= 0) {
      return {
        label: 'Out of Stock',
        accentColor: '#F87171',
        accentBg: '#1C0A0A',
        accentBorder: '#7F1D1D',
        dotColor: '#F87171',
      };
    }

    if (item.quantity <= item.reorderLevel) {
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
  }, [item.quantity, item.reorderLevel]);

  const barFill = stockBarWidth(item.quantity, item.reorderLevel);
  const inventoryValue = item.quantity * item.price;
  const margin = item.price - item.cost;

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: status.accentColor }]} />

      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.productName}>
            {item.name}
          </Text>
          <Text style={styles.skuText}>{item.sku}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: status.accentBg,
              borderColor: status.accentBorder,
            },
          ]}>
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
          {item.reorderLevel > 0 && (
            <View
              style={[
                styles.reorderMarker,
                {
                  left: `${Math.min(
                    99,
                    (item.reorderLevel /
                      Math.max(item.reorderLevel * 3, item.quantity, 1)) *
                      100,
                  )}%`,
                },
              ]}
            />
          )}
        </View>

        <View style={styles.stockBarLabels}>
          <Text style={styles.stockBarQty}>{item.quantity} units</Text>
          <Text style={styles.stockBarReorder}>
            Reorder @ {item.reorderLevel}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <DataCell label="Category" value={item.category} />
        <DataCell label="Unit Price" value={`$${item.price.toFixed(2)}`} highlight />
        <DataCell label="Unit Cost" value={`$${item.cost?.toFixed(2) ?? '—'}`} />
        <DataCell
          label="Margin"
          value={`$${margin.toFixed(2)}`}
          highlight
          positive={margin > 0}
        />
        <DataCell
          label="Inv. Value"
          value={`$${inventoryValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
        <DataCell label="Aisle" value={item.aisle} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerVendor}>{item.vendor}</Text>
        <Text style={styles.footerUpdated}>{item.updatedAt}</Text>
      </View>
    </View>
  );
}

function DataCell({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <View style={cellStyles.block}>
      <Text style={cellStyles.label}>{label}</Text>
      <Text
        style={[
          cellStyles.value,
          highlight && cellStyles.valueHighlight,
          positive === true && cellStyles.valuePositive,
          positive === false && cellStyles.valueNegative,
        ]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  block: {
    width: '33.33%',
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
  valuePositive: {
    color: '#34D399',
  },
  valueNegative: {
    color: '#F87171',
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
    gap: 0,
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
    overflow: 'visible',
    marginBottom: 6,
    position: 'relative',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  reorderMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 10,
    backgroundColor: '#94A3B8',
    borderRadius: 1,
  },
  stockBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: -4,
  },
  footerVendor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4C7',
  },
  footerUpdated: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});