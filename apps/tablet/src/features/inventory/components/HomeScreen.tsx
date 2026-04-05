import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import InventoryCard from './InventoryCard';
import PaginationControls from './PaginationControls';
import { InventoryCardItem, StoreLocation } from '../../../types/inventory';
import { getInventoryItems, InventoryItemResponse } from '../services/inventoryService';

type InventoryState = {
  products: InventoryCardItem[];
};

type HomeScreenProps = {
  location: StoreLocation;
  inventoryState: InventoryState;
  onAddPress: () => void;
};

const PAGE_SIZE = 6;

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

function normalizeInventoryItem(item: InventoryItemResponse): InventoryCardItem {
  return {
    inventory_id: Number(item.inventory_id ?? 0),
    sku: String(item.sku ?? ''),
    item_name: String(item.item_name ?? ''),
    quantity_on_hand: Number(item.quantity_on_hand ?? 0),
    unit_price: String(item.unit_price ?? '0.00'),
    updated_at: String(item.updated_at ?? ''),
  };
}

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  alert?: boolean;
};

function StatCard({ label, value, sub, accent, alert }: StatCardProps) {
  const valueColor = alert ? '#F87171' : accent ? '#F59E0B' : '#F8FAFC';
  const borderColor = alert ? '#7F1D1D' : accent ? '#78350F' : '#1E293B';
  const bgColor = alert ? '#1C0A0A' : accent ? '#1C1409' : '#0F172A';

  return (
    <View style={[statStyles.card, { borderColor, backgroundColor: bgColor }]}>
      {(accent || alert) && (
        <View style={[statStyles.topBar, { backgroundColor: alert ? '#F87171' : '#F59E0B' }]} />
      )}
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
      <Text style={statStyles.sub}>{sub}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    minWidth: 0,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
  },
  sub: {
    fontSize: 11,
    color: '#A5B4C7',
    fontWeight: '500',
    lineHeight: 15,
  },
});

type SearchBarProps = {
  value: string;
  onChangeText: (t: string) => void;
  resultCount: number;
};

function SearchBar({ value, onChangeText, resultCount }: SearchBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E293B', '#F59E0B'],
  });

  return (
    <Animated.View style={[searchStyles.shell, { borderColor }]}>
      <Text style={searchStyles.icon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search by item name or SKU…"
        placeholderTextColor="#64748B"
        style={searchStyles.input}
      />
      {value.length > 0 && (
        <View style={searchStyles.badge}>
          <Text style={searchStyles.badgeText}>{resultCount}</Text>
        </View>
      )}
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} style={searchStyles.clearBtn}>
          <Text style={searchStyles.clearText}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const searchStyles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 10,
  },
  icon: {
    fontSize: 20,
    color: '#94A3B8',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    paddingVertical: 14,
  },
  badge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#080D17',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '700',
  },
});

function SectionHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={secStyles.row}>
      <View style={secStyles.left}>
        <Text style={secStyles.title}>{title}</Text>
        {sub && <Text style={secStyles.sub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 2,
  },
  sub: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
});

export default function HomeScreen({ location, inventoryState, onAddPress }: HomeScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'low'>('all');
  const [products, setProducts] = useState<InventoryCardItem[]>(inventoryState.products ?? []);
  const [isLoading, setIsLoading] = useState((inventoryState.products ?? []).length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadInventory = useCallback(
    async (showRefreshSpinner = false) => {
      try {
        setLoadError('');

        if (showRefreshSpinner) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const records = await getInventoryItems();
        const normalized = records.map(normalizeInventoryItem);
        setProducts(normalized);
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to load inventory from the API.';

        setLoadError(message);

        if ((inventoryState.products ?? []).length === 0) {
          setProducts([]);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [inventoryState.products],
  );

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    if ((inventoryState.products ?? []).length > 0) {
      setProducts(inventoryState.products);
    }
  }, [inventoryState.products]);

  const baseInventory = useMemo((): InventoryCardItem[] => {
    if (activeFilter === 'low') {
      return products.filter((item: InventoryCardItem) => item.quantity_on_hand <= 5);
    }

    return products;
  }, [products, activeFilter]);

  const filteredInventory = useMemo((): InventoryCardItem[] => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return baseInventory;
    }

    return baseInventory.filter((item: InventoryCardItem) => {
      return (
        item.item_name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
      );
    });
  }, [baseInventory, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedInventory = useMemo((): InventoryCardItem[] => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredInventory.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredInventory]);

  const cardRows = useMemo(() => {
    const rows: InventoryCardItem[][] = [];

    for (let index = 0; index < pagedInventory.length; index += 2) {
      rows.push(pagedInventory.slice(index, index + 2));
    }

    return rows;
  }, [pagedInventory]);

  const totalUnits = useMemo(
    () =>
      products.reduce(
        (sum: number, item: InventoryCardItem) => sum + Number(item.quantity_on_hand || 0),
        0,
      ),
    [products],
  );

  const totalInventoryValue = useMemo(
    () =>
      products.reduce(
        (sum: number, item: InventoryCardItem) =>
          sum + Number(item.quantity_on_hand || 0) * Number(item.unit_price || 0),
        0,
      ),
    [products],
  );

  const lowStockCount = useMemo(
    () => products.filter((item: InventoryCardItem) => Number(item.quantity_on_hand || 0) <= 5).length,
    [products],
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleFilter = (filter: 'all' | 'low') => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleRetry = async () => {
    try {
      await loadInventory();
    } catch {
      Alert.alert('Inventory Error', 'Unable to reload inventory right now.');
    }
  };

  const showInitialLoader = isLoading && products.length === 0;
  const showEmptyState = !showInitialLoader && filteredInventory.length === 0;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoChar}>▦</Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>Inventory Dashboard</Text>
            <Text style={styles.locationName}>{location.name}</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live</Text>
          </View>
          <Text numberOfLines={1} style={styles.locationAddr}>
            {location.address}
          </Text>
          <Pressable style={styles.addBtn} onPress={onAddPress}>
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Add Product</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadInventory(true)}
            tintColor="#F59E0B"
          />
        }
      >
        <View style={styles.statsStrip}>
          <StatCard
            label="Total Products"
            value={`${products.length}`}
            sub="Unique SKUs tracked"
          />
          <StatCard
            label="Total Units"
            value={`${totalUnits.toLocaleString()}`}
            sub="Combined stock qty"
          />
          <StatCard
            label="Inventory Value"
            value={formatCompact(totalInventoryValue)}
            sub="Estimated retail value"
            accent
          />
          <StatCard
            label="Low Stock"
            value={`${lowStockCount}`}
            sub="5 units or less"
            alert={lowStockCount > 0}
          />
        </View>

        <View style={styles.controlRow}>
          <View style={styles.searchWrap}>
            <SearchBar
              value={searchTerm}
              onChangeText={handleSearch}
              resultCount={filteredInventory.length}
            />
          </View>

          <View style={styles.filterGroup}>
            <Pressable
              style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]}
              onPress={() => handleFilter('all')}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  activeFilter === 'all' && styles.filterBtnTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterBtn, activeFilter === 'low' && styles.filterBtnAlertActive]}
              onPress={() => handleFilter('low')}
            >
              <View
                style={[styles.filterDot, activeFilter === 'low' && styles.filterDotActive]}
              />
              <Text
                style={[
                  styles.filterBtnText,
                  activeFilter === 'low' && styles.filterBtnAlertText,
                ]}
              >
                Low Stock
              </Text>
              {lowStockCount > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{lowStockCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorBanner}>
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Unable to refresh live inventory</Text>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.listPanel}>
          <SectionHeader
            title="Current Inventory"
            sub={`${filteredInventory.length} item${filteredInventory.length !== 1 ? 's' : ''}${
              searchTerm ? ' matching search' : ''
            }`}
            right={
              <Text style={styles.pageIndicator}>
                Page {currentPage} / {totalPages}
              </Text>
            }
          />

          {showInitialLoader ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingTitle}>Loading live inventory</Text>
              <Text style={styles.loadingSub}>Pulling products directly from the store database.</Text>
            </View>
          ) : showEmptyState ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>◫</Text>
              <Text style={styles.emptyTitle}>
                {searchTerm ? 'No results found' : 'No inventory yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchTerm
                  ? 'Try adjusting your search or filter.'
                  : 'Tap "Add Product" to add your first item.'}
              </Text>
              {!searchTerm && (
                <Pressable style={styles.emptyAddBtn} onPress={onAddPress}>
                  <Text style={styles.emptyAddBtnText}>+ Add Product</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              <View style={styles.listContent}>
                {cardRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.columnWrapper}>
                    {row.map((item: InventoryCardItem) => (
                      <View key={String(item.inventory_id)} style={styles.cardSlot}>
                        <InventoryCard item={item} />
                      </View>
                    ))}
                    {row.length === 1 ? <View style={styles.cardSlot} /> : null}
                  </View>
                ))}
              </View>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredInventory.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080D17',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#080D17',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 1,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoChar: {
    fontSize: 20,
    fontWeight: '900',
    color: '#080D17',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 3,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F2A1A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#134726',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#86EFAC',
  },
  locationAddr: {
    fontSize: 13,
    color: '#A5B4C7',
    fontWeight: '500',
    maxWidth: 260,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addBtnIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#080D17',
    marginTop: -1,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#080D17',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchWrap: {
    flex: 1,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  filterBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#1C1409',
  },
  filterBtnAlertActive: {
    borderColor: '#F87171',
    backgroundColor: '#1C0A0A',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  filterDotActive: {
    backgroundColor: '#F87171',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  filterBtnTextActive: {
    color: '#F59E0B',
  },
  filterBtnAlertText: {
    color: '#FCA5A5',
  },
  alertBadge: {
    backgroundColor: '#F87171',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#080D17',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: '#1C0A0A',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FECACA',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#F87171',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080D17',
  },
  listPanel: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 22,
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A5B4C7',
    fontVariant: ['tabular-nums'],
  },
  loadingState: {
    paddingVertical: 52,
    alignItems: 'center',
    gap: 10,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E8F0',
    marginTop: 8,
  },
  loadingSub: {
    fontSize: 14,
    color: '#A5B4C7',
    fontWeight: '500',
    textAlign: 'center',
  },
  listContent: {
    gap: 14,
    paddingBottom: 4,
  },
  columnWrapper: {
    flexDirection: 'row',
    gap: 14,
  },
  cardSlot: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#64748B',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  emptySub: {
    fontSize: 14,
    color: '#A5B4C7',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyAddBtn: {
    marginTop: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#080D17',
  },
});