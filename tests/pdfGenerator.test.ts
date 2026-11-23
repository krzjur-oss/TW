import { describe, expect, it } from 'vitest';
import {
  buildPdfDocumentDefinition,
  buildPdfFileName,
  generatePdfBuffer,
  getLegalBasisText,
} from '../src/pdf/pdfGenerator';
import {
  makeSyntheticAnnex,
  makeSyntheticEvaluation,
  makeSyntheticJournalEntry,
  makeSyntheticSettings,
  makeSyntheticStudent,
} from './fixtures';

const POLISH_DIACRITICS = 'ą ć ę ł ń ó ś ź ż Ą Ć Ę Ł Ń Ó Ś Ź Ż';

function collectTextNodes(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') {
    out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectTextNodes(item, out);
    return out;
  }
  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) {
      collectTextNodes(value, out);
    }
  }
  return out;
}

describe('Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy)', () => {
  it('generuje poprawne nazwy plików PDF i zweryfikowane podstawy prawne ze stanem prawnym', () => {
    const settings = makeSyntheticSettings();
    const stuOrz = makeSyntheticStudent('stu-orz', {
      firstName: 'Zofia',
      lastName: 'Żółć-Łąka',
      documentType: 'ORZECZENIE',
    });
    const stuOp = makeSyntheticStudent('stu-op', {
      firstName: 'Marek',
      lastName: 'Świątek',
      documentType: 'OPINIA',
    });

    expect(
      buildPdfFileName({
        variant: 'IPET',
        student: stuOrz,
        settings,
        journalEntries: [],
        evaluations: [],
        annexes: [],
        preparedDate: '2026-09-28',
      }),
    ).toBe('IPET_WOPFU_zolc_laka_zofia_2026-09-28.pdf');

    expect(
      buildPdfFileName({
        variant: 'IPET',
        student: stuOp,
        settings,
        journalEntries: [],
        evaluations: [],
        annexes: [],
        preparedDate: '2026-09-28',
      }),
    ).toBe('Dostosowania_PPP_swiatek_marek_2026-09-28.pdf');

    const basisOrz = getLegalBasisText(stuOrz);
    expect(basisOrz).toContain('Dz.U. z 2020 r. poz. 1309');
    expect(basisOrz).toContain('Dz.U. z 2026 r. poz. 820');
    expect(basisOrz).toContain('Stan prawny');

    const basisOp = getLegalBasisText(stuOp);
    expect(basisOp).toContain('Dz.U. z 2023 r. poz. 1798');
    expect(basisOp).toContain('Dz.U. z 2023 r. poz. 2572');
    expect(basisOp).toContain('Stan prawny');
  });

  it('buduje wszystkie 3 warianty PDF z polskimi znakami, nagłówkiem, podpisami, potwierdzeniem rodzica i stopką', async () => {
    const settings = makeSyntheticSettings({
      schoolName: 'Zespół Szkół Specjalnych w Żyrardowie',
      directorName: 'dr Małgorzata Ćwiklińska',
    });
    const longParagraph = `${POLISH_DIACRITICS} — ` + 'Przykładowy opis funkcjonowania ucznia w języku funkcjonalnym. '.repeat(45);
    const student = makeSyntheticStudent('pdf-stu-1', {
      firstName: 'Łukasz',
      lastName: 'Źrebak-Śliwiński',
      documentType: 'ORZECZENIE',
    });
    student.ipetDraft.educationalAndTherapeuticGoals = longParagraph;

    const manyJournalEntries = Array.from({ length: 28 }, (_, i) =>
      makeSyntheticJournalEntry(`j-pdf-${i + 1}`, 'pdf-stu-1', {
        date: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
        title: `Obserwacja nr ${i + 1} (${POLISH_DIACRITICS})`,
        content: `Szczegółowy zapis pracy ucznia na lekcji nr ${i + 1}. `.repeat(6),
      }),
    );

    const manyAnnexes = Array.from({ length: 6 }, (_, i) =>
      makeSyntheticAnnex(`a-pdf-${i + 1}`, 'pdf-stu-1', {
        versionNumber: i + 1,
        annexDate: `2026-11-${String(i + 10).padStart(2, '0')}`,
        title: `Aneks nr ${i + 1} (${POLISH_DIACRITICS})`,
        changeDescription: `Opis modyfikacji ${i + 1}: dostosowanie metod pracy.`,
      }),
    );

    const evaluations = [
      makeSyntheticEvaluation('e-pdf-1', 'pdf-stu-1', {
        linkedAnnexId: 'a-pdf-1',
        progressSummary: `Sprawozdanie okresowe: ${POLISH_DIACRITICS}`,
      }),
    ];

    // Sprawdzenie struktury i rzeczywistej binarnej generacji PDF dla każdego wariantu
    for (const variant of ['IPET', 'EVALUATION', 'JOURNAL'] as const) {
      const options = {
        variant,
        student,
        settings,
        journalEntries: manyJournalEntries,
        evaluations,
        annexes: manyAnnexes,
        preparedDate: '2026-11-23',
        includeWopfuInIpet: true,
      };

      const docDef = buildPdfDocumentDefinition(options);
      const allTexts = collectTextNodes(docDef.content).join('\n');

      expect(allTexts).toContain(settings.schoolName);
      expect(allTexts).toContain(POLISH_DIACRITICS);
      expect(allTexts).toContain(
        'Podpisy członków zespołu nauczycieli i specjalistów',
      );
      expect(allTexts).toContain(
        'Potwierdzenie zapoznania się oraz otrzymania kopii dokumentu przez rodzica / opiekuna prawnego',
      );
      if (variant === 'IPET') {
        expect(allTexts).toContain(
          'Zatwierdzenie dokumentu przez Dyrektora placówki',
        );
      }

      const footerFn = docDef.footer;
      expect(typeof footerFn).toBe('function');
      if (typeof footerFn === 'function') {
        const footerContent = collectTextNodes(
          footerFn(2, 5, { width: 595, height: 842, orientation: 'portrait' }),
        ).join('\n');
        expect(footerContent).toContain('Strona 2 z 5');
        expect(footerContent).toContain('stan prawny na dzień');
      }

      const pdfBytes = await generatePdfBuffer(options);
      expect(pdfBytes.byteLength).toBeGreaterThan(2000);
      const pdfMagic = new TextDecoder().decode(pdfBytes.subarray(0, 5));
      expect(pdfMagic).toBe('%PDF-');
    }
  });

  it('generuje poprawny wariant dla Opinii PPP bez wymuszania zatwierdzenia dyrektora właściwego dla IPET', async () => {
    const studentOp = makeSyntheticStudent('pdf-op-1', {
      documentType: 'OPINIA',
    });
    const pdfBytes = await generatePdfBuffer({
      variant: 'IPET',
      student: studentOp,
      settings: makeSyntheticSettings(),
      journalEntries: [],
      evaluations: [],
      annexes: [],
      preparedDate: '2026-11-23',
    });

    expect(pdfBytes.byteLength).toBeGreaterThan(1500);
    expect(new TextDecoder().decode(pdfBytes.subarray(0, 5))).toBe('%PDF-');
  });
});
