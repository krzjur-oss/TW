import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createPwaUpdateController } from '../src/pwa/pwaUpdateManager';
import { createUnsavedChangesRegistry } from '../src/utils/unsavedChangesRegistry';

describe('PWA — kontrolowana aktualizacja, ochrona niezapisanych zmian, konfiguracja offline i GitHub Pages', () => {
  it('blokuje przeładowanie przy niezapisanych zmianach i pozwala odroczyć oraz bezpiecznie dokończyć aktualizację', async () => {
    const unsaved = createUnsavedChangesRegistry();
    const updateSwMock = vi.fn(async () => {});

    const pwa = createPwaUpdateController({
      hasUnsavedChanges: () => unsaved.hasUnsavedChanges(),
      getUnsavedEntries: () => unsaved.getSnapshot(),
    });
    pwa.attachUpdater(updateSwMock);

    // 1. Wykrycie nowej wersji nie przeładowuje strony samoistnie
    pwa.notifyNeedRefresh();
    expect(pwa.getSnapshot().needRefresh).toBe(true);
    expect(updateSwMock).not.toHaveBeenCalled();

    // 2. Użytkownik ma otwarty formularz z niezapisanymi zmianami
    unsaved.setDirty('wizard-draft', true, 'Kreator WOPFU / IPET');
    const appliedWhileDirty = await pwa.applyUpdate();
    expect(appliedWhileDirty).toBe(false);
    expect(pwa.getSnapshot().blockedByUnsavedChanges).toBe(true);
    expect(pwa.getSnapshot().unsavedLabels).toContain('Kreator WOPFU / IPET');
    expect(updateSwMock).not.toHaveBeenCalled();

    // 3. Odroczenie aktualizacji chowa monit bez utraty statusu aktualizacji
    pwa.deferUpdate();
    expect(pwa.getSnapshot().deferred).toBe(true);
    expect(pwa.getSnapshot().needRefresh).toBe(true);
    expect(updateSwMock).not.toHaveBeenCalled();

    // 4. Po zapisaniu formularza użytkownik może przywrócić monit i wykonać aktualizację
    unsaved.setDirty('wizard-draft', false, 'Kreator WOPFU / IPET');
    pwa.reopenDeferredPrompt();
    expect(pwa.getSnapshot().deferred).toBe(false);

    const appliedClean = await pwa.applyUpdate();
    expect(appliedClean).toBe(true);
    expect(updateSwMock).toHaveBeenCalledTimes(1);
    expect(updateSwMock).toHaveBeenCalledWith(true);
  });

  it('zachowuje relatywne ścieżki GitHub Pages, prompt PWA update i brak zależności od Google Fonts', () => {
    const rootDir = path.resolve(import.meta.dirname, '..');
    const viteConfig = fs.readFileSync(
      path.join(rootDir, 'vite.config.ts'),
      'utf8',
    );
    const indexHtml = fs.readFileSync(
      path.join(rootDir, 'index.html'),
      'utf8',
    );
    const mainTsx = fs.readFileSync(
      path.join(rootDir, 'src/main.tsx'),
      'utf8',
    );

    expect(viteConfig).toContain("base: './'");
    expect(viteConfig).toContain("registerType: 'prompt'");
    expect(viteConfig).toContain("start_url: './'");
    expect(viteConfig).toContain("scope: './'");
    expect(viteConfig).toContain('woff2');
    expect(viteConfig).not.toContain('fonts.googleapis.com');
    expect(viteConfig).not.toContain('fonts.gstatic.com');

    expect(indexHtml).not.toContain('fonts.googleapis.com');
    expect(indexHtml).not.toContain('fonts.gstatic.com');
    expect(indexHtml).toContain('./apple-touch-icon.png');
    expect(indexHtml).toContain('./icon.svg');

    expect(mainTsx).toContain('@fontsource/public-sans');
    expect(mainTsx).toContain('@fontsource/plus-jakarta-sans');
    expect(mainTsx).toContain('@fontsource/jetbrains-mono');
    expect(mainTsx).not.toContain('immediate: true');

    expect(fs.existsSync(path.join(rootDir, 'public/.nojekyll'))).toBe(true);
  });
});
