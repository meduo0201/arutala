export type AalLevel = 'aal1' | 'aal2' | string;

export interface AalSnapshot {
  currentLevel: AalLevel | null;
  nextLevel: AalLevel | null;
}

/**
 * F04: require an AAL2 step only when the user has MFA enrolled
 * (nextLevel === aal2) and the current session is still aal1.
 * Users without MFA stay on aal1 / aal1 and must not be blocked.
 */
export const needsAal2Challenge = (aal: AalSnapshot | null | undefined): boolean => {
  if (!aal) return false;
  return aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2';
};
