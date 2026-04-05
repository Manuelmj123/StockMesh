import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { ProductFormValues, StoreLocation } from '../../../types/inventory';

type AddProductScreenProps = {
  location: StoreLocation;
  onCancel: () => void;
  onSave: (values: ProductFormValues) => void;
};

function sanitizeCurrency(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
}

function sanitizeWholeNumber(value: string) {
  return value.replace(/[^\d]/g, '');
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  half?: boolean;
};

function Field({ label, required, children, half }: FieldProps) {
  return (
    <View style={[fieldStyles.wrapper, half && fieldStyles.half]}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {required && <Text style={fieldStyles.required}>REQUIRED</Text>}
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 20,
  },
  half: {
    width: '50%',
    paddingRight: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#A5B4C7',
  },
  required: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#F59E0B',
  },
});

type StyledInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  prefix?: string;
};

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize,
  multiline,
  prefix,
}: StyledInputProps) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#334155', '#F59E0B'],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0F172A', '#111827'],
  });

  return (
    <Animated.View
      style={[
        inputStyles.shell,
        { borderColor, backgroundColor: bgColor },
        multiline && inputStyles.multilineShell,
      ]}>
      {prefix && <Text style={inputStyles.prefix}>{prefix}</Text>}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#6B7A90"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[
          inputStyles.input,
          prefix && inputStyles.inputWithPrefix,
          multiline && inputStyles.multilineInput,
        ]}
      />

      {focused && <View style={inputStyles.focusAccent} />}
    </Animated.View>
  );
}

const inputStyles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 52,
  },
  multilineShell: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  prefix: {
    paddingLeft: 14,
    paddingRight: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    fontVariant: ['tabular-nums'],
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  inputWithPrefix: {
    paddingLeft: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  focusAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#F59E0B',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
});

type StatTileProps = {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  neutral?: boolean;
};

function StatTile({ label, value, accent, positive, neutral }: StatTileProps) {
  const valueColor = accent
    ? '#F59E0B'
    : positive
      ? '#34D399'
      : neutral
        ? '#D7E1ED'
        : '#F8FAFC';

  return (
    <View style={tileStyles.tile}>
      <Text style={tileStyles.label}>{label}</Text>
      <Text style={[tileStyles.value, { color: valueColor }]}>{value}</Text>
      {accent && <View style={tileStyles.accentBar} />}
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    width: '50%',
    paddingRight: 12,
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#A5B4C7',
    marginBottom: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  accentBar: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    width: 28,
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
});

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.badge}>
        <Text style={sectionStyles.badgeText}>{number}</Text>
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#CBD5E1',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
});

export default function AddProductScreen({
  location,
  onCancel,
  onSave,
}: AddProductScreenProps) {
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [aisle, setAisle] = useState('');
  const [notes, setNotes] = useState('');

  const quantityValue = useMemo(() => toInteger(quantity), [quantity]);
  const reorderLevelValue = useMemo(() => toInteger(reorderLevel), [reorderLevel]);
  const costValue = useMemo(() => toNumber(cost), [cost]);
  const priceValue = useMemo(() => toNumber(price), [price]);
  const inventoryValue = useMemo(
    () => quantityValue * priceValue,
    [quantityValue, priceValue],
  );
  const marginValue = useMemo(
    () => priceValue - costValue,
    [priceValue, costValue],
  );
  const marginPct = useMemo(
    () => (priceValue > 0 ? (marginValue / priceValue) * 100 : 0),
    [marginValue, priceValue],
  );

  const canSave =
    productName.trim().length > 0 &&
    sku.trim().length > 0 &&
    category.trim().length > 0 &&
    quantityValue > 0 &&
    priceValue > 0;

  const handleSave = () => {
    if (!canSave) {
      Alert.alert('Missing fields', 'Complete all required fields before saving.');
      return;
    }

    onSave({
      name: productName.trim(),
      sku: sku.trim(),
      category: category.trim(),
      vendor: vendor.trim() || 'Internal Vendor',
      quantity: quantityValue,
      reorderLevel: reorderLevelValue,
      cost: costValue,
      price: priceValue,
      aisle: aisle.trim() || 'Main Floor',
      notes: notes.trim(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarTop}>
            <View style={styles.logoMark}>
              <Text style={styles.logoChar}>+</Text>
            </View>
            <Text style={styles.sidebarLabel}>INVENTORY</Text>
            <Text style={styles.sidebarTitle}>Add{'\n'}Product</Text>
          </View>

          <View style={styles.locCard}>
            <Text style={styles.locBadge}>LOCATION</Text>
            <Text style={styles.locName}>{location.name}</Text>
            <Text style={styles.locAddr}>{location.address}</Text>
            <View style={styles.locDivider} />
            <View style={styles.locStatusRow}>
              <View style={styles.locDot} />
              <Text style={styles.locStatus}>Active terminal</Text>
            </View>
          </View>

          <View style={styles.sideStats}>
            <Text style={styles.sideStatsLabel}>LIVE METRICS</Text>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Inventory Value</Text>
              <Text style={styles.sideStatVal}>${formatCurrency(inventoryValue)}</Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Unit Margin</Text>
              <Text style={[styles.sideStatVal, marginValue > 0 && styles.positive]}>
                ${formatCurrency(marginValue)}
              </Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Margin %</Text>
              <Text style={[styles.sideStatVal, marginPct > 0 && styles.positive]}>
                {marginPct.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Starting Qty</Text>
              <Text style={styles.sideStatVal}>{quantityValue}</Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Reorder At</Text>
              <Text style={styles.sideStatVal}>{reorderLevelValue}</Text>
            </View>
          </View>

          <View style={styles.sidebarBottom}>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>FORM COMPLETION</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        ([productName, sku, category, quantity, price].filter(
                          v => v.trim().length > 0,
                        ).length /
                          5) *
                          100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressSub}>
                {
                  [productName, sku, category, quantity, price].filter(
                    v => v.trim().length > 0,
                  ).length
                }
                /5 required fields
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.main}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <SectionHeader number="01" title="Product Identity" />
              <View style={styles.twoCol}>
                <Field label="Product Name" required half>
                  <StyledInput
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Liquid Detergent"
                  />
                </Field>

                <Field label="SKU" required half>
                  <StyledInput
                    value={sku}
                    onChangeText={setSku}
                    placeholder="DET-1001"
                    autoCapitalize="characters"
                  />
                </Field>

                <Field label="Category" required half>
                  <StyledInput
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Detergents"
                  />
                </Field>

                <Field label="Vendor" half>
                  <StyledInput
                    value={vendor}
                    onChangeText={setVendor}
                    placeholder="Clean Supply Co."
                  />
                </Field>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader number="02" title="Stock & Pricing" />
              <View style={styles.twoCol}>
                <Field label="Quantity" required half>
                  <StyledInput
                    value={quantity}
                    onChangeText={t => setQuantity(sanitizeWholeNumber(t))}
                    placeholder="24"
                    keyboardType="number-pad"
                  />
                </Field>

                <Field label="Reorder Level" half>
                  <StyledInput
                    value={reorderLevel}
                    onChangeText={t => setReorderLevel(sanitizeWholeNumber(t))}
                    placeholder="8"
                    keyboardType="number-pad"
                  />
                </Field>

                <Field label="Unit Cost" half>
                  <StyledInput
                    value={cost}
                    onChangeText={t => setCost(sanitizeCurrency(t))}
                    placeholder="4.50"
                    keyboardType="decimal-pad"
                    prefix="$"
                  />
                </Field>

                <Field label="Retail Price" required half>
                  <StyledInput
                    value={price}
                    onChangeText={t => setPrice(sanitizeCurrency(t))}
                    placeholder="8.99"
                    keyboardType="decimal-pad"
                    prefix="$"
                  />
                </Field>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader number="03" title="Location & Notes" />
              <Field label="Storage Area">
                <StyledInput
                  value={aisle}
                  onChangeText={setAisle}
                  placeholder="Aisle A — Shelf 2"
                />
              </Field>

              <Field label="Notes">
                <StyledInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional product notes…"
                  multiline
                />
              </Field>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Summary Preview</Text>

              <View style={styles.summaryRow}>
                <StatTile
                  label="Inventory Value"
                  value={`$${formatCurrency(inventoryValue)}`}
                  accent
                />
                <StatTile
                  label="Unit Margin"
                  value={`$${formatCurrency(marginValue)}`}
                  positive={marginValue > 0}
                />
              </View>

              <View style={styles.summaryRow}>
                <StatTile
                  label="Starting Qty"
                  value={`${quantityValue}`}
                  neutral
                />
                <StatTile
                  label="Reorder Level"
                  value={`${reorderLevelValue}`}
                  neutral
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <View style={styles.footerRight}>
              <Text style={styles.footerHint}>
                {canSave ? '✓ Ready to save' : 'Fill required fields to save'}
              </Text>

              <Pressable
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Product</Text>
                <View style={styles.saveBtnArrow}>
                  <Text style={styles.saveBtnArrowText}>→</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const SIDEBAR_W = 260;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#080D17',
  },
  screen: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: '#080D17',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  sidebarTop: {
    gap: 0,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoChar: {
    fontSize: 24,
    fontWeight: '900',
    color: '#080D17',
  },
  sidebarLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#94A3B8',
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    color: '#F8FAFC',
    letterSpacing: -1,
    marginBottom: 28,
  },

  locCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  locBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#F59E0B',
    marginBottom: 8,
  },
  locName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  locAddr: {
    fontSize: 13,
    color: '#A5B4C7',
    lineHeight: 18,
    marginBottom: 12,
  },
  locDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  locStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  locStatus: {
    fontSize: 12,
    color: '#86EFAC',
    fontWeight: '600',
  },

  sideStats: {
    gap: 0,
    marginBottom: 24,
  },
  sideStatsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#94A3B8',
    marginBottom: 12,
  },
  sideStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  sideStatKey: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  sideStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
    fontVariant: ['tabular-nums'],
  },
  positive: {
    color: '#34D399',
  },

  sidebarBottom: {
    gap: 16,
  },
  progressSection: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#94A3B8',
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  progressSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  main: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 32,
  },

  section: {
    marginBottom: 32,
  },
  twoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 8,
  },
  summaryCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#080D17',
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.3,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A5B4C7',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    backgroundColor: '#292524',
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#080D17',
    paddingLeft: 22,
    paddingVertical: 15,
    letterSpacing: 0.2,
  },
  saveBtnArrow: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 15,
    marginLeft: 8,
  },
  saveBtnArrowText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#080D17',
  },
});