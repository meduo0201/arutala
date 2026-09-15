/** D2: same calendar day present in both households must reject accept. */
export const overlappingLogDates = (
  left: readonly string[],
  right: readonly string[],
): string[] => {
  const other = new Set(right);
  return [...new Set(left.filter((d) => other.has(d)))].sort();
};

export const formatAcceptConflictMessage = (dates: readonly string[]): string => {
  if (dates.length === 0) return '';
  const shown = dates.slice(0, 8).join('、');
  const extra = dates.length > 8 ? ` 等 ${dates.length} 天` : '';
  return `无法关联：双方在同一天都有记录（${shown}${extra}）。请先删除冲突日期后再试，系统不会覆盖或丢弃任何记录。`;
};
