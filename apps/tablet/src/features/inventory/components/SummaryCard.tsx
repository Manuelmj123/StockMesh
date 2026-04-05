import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SummaryCardProps {
  label: string;
  value: string;
  helperText: string;
  accent?: boolean;
  alert?: boolean;
}

export default function SummaryCard({
  label,
  value,
  helperText,
  accent,
  alert,
}: SummaryCardProps) {
  const accentColor = alert ? '#F87171' : accent ? '#F59E0B' : null;
  const valueColor = alert ? '#F87171' : accent ? '#F59E0B' : '#F8FAFC';
  const borderColor = alert ? '#7F1D1D' : accent ? '#78350F' : '#1E293B';
  const bgColor = alert ? '#1C0A0A' : accent ? '#1C1409' : '#0F172A';

  return (
    <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
      {accentColor && <View style={[styles.topBar, { backgroundColor: accentColor }]} />}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.helperText}>{helperText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
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
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 10,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#CBD5E1',
    fontWeight: '500',
  },
});