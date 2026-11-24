import type { StorageLike } from './appLockThrottle';

export const TERMS_ACCEPTANCE_VERSION = '1.6.1';
export const TERMS_ACCEPTANCE_STORAGE_KEY =
  'teczka_wsparcia_terms_acceptance_v1';

export interface TermsAcceptanceRecord {
  accepted: boolean;
  termsVersion: string;
  licenseName: 'WLDE';
  acceptedAt: string;
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readTermsAcceptance(
  storage: StorageLike | null = getDefaultStorage(),
): TermsAcceptanceRecord | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(TERMS_ACCEPTANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TermsAcceptanceRecord>;
    if (
      parsed &&
      parsed.accepted === true &&
      typeof parsed.termsVersion === 'string' &&
      parsed.termsVersion.length > 0 &&
      parsed.licenseName === 'WLDE' &&
      typeof parsed.acceptedAt === 'string' &&
      parsed.acceptedAt.length > 0
    ) {
      return parsed as TermsAcceptanceRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasAcceptedCurrentTerms(
  storage: StorageLike | null = getDefaultStorage(),
  requiredVersion: string = TERMS_ACCEPTANCE_VERSION,
): boolean {
  const record = readTermsAcceptance(storage);
  if (!record) return false;
  return record.accepted && record.termsVersion === requiredVersion;
}

export function saveTermsAcceptance(
  storage: StorageLike | null = getDefaultStorage(),
  version: string = TERMS_ACCEPTANCE_VERSION,
  acceptedAt: string = new Date().toISOString(),
): TermsAcceptanceRecord {
  const record: TermsAcceptanceRecord = {
    accepted: true,
    termsVersion: version,
    licenseName: 'WLDE',
    acceptedAt,
  };
  if (storage) {
    try {
      storage.setItem(TERMS_ACCEPTANCE_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Ignoruj ograniczenia zapisu trybu prywatnego
    }
  }
  return record;
}

export function clearTermsAcceptance(
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(TERMS_ACCEPTANCE_STORAGE_KEY);
  } catch {
    // Ignoruj błędy czyszczenia
  }
}
