// SVG arc math helpers for circular cycle wheel.
// Convention: angle 0° = 12 o'clock (top), increasing clockwise.

export const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } => {
  // -90 offset supaya 0° = top (default SVG = right).
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
};

/** Build SVG arc `d` attribute (uses `M`+`A` commands).
 *  Sweeps clockwise dari startAngle ke endAngle. */
export const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string => {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const sweepAngle = (endAngle - startAngle + 360) % 360;
  const largeArc = sweepAngle > 180 ? 1 : 0;
  return [
    'M', start.x.toFixed(2), start.y.toFixed(2),
    'A', radius, radius, 0, largeArc, 1, end.x.toFixed(2), end.y.toFixed(2),
  ].join(' ');
};

/** Convert cycle day (1-based) to angle on the wheel (0° at top, clockwise). */
export const dayToAngle = (day: number, cycleLength: number): number => {
  return ((day - 1) / cycleLength) * 360;
};

export type CyclePhase = 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal';

/** Compute current phase based on day of cycle. */
export const computePhase = (
  currentDay: number,
  periodLength: number,
  ovulationDay: number,
): CyclePhase => {
  if (currentDay <= periodLength) return 'period';
  if (currentDay === ovulationDay) return 'ovulation';
  if (currentDay >= ovulationDay - 5 && currentDay <= ovulationDay + 1) return 'fertile';
  if (currentDay > ovulationDay + 1) return 'luteal';
  return 'follicular';
};
