import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ProductFormValues, StoreLocation } from '../../../types/inventory';
import { createInventoryItem } from '../services/inventoryService';

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
  editable?: boolean;
};

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize,
  multiline,
  prefix,
  editable = true,
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
        !editable && inputStyles.readOnlyShell,
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
        editable={editable}
        style={[
          inputStyles.input,
          prefix && inputStyles.inputWithPrefix,
          multiline && inputStyles.multilineInput,
          !editable && inputStyles.readOnlyInput,
        ]}
      />

      {focused && editable && <View style={inputStyles.focusAccent} />}
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
  readOnlyShell: {
    opacity: 0.92,
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
  readOnlyInput: {
    color: '#CBD5E1',
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
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [quantityOnHand, setQuantityOnHand] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const quantityValue = useMemo(
    () => toInteger(quantityOnHand),
    [quantityOnHand],
  );

  const unitPriceValue = useMemo(
    () => toNumber(unitPrice),
    [unitPrice],
  );

  const inventoryValue = useMemo(
    () => quantityValue * unitPriceValue,
    [quantityValue, unitPriceValue],
  );

  const estimatedSyncDelay = '5–60 sec';
  const completionCount = [itemName, sku, quantityOnHand, unitPrice].filter(
    value => value.trim().length > 0,
  ).length;

  const canSave =
    itemName.trim().length > 0 &&
    sku.trim().length > 0 &&
    quantityValue > 0 &&
    unitPriceValue > 0 &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Missing fields', 'Complete all required fields before saving.');
      return;
    }

    const payload: ProductFormValues = {
      sku: sku.trim(),
      itemName: itemName.trim(),
      quantityOnHand: quantityValue,
      unitPrice: unitPriceValue,
    };

    try {
      setIsSaving(true);

      await createInventoryItem(payload);
      onSave(payload);

      Alert.alert(
        'Product saved',
        'The item was added to the store inventory and will replicate to the central database automatically.',
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save the product.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
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
              <Text style={styles.sideStatKey}>Unit Price</Text>
              <Text style={styles.sideStatVal}>${formatCurrency(unitPriceValue)}</Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Starting Qty</Text>
              <Text style={styles.sideStatVal}>{quantityValue}</Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Sync Target</Text>
              <Text style={[styles.sideStatVal, styles.positive]}>Central DB</Text>
            </View>

            <View style={styles.sideStatRow}>
              <Text style={styles.sideStatKey}>Expected Sync</Text>
              <Text style={styles.sideStatVal}>{estimatedSyncDelay}</Text>
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
                      width: `${Math.min(100, (completionCount / 4) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressSub}>
                {completionCount}/4 required fields
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
                <Field label="Item Name" required half>
                  <StyledInput
                    value={itemName}
                    onChangeText={setItemName}
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
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader number="02" title="Stock & Pricing" />
              <View style={styles.twoCol}>
                <Field label="Quantity On Hand" required half>
                  <StyledInput
                    value={quantityOnHand}
                    onChangeText={text => setQuantityOnHand(sanitizeWholeNumber(text))}
                    placeholder="24"
                    keyboardType="number-pad"
                  />
                </Field>

                <Field label="Unit Price" required half>
                  <StyledInput
                    value={unitPrice}
                    onChangeText={text => setUnitPrice(sanitizeCurrency(text))}
                    placeholder="8.99"
                    keyboardType="decimal-pad"
                    prefix="$"
                  />
                </Field>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader number="03" title="Replication Preview" />

              <View style={styles.twoCol}>
                <Field label="Store Location" half>
                  <StyledInput
                    value={location.name}
                    onChangeText={() => {}}
                    editable={false}
                  />
                </Field>

                <Field label="Sync Destination" half>
                  <StyledInput
                    value="Central Inventory Database"
                    onChangeText={() => {}}
                    editable={false}
                  />
                </Field>
              </View>

              <Field label="What happens next">
                <StyledInput
                  value="This save posts to the store inventory API first. Once the row is written to the store database, SymmetricDS picks it up and replicates it to the central node automatically."
                  onChangeText={() => {}}
                  editable={false}
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
                  label="Unit Price"
                  value={`$${formatCurrency(unitPriceValue)}`}
                  positive={unitPriceValue > 0}
                />
              </View>

              <View style={styles.summaryRow}>
                <StatTile
                  label="Starting Qty"
                  value={`${quantityValue}`}
                  neutral
                />
                <StatTile
                  label="Sync Path"
                  value="Store → Central"
                  neutral
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelBtn, isSaving && styles.disabledBtn]}
              onPress={onCancel}
              disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <View style={styles.footerRight}>
              <Text style={styles.footerHint}>
                {isSaving
                  ? 'Posting product to store inventory...'
                  : canSave
                    ? '✓ Ready to save'
                    : 'Fill required fields to save'}
              </Text>

              <Pressable
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave}>
                {isSaving ? (
                  <View style={styles.saveBtnLoading}>
                    <ActivityIndicator size="small" color="#080D17" />
                    <Text style={styles.saveBtnText}>Saving...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.saveBtnText}>Save Product</Text>
                    <View style={styles.saveBtnArrow}>
                      <Text style={styles.saveBtnArrowText}>→</Text>
                    </View>
                  </>
                )}
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
  disabledBtn: {
    opacity: 0.65,
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
    minWidth: 176,
    justifyContent: 'center',
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
  saveBtnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
});