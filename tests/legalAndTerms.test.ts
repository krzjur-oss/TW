import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LICENSE_META,
  LICENSE_SECTIONS,
  TERMS_META,
  TERMS_SECTIONS,
} from '../src/config/legalDocuments';
import type { StorageLike } from '../src/utils/appLockThrottle';
import {
  TERMS_ACCEPTANCE_STORAGE_KEY,
  TERMS_ACCEPTANCE_VERSION,
  clearTermsAcceptance,
  hasAcceptedCurrentTerms,
  readTermsAcceptance,
  saveTermsAcceptance,
} from '../src/utils/termsAcceptance';

class MemoryStorage implements StorageLike {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('Licencja WLDE, Regulamin i wymóg akceptacji przed pierwszym uruchomieniem', () => {
  it('dostosowuje LICENSE.md i REGULAMIN.md bez pozostawionych placeholderów wzorcowych', () => {
    const rootDir = path.resolve(import.meta.dirname, '..');
    const licenseMd = fs.readFileSync(path.join(rootDir, 'LICENSE.md'), 'utf8');
    const regulaminMd = fs.readFileSync(
      path.join(rootDir, 'REGULAMIN.md'),
      'utf8',
    );

    const leftoverMarkers = [
      '[NAZWA APLIKACJI]',
      '[WERSJA]',
      '[ROK]',
      '[DATA]',
      '[ADRES URL]',
      '[MIEJSCOWOŚĆ]',
      '[MIESIĄC ROK]',
      '[OPCJONALNIE',
      '[LISTA DANYCH]',
    ];

    for (const marker of leftoverMarkers) {
      expect(licenseMd).not.toContain(marker);
      expect(regulaminMd).not.toContain(marker);
    }

    expect(licenseMd).toContain('Teczka Wsparcia');
    expect(licenseMd).toContain('Wolna Licencja Domowo-Edukacyjna');
    expect(licenseMd).toContain('nauczycieli, pedagogów');
    expect(licenseMd).toContain('placówkach edukacyjnych');
    expect(licenseMd).toContain('mgr Krzysztof Jureczek');

    expect(regulaminMd).toContain('Teczka Wsparcia');
    expect(regulaminMd).toContain('TeczkaWsparciaLocalDB');
    expect(regulaminMd).toContain('IndexedDB');
    expect(regulaminMd).toContain('AES-GCM 256-bit');
  });

  it('udostępnia spójną strukturę licencji i regulaminu w aplikacji', () => {
    expect(LICENSE_META.author).toBe('mgr Krzysztof Jureczek');
    expect(LICENSE_SECTIONS.length).toBeGreaterThanOrEqual(7);
    expect(TERMS_META.copyright).toContain('2026 Krzysztof Jureczek');
    expect(TERMS_SECTIONS.length).toBeGreaterThanOrEqual(8);

    const licenseText = LICENSE_SECTIONS.flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.bullets ?? []),
    ]).join('\n');
    expect(licenseText).toContain('nauczycieli, pedagogów i specjalistów szkolnych');
    expect(licenseText).toContain('placówkach oświatowych');

    const termsText = TERMS_SECTIONS.flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.bullets ?? []),
    ]).join('\n');
    expect(termsText).toContain('przed pierwszym uruchomieniem');
    expect(termsText).toContain('TeczkaWsparciaLocalDB');
  });

  it('wymaga akceptacji przed pierwszym uruchomieniem i zapisuje zgodę lokalnie dla bieżącej wersji', () => {
    const storage = new MemoryStorage();

    // Przed akceptacją -> brak zgody
    expect(hasAcceptedCurrentTerms(storage)).toBe(false);
    expect(readTermsAcceptance(storage)).toBeNull();

    // Zapis akceptacji
    const saved = saveTermsAcceptance(
      storage,
      TERMS_ACCEPTANCE_VERSION,
      '2026-11-23T12:30:00.000Z',
    );
    expect(saved.accepted).toBe(true);
    expect(saved.licenseName).toBe('WLDE');
    expect(saved.termsVersion).toBe(TERMS_ACCEPTANCE_VERSION);
    expect(hasAcceptedCurrentTerms(storage)).toBe(true);
    expect(storage.getItem(TERMS_ACCEPTANCE_STORAGE_KEY)).toBeTruthy();

    // Zmiana wymaganej wersji regulaminu wymusza ponowną akceptację
    expect(hasAcceptedCurrentTerms(storage, '2.0.0')).toBe(false);

    // Wyczyszczenie zgody cofa stan
    clearTermsAcceptance(storage);
    expect(hasAcceptedCurrentTerms(storage)).toBe(false);
  });
});
