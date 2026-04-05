import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

type RangeLabel = {
  start: number;
  end: number;
  total: number;
};

function getRangeLabel(
  currentPage: number,
  totalItems: number,
  pageSize: number,
): RangeLabel {
  if (totalItems === 0) {
    return { start: 0, end: 0, total: 0 };
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return { start, end, total: totalItems };
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | '…')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, '…', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      '…',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Props) {
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const safeTotal = Math.max(totalPages, 1);
  const range = getRangeLabel(currentPage, totalItems, pageSize);
  const pageNumbers = getPageNumbers(safePage, safeTotal);

  const progressPct =
    safeTotal > 1 ? ((safePage - 1) / (safeTotal - 1)) * 100 : 100;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Showing</Text>
        {totalItems > 0 ? (
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryRange}>
              <Text style={styles.summaryHighlight}>
                {range.start}–{range.end}
              </Text>
            </Text>
            <Text style={styles.summaryOf}>of {range.total}</Text>
          </View>
        ) : (
          <Text style={styles.summaryRange}>No results</Text>
        )}

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      </View>

      <View style={styles.pageNumbers}>
        {pageNumbers.map((p, i) =>
          p === '…' ? (
            <View key={`ellipsis-${i}`} style={styles.ellipsis}>
              <Text style={styles.ellipsisText}>…</Text>
            </View>
          ) : (
            <Pressable
              key={p}
              style={[styles.pageDot, p === safePage && styles.pageDotActive]}
              onPress={() => p !== safePage && onPageChange(p)}>
              <Text
                style={[
                  styles.pageDotText,
                  p === safePage && styles.pageDotTextActive,
                ]}>
                {p}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <View style={styles.navGroup}>
        <Pressable
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
          onPress={() => canGoBack && onPageChange(currentPage - 1)}>
          <Text style={[styles.navArrow, !canGoBack && styles.navArrowDisabled]}>
            ←
          </Text>
          <Text style={[styles.navText, !canGoBack && styles.navTextDisabled]}>
            Prev
          </Text>
        </Pressable>

        <View style={styles.navDivider} />

        <Pressable
          style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
          onPress={() => canGoForward && onPageChange(currentPage + 1)}>
          <Text
            style={[styles.navText, !canGoForward && styles.navTextDisabled]}>
            Next
          </Text>
          <Text
            style={[styles.navArrow, !canGoForward && styles.navArrowDisabled]}>
            →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: '#080D17',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  summary: {
    width: 130,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#94A3B8',
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  summaryRange: {
    fontSize: 16,
    fontWeight: '800',
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  summaryHighlight: {
    color: '#F8FAFC',
  },
  summaryOf: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A5B4C7',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    marginTop: 6,
    height: 2,
    backgroundColor: '#1E293B',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },

  pageNumbers: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pageDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pageDotActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  pageDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  pageDotTextActive: {
    color: '#080D17',
    fontWeight: '900',
  },
  ellipsis: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },

  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    width: 160,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navArrow: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  navArrowDisabled: {
    color: '#94A3B8',
  },
  navText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  navTextDisabled: {
    color: '#94A3B8',
  },
  navDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#1E293B',
  },
});