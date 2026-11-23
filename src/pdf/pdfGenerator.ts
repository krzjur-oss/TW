import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type {
  Content,
  TableCell,
  TDocumentDefinitions,
  TVirtualFileSystem,
} from 'pdfmake/interfaces';
import {
  APP_INFO,
  LEGAL_FRAMEWORK_AS_OF_PL,
} from '../config/appInfo';
import {
  DOCUMENT_TYPE_LABELS,
  EDUCATION_STAGE_LABELS,
  EFFECTIVENESS_RATING_LABELS,
  JOURNAL_CATEGORY_LABELS,
  REHAB_CATEGORY_LABELS,
  type FacilitySettings,
  type JournalEntry,
  type PeriodicEvaluation,
  type ProgramModificationAnnex,
  type StudentProfile,
} from '../types/domain';

export type PrintDocumentVariant = 'IPET' | 'EVALUATION' | 'JOURNAL';

export interface PdfGenerationOptions {
  variant: PrintDocumentVariant;
  student: StudentProfile;
  settings: FacilitySettings;
  journalEntries: JournalEntry[];
  evaluations: PeriodicEvaluation[];
  annexes: ProgramModificationAnnex[];
  preparedDate: string;
  includeWopfuInIpet?: boolean;
  selectedEvaluationId?: string | 'ALL';
  journalAreaFilter?: string | 'ALL';
}

let vfsInitialized = false;

function getPdfMakeInstance() {
  const pm =
    (pdfMake as unknown as { default?: typeof pdfMake }).default ?? pdfMake;
  if (!vfsInitialized) {
    const rawFonts = pdfFonts as unknown as {
      default?: TVirtualFileSystem;
      pdfMake?: { vfs?: TVirtualFileSystem };
    };
    const vfs =
      rawFonts?.default ??
      rawFonts?.pdfMake?.vfs ??
      (pdfFonts as unknown as TVirtualFileSystem);
    if (vfs && typeof pm.addVirtualFileSystem === 'function') {
      pm.addVirtualFileSystem(vfs);
    }
    vfsInitialized = true;
  }
  return pm;
}

function safeText(value: string | null | undefined, fallback = '—'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function formatFacilityLocation(settings: FacilitySettings): string {
  const parts = [settings.address?.trim(), settings.city?.trim()].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(', ') : 'Miejscowość nieuzupełniona';
}

export function getLegalBasisText(student: StudentProfile): string {
  if (student.documentType === 'ORZECZENIE') {
    return `Rozporządzenie MEN z dnia 9 sierpnia 2017 r. w sprawie warunków organizowania kształcenia, wychowania i opieki dla dzieci i młodzieży niepełnosprawnych, niedostosowanych społecznie i zagrożonych niedostosowaniem społecznym (t.j. Dz.U. z 2020 r. poz. 1309, z późn. zm.) oraz art. 127 ustawy z dnia 14 grudnia 2016 r. – Prawo oświatowe (t.j. Dz.U. z 2026 r. poz. 820, z późn. zm.). Stan prawny wzoru: ${LEGAL_FRAMEWORK_AS_OF_PL}.`;
  }
  return `Rozporządzenie MEN z dnia 9 sierpnia 2017 r. w sprawie zasad organizacji i udzielania pomocy psychologiczno-pedagogicznej w publicznych przedszkolach, szkołach i placówkach (t.j. Dz.U. z 2023 r. poz. 1798) oraz § 2–3 rozporządzenia MEN z dnia 22 lutego 2019 r. w sprawie oceniania, klasyfikowania i promowania uczniów i słuchaczy w szkołach publicznych (t.j. Dz.U. z 2023 r. poz. 2572, z późn. zm.). Stan prawny wzoru: ${LEGAL_FRAMEWORK_AS_OF_PL}.`;
}

const TABLE_BORDER_LAYOUT = {
  hLineWidth: () => 0.6,
  vLineWidth: () => 0.6,
  hLineColor: () => '#cbd5e1',
  vLineColor: () => '#cbd5e1',
  paddingLeft: () => 6,
  paddingRight: () => 6,
  paddingTop: () => 5,
  paddingBottom: () => 5,
};

const SIGNATURE_BORDER_LAYOUT = {
  hLineWidth: () => 0.6,
  vLineWidth: () => 0.6,
  hLineColor: () => '#94a3b8',
  vLineColor: () => '#94a3b8',
  paddingLeft: () => 7,
  paddingRight: () => 7,
  paddingTop: () => 6,
  paddingBottom: () => 6,
};

function sectionHeader(title: string): Content {
  return {
    text: title,
    style: 'sectionHeading',
    margin: [0, 12, 0, 5],
    pageBreak: undefined,
  };
}

function buildOfficialHeader(
  title: string,
  subtitle: string,
  options: PdfGenerationOptions,
): Content[] {
  const { student, settings, preparedDate } = options;
  const locationLine = formatFacilityLocation(settings);
  const blocks: Content[] = [];

  blocks.push({
    table: {
      widths: ['58%', '42%'],
      dontBreakRows: true,
      body: [
        [
          {
            stack: [
              {
                text: safeText(settings.schoolName, 'Nazwa placówki'),
                bold: true,
                fontSize: 10.5,
                color: '#0f172a',
              },
              {
                text: `${safeText(settings.schoolType, 'Placówka oświatowa')} · ${locationLine}`,
                fontSize: 8.5,
                color: '#334155',
                margin: [0, 2, 0, 0],
              },
              ...(settings.directorName?.trim()
                ? [
                    {
                      text: `Dyrektor: ${settings.directorName.trim()}`,
                      fontSize: 8.5,
                      color: '#334155',
                      margin: [0, 2, 0, 0] as [number, number, number, number],
                    },
                  ]
                : []),
            ],
            border: [false, false, false, true],
          },
          {
            stack: [
              {
                text: `Rok szkolny: ${student.schoolYear}`,
                bold: true,
                fontSize: 9,
                alignment: 'right',
                color: '#0f172a',
              },
              {
                text: `Data sporządzenia: ${preparedDate}`,
                fontSize: 8.5,
                alignment: 'right',
                color: '#334155',
                margin: [0, 2, 0, 0],
              },
              {
                text: `Dokument PPP: ${student.pppDocument.documentNumber}`,
                fontSize: 8.5,
                alignment: 'right',
                color: '#334155',
                margin: [0, 2, 0, 0],
              },
            ],
            border: [false, false, false, true],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number) => (i === 1 ? 1.2 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#1e293b',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 6,
    },
    margin: [0, 0, 0, 8],
  });

  if (student.isTestData) {
    blocks.push({
      table: {
        widths: ['*'],
        dontBreakRows: true,
        body: [
          [
            {
              text: 'DANE TESTOWE — DOKUMENT PRZYKŁADOWY WYGENEROWANY DO CELÓW DEMONSTRACYJNYCH',
              bold: true,
              fontSize: 8.5,
              color: '#92400e',
              fillColor: '#fef3c7',
              alignment: 'center',
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.8,
        vLineWidth: () => 0.8,
        hLineColor: () => '#d97706',
        vLineColor: () => '#d97706',
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      margin: [0, 0, 0, 8],
    });
  }

  blocks.push({
    text: title,
    style: 'docTitle',
    alignment: 'center',
    margin: [0, 2, 0, 2],
  });
  blocks.push({
    text: subtitle,
    style: 'docSubtitle',
    alignment: 'center',
    margin: [0, 0, 0, 8],
  });

  blocks.push({
    table: {
      widths: ['26%', '24%', '26%', '24%'],
      dontBreakRows: true,
      body: [
        [
          { text: 'Uczeń / Uczennica:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: `${student.firstName} ${student.lastName}`,
            style: 'metaValueBold',
          },
          { text: 'Klasa / oddział:', style: 'metaLabel', fillColor: '#f8fafc' },
          { text: student.className, style: 'metaValueBold' },
        ],
        [
          { text: 'Data urodzenia:', style: 'metaLabel', fillColor: '#f8fafc' },
          { text: safeText(student.birthDate), style: 'metaValue' },
          { text: 'Etap edukacyjny:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: EDUCATION_STAGE_LABELS[student.educationStage],
            style: 'metaValue',
          },
        ],
        [
          { text: 'Rodzaj dokumentu PPP:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: DOCUMENT_TYPE_LABELS[student.documentType],
            style: 'metaValue',
            colSpan: 3,
          },
          {},
          {},
        ],
        [
          { text: 'Numer i data wydania:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: `${student.pppDocument.documentNumber} (wyd. ${safeText(student.pppDocument.issueDate)})`,
            style: 'metaValue',
          },
          { text: 'Okres ważności:', style: 'metaLabel', fillColor: '#f8fafc' },
          { text: safeText(student.pppDocument.validUntil), style: 'metaValue' },
        ],
        [
          { text: 'Poradnia wydająca:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: safeText(student.pppDocument.issuingAuthority),
            style: 'metaValue',
          },
          { text: 'Koordynator zespołu:', style: 'metaLabel', fillColor: '#f8fafc' },
          { text: safeText(student.teamCoordinator), style: 'metaValue' },
        ],
        [
          { text: 'Rozpoznanie / powód:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: safeText(student.pppDocument.reasonCategory),
            style: 'metaValue',
            colSpan: 3,
          },
          {},
          {},
        ],
        [
          { text: 'Podstawa prawna:', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: getLegalBasisText(student),
            style: 'metaSmall',
            colSpan: 3,
          },
          {},
          {},
        ],
      ],
    },
    layout: TABLE_BORDER_LAYOUT,
    margin: [0, 0, 0, 8],
  });

  return blocks;
}

function buildTeamTable(student: StudentProfile): Content[] {
  if (!student.teamMembers || student.teamMembers.length === 0) {
    return [
      sectionHeader('Skład zespołu nauczycieli i specjalistów'),
      {
        text: `Koordynator: ${safeText(student.teamCoordinator)}. Brak wpisanych pozostałych członków zespołu.`,
        style: 'bodyText',
      },
    ];
  }

  const body: TableCell[][] = [
    [
      { text: 'Lp.', style: 'tableHeader', alignment: 'center' },
      { text: 'Imię i nazwisko', style: 'tableHeader' },
      { text: 'Stanowisko / nauczany przedmiot', style: 'tableHeader' },
      { text: 'Funkcja w zespole', style: 'tableHeader' },
    ],
    ...student.teamMembers.map((m, idx): TableCell[] => [
      { text: `${idx + 1}.`, style: 'tableCell', alignment: 'center' },
      { text: m.name, style: 'tableCellBold' },
      { text: m.role, style: 'tableCell' },
      {
        text: m.isCoordinator ? 'Koordynator zespołu' : 'Członek zespołu',
        style: 'tableCell',
      },
    ]),
  ];

  return [
    sectionHeader('Skład zespołu nauczycieli i specjalistów'),
    {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: [24, '34%', '38%', '22%'],
        body,
      },
      layout: TABLE_BORDER_LAYOUT,
    },
  ];
}

function buildTextSectionTable(
  heading: string,
  rows: Array<{ label: string; value: string }>,
): Content[] {
  return [
    sectionHeader(heading),
    {
      table: {
        dontBreakRows: true,
        widths: ['28%', '72%'],
        body: rows.map((row) => [
          {
            text: row.label,
            style: 'metaLabel',
            fillColor: '#f8fafc',
          },
          {
            text: safeText(row.value, 'Nie uzupełniono'),
            style: 'bodyText',
          },
        ]),
      },
      layout: TABLE_BORDER_LAYOUT,
    },
  ];
}

function buildSubjectAdaptationsTable(
  heading: string,
  items: StudentProfile['ipetDraft']['subjectAdaptations'],
): Content[] {
  const blocks: Content[] = [sectionHeader(heading)];
  if (!items || items.length === 0) {
    blocks.push({
      text: 'Brak szczegółowych dostosowań przedmiotowych wpisanych w tabeli.',
      style: 'bodyTextMuted',
    });
    return blocks;
  }

  const body: TableCell[][] = [
    [
      { text: 'Przedmiot / obszar', style: 'tableHeader' },
      {
        text: 'Dostosowanie metod, form pracy i warunków',
        style: 'tableHeader',
      },
      { text: 'Dostosowanie wymagań i oceniania', style: 'tableHeader' },
    ],
    ...items.map((item): TableCell[] => [
      { text: safeText(item.subject), style: 'tableCellBold' },
      { text: safeText(item.methodsAndForms), style: 'tableCell' },
      { text: safeText(item.assessmentCriteria), style: 'tableCell' },
    ]),
  ];

  blocks.push({
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: ['22%', '41%', '37%'],
      body,
    },
    layout: TABLE_BORDER_LAYOUT,
  });

  return blocks;
}

function buildSpecialistSupportTable(
  heading: string,
  items: StudentProfile['ipetDraft']['specialistSupportHours'],
): Content[] {
  const blocks: Content[] = [sectionHeader(heading)];
  if (!items || items.length === 0) {
    blocks.push({
      text: 'Nie zaplanowano dodatkowych form pomocy psychologiczno-pedagogicznej.',
      style: 'bodyTextMuted',
    });
    return blocks;
  }

  const body: TableCell[][] = [
    [
      { text: 'Forma pomocy PPP', style: 'tableHeader' },
      { text: 'Okres realizacji', style: 'tableHeader' },
      { text: 'Wymiar', style: 'tableHeader', alignment: 'center' },
      { text: 'Prowadzący', style: 'tableHeader' },
      { text: 'Cel funkcjonalny', style: 'tableHeader' },
    ],
    ...items.map((item): TableCell[] => [
      { text: safeText(item.type), style: 'tableCellBold' },
      { text: safeText(item.period), style: 'tableCell' },
      {
        text: `${item.hoursPerWeek} godz./tyg.`,
        style: 'tableCell',
        alignment: 'center',
      },
      { text: safeText(item.specialistName), style: 'tableCell' },
      { text: safeText(item.functionalGoal), style: 'tableCell' },
    ]),
  ];

  blocks.push({
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: ['22%', '16%', '13%', '18%', '31%'],
      body,
    },
    layout: TABLE_BORDER_LAYOUT,
  });

  return blocks;
}

function buildRehabClassesTable(
  items: StudentProfile['ipetDraft']['rehabAndSpecialClasses'],
): Content[] {
  const blocks: Content[] = [
    sectionHeader(
      '6. Zajęcia rewalidacyjne / socjoterapeutyczne / resocjalizacyjne',
    ),
  ];
  if (!items || items.length === 0) {
    blocks.push({
      text: 'Brak wpisanych zajęć rewalidacyjnych lub specjalistycznych.',
      style: 'bodyTextMuted',
    });
    return blocks;
  }

  const body: TableCell[][] = [
    [
      { text: 'Kategoria i nazwa zajęć', style: 'tableHeader' },
      { text: 'Okres', style: 'tableHeader' },
      { text: 'Wymiar', style: 'tableHeader', alignment: 'center' },
      { text: 'Specjalista', style: 'tableHeader' },
      { text: 'Cel funkcjonalny', style: 'tableHeader' },
    ],
    ...items.map((item): TableCell[] => [
      {
        stack: [
          {
            text: REHAB_CATEGORY_LABELS[item.category],
            fontSize: 7.5,
            color: '#475569',
          },
          { text: safeText(item.name), bold: true, fontSize: 8.5 },
        ],
      },
      { text: safeText(item.period), style: 'tableCell' },
      {
        text: `${item.hoursPerWeek} godz./tyg.`,
        style: 'tableCell',
        alignment: 'center',
      },
      { text: safeText(item.specialistName), style: 'tableCell' },
      { text: safeText(item.functionalGoal), style: 'tableCell' },
    ]),
  ];

  blocks.push({
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: ['25%', '14%', '13%', '18%', '30%'],
      body,
    },
    layout: TABLE_BORDER_LAYOUT,
  });

  return blocks;
}

function buildSignaturesBlock(
  options: PdfGenerationOptions,
  includeDirectorApproval: boolean,
): Content {
  const { student, settings, preparedDate } = options;
  const location = settings.city?.trim() || '........................';
  const members =
    student.teamMembers.length > 0
      ? student.teamMembers
      : [
          {
            id: 'coord',
            name: student.teamCoordinator || '........................................',
            role: 'Koordynator zespołu',
            isCoordinator: true,
          },
        ];

  const teamRows: TableCell[][] = [
    [
      { text: 'Lp.', style: 'tableHeader', alignment: 'center' },
      { text: 'Imię i nazwisko członka zespołu', style: 'tableHeader' },
      { text: 'Funkcja / stanowisko', style: 'tableHeader' },
      { text: 'Podpis i data', style: 'tableHeader' },
    ],
    ...members.map((m, idx): TableCell[] => [
      { text: `${idx + 1}.`, style: 'tableCell', alignment: 'center' },
      { text: m.name, style: 'tableCellBold' },
      {
        text: m.isCoordinator ? `${m.role} (Koordynator)` : m.role,
        style: 'tableCell',
      },
      { text: '\n', style: 'tableCell' },
    ]),
  ];

  if (members.length < 3) {
    teamRows.push([
      { text: `${members.length + 1}.`, style: 'tableCell', alignment: 'center' },
      { text: '', style: 'tableCell' },
      { text: '', style: 'tableCell' },
      { text: '\n', style: 'tableCell' },
    ]);
  }

  return {
    unbreakable: true,
    margin: [0, 14, 0, 0],
    stack: [
      {
        text: `${location}, dnia ${preparedDate}`,
        fontSize: 9,
        color: '#334155',
        margin: [0, 0, 0, 8],
      },
      {
        text: 'Podpisy członków zespołu nauczycieli i specjalistów',
        style: 'sectionHeading',
        margin: [0, 0, 0, 4],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [24, '30%', '34%', '30%'],
          body: teamRows,
        },
        layout: SIGNATURE_BORDER_LAYOUT,
      },
      ...(includeDirectorApproval
        ? [
            {
              table: {
                widths: ['*'],
                dontBreakRows: true,
                body: [
                  [
                    {
                      stack: [
                        {
                          text: 'Zatwierdzenie dokumentu przez Dyrektora placówki',
                          bold: true,
                          fontSize: 8.5,
                          color: '#0f172a',
                        },
                        {
                          text: settings.directorName?.trim()
                            ? `Dyrektor: ${settings.directorName.trim()}`
                            : 'Dyrektor placówki',
                          fontSize: 8,
                          color: '#475569',
                          margin: [0, 2, 0, 14] as [
                            number,
                            number,
                            number,
                            number,
                          ],
                        },
                        {
                          text: '....................................................                ....................................................',
                          fontSize: 8.5,
                          color: '#475569',
                        },
                        {
                          text: '              (miejscowość, data)                                      (pieczątka i podpis Dyrektora)',
                          fontSize: 7.5,
                          color: '#64748b',
                          margin: [0, 2, 0, 0] as [
                            number,
                            number,
                            number,
                            number,
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              layout: SIGNATURE_BORDER_LAYOUT,
              margin: [0, 8, 0, 0] as [number, number, number, number],
            } satisfies Content,
          ]
        : []),
      {
        table: {
          widths: ['*'],
          dontBreakRows: true,
          body: [
            [
              {
                stack: [
                  {
                    text: 'Potwierdzenie zapoznania się oraz otrzymania kopii dokumentu przez rodzica / opiekuna prawnego',
                    bold: true,
                    fontSize: 8.5,
                    color: '#0f172a',
                  },
                  {
                    text: 'Oświadczam, że zostałem/am zapoznany/a z treścią powyższego dokumentu, ustalonymi formami wsparcia oraz otrzymałem/am jego kopię (lub informację o programie i dostosowaniach).',
                    fontSize: 8,
                    color: '#334155',
                    margin: [0, 3, 0, 16],
                  },
                  {
                    columns: [
                      {
                        text: '............................................\n(data potwierdzenia)',
                        fontSize: 8,
                        color: '#475569',
                        alignment: 'center',
                      },
                      {
                        text: '........................................................................\n(czytelny podpis rodzica / opiekuna prawnego)',
                        fontSize: 8,
                        color: '#475569',
                        alignment: 'center',
                      },
                    ],
                  },
                ],
              },
            ],
          ],
        },
        layout: SIGNATURE_BORDER_LAYOUT,
        margin: [0, 8, 0, 0],
      },
    ],
  };
}

function buildVariant1IpetContent(options: PdfGenerationOptions): Content[] {
  const { student, annexes, includeWopfuInIpet = true } = options;
  const content: Content[] = [];

  if (student.documentType === 'ORZECZENIE') {
    content.push(
      ...buildOfficialHeader(
        'INDYWIDUALNY PROGRAM EDUKACYJNO-TERAPEUTYCZNY (IPET)',
        includeWopfuInIpet
          ? 'wraz z Wielospecjalistyczną Oceną Poziomu Funkcjonowania Ucznia (WOPFU)'
          : 'Opracowany na podstawie orzeczenia o potrzebie kształcenia specjalnego',
        options,
      ),
    );
    content.push(...buildTeamTable(student));

    if (includeWopfuInIpet) {
      const w = student.wopfuDraft;
      content.push(
        ...buildTextSectionTable(
          `Część I. Wielospecjalistyczna Ocena Poziomu Funkcjonowania Ucznia (WOPFU)${w.assessmentDate ? ` — data oceny: ${w.assessmentDate}` : ''}`,
          [
            {
              label: 'Uwarunkowania i kontekst funkcjonowania',
              value: w.conditionsAndContext,
            },
            {
              label: 'Funkcjonowanie poznawcze i edukacyjne',
              value: w.functioningAreas.cognitive,
            },
            {
              label: 'Komunikacja i język',
              value: w.functioningAreas.communication,
            },
            {
              label: 'Sfera emocjonalno-społeczna',
              value: w.functioningAreas.emotionalSocial,
            },
            {
              label: 'Motoryka i sfera sensoryczna',
              value: w.functioningAreas.motorSensory,
            },
            {
              label: 'Mocne strony, zasoby i zainteresowania ucznia',
              value:
                w.strengths.length > 0
                  ? w.strengths.map((s) => `• ${s}`).join('\n')
                  : '',
            },
            {
              label: 'Napotykane bariery i trudności w środowisku szkolnym',
              value:
                w.barriersAndNeeds.length > 0
                  ? w.barriersAndNeeds.map((b) => `• ${b}`).join('\n')
                  : '',
            },
            {
              label: 'Podsumowanie potrzeb rozwojowych i edukacyjnych',
              value: w.developmentalNeedsSummary,
            },
          ],
        ),
      );
    }

    const ipet = student.ipetDraft;
    content.push(
      ...buildTextSectionTable(
        `Część II. Indywidualny Program Edukacyjno-Terapeutyczny (IPET)${ipet.approvedDate ? ` — data zatwierdzenia: ${ipet.approvedDate}` : ''}`,
        [
          {
            label: '1. Cele edukacyjne i terapeutyczne',
            value: ipet.educationalAndTherapeuticGoals,
          },
          {
            label: '2. Metody i formy pracy z uczniem',
            value: ipet.methodsAndFormsOfWork,
          },
          {
            label: '4. Zintegrowane działania nauczycieli i specjalistów',
            value: ipet.integratedTeamActions,
          },
          {
            label: '7. Zakres i sposób współpracy z rodzicami / opiekunami',
            value: ipet.parentCollaborationNotes,
          },
        ],
      ),
    );

    content.push(
      ...buildSubjectAdaptationsTable(
        '3. Zakres dostosowania wymagań edukacyjnych (przedmioty i obszary)',
        ipet.subjectAdaptations,
      ),
    );
    content.push(
      ...buildSpecialistSupportTable(
        '5. Formy i okresy udzielania pomocy psychologiczno-pedagogicznej',
        ipet.specialistSupportHours,
      ),
    );
    content.push(...buildRehabClassesTable(ipet.rehabAndSpecialClasses));
  } else {
    const op = student.opinionSupportDraft;
    content.push(
      ...buildOfficialHeader(
        'KARTA DOSTOSOWANIA WYMAGAŃ EDUKACYJNYCH I POMOCY PPP',
        'Opracowana na podstawie opinii Poradni Psychologiczno-Pedagogicznej (bez wymogu pełnego IPET)',
        options,
      ),
    );
    content.push(...buildTeamTable(student));
    content.push(
      ...buildTextSectionTable(
        `Część I. Funkcjonowanie ucznia i współpraca z rodzicami${op.implementedDate ? ` — wdrożono: ${op.implementedDate}` : ''}`,
        [
          {
            label: 'Profil funkcjonalny i główne trudności ucznia',
            value: op.functionalProfileSummary,
          },
          {
            label: 'Zalecenia z opinii PPP',
            value: student.pppDocument.recommendationsSummary,
          },
          {
            label: 'Współpraca z rodzicami / opiekunami',
            value: op.parentCollaborationNotes,
          },
        ],
      ),
    );
    content.push(
      ...buildSubjectAdaptationsTable(
        'Część II. Zakres dostosowania wymagań edukacyjnych',
        op.subjectAdaptations,
      ),
    );
    content.push(
      ...buildSpecialistSupportTable(
        'Część III. Formy i okresy udzielania pomocy psychologiczno-pedagogicznej',
        op.psychologicalPedagogicalSupport,
      ),
    );
  }

  if (annexes.length > 0) {
    const sortedAnnexes = [...annexes].sort(
      (a, b) => a.versionNumber - b.versionNumber,
    );
    content.push(sectionHeader('Historia modyfikacji i aneksów do programu'));
    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: ['10%', '14%', '24%', '52%'],
        body: [
          [
            { text: 'Wersja', style: 'tableHeader', alignment: 'center' },
            { text: 'Data', style: 'tableHeader' },
            { text: 'Tytuł / typ decyzji', style: 'tableHeader' },
            { text: 'Zakres zmian lub uzasadnienie', style: 'tableHeader' },
          ],
          ...sortedAnnexes.map((a): TableCell[] => [
            { text: `v${a.versionNumber}`, style: 'tableCellBold', alignment: 'center' },
            { text: a.annexDate, style: 'tableCell' },
            { text: a.title, style: 'tableCellBold' },
            {
              text: `${a.changedSections.length > 0 ? `[${a.changedSections.join(', ')}] ` : ''}${a.changeDescription}`,
              style: 'tableCell',
            },
          ]),
        ],
      },
      layout: TABLE_BORDER_LAYOUT,
    });
  }

  content.push(
    buildSignaturesBlock(options, student.documentType === 'ORZECZENIE'),
  );
  return content;
}

function buildVariant2EvaluationContent(options: PdfGenerationOptions): Content[] {
  const { evaluations, annexes, selectedEvaluationId = 'ALL' } = options;
  const content: Content[] = [];

  content.push(
    ...buildOfficialHeader(
      'ARKUSZ OKRESOWEJ OCENY EFEKTYWNOŚCI WSPARCIA / SPRAWOZDANIE',
      'Wielospecjalistyczna ocena efektywności udzielanej pomocy psychologiczno-pedagogicznej i kształcenia specjalnego',
      options,
    ),
  );

  const filtered =
    selectedEvaluationId === 'ALL'
      ? [...evaluations].sort((a, b) =>
          b.evaluationDate.localeCompare(a.evaluationDate),
        )
      : evaluations.filter((e) => e.id === selectedEvaluationId);

  if (filtered.length === 0) {
    content.push(
      sectionHeader('Zapisane oceny okresowe'),
      {
        text: 'Brak zapisanych arkuszy oceny okresowej dla wybranego ucznia.',
        style: 'bodyTextMuted',
      },
    );
  } else {
    filtered.forEach((ev, index) => {
      const linkedAnnex = ev.linkedAnnexId
        ? annexes.find((a) => a.id === ev.linkedAnnexId)
        : undefined;
      content.push(
        sectionHeader(
          `${index + 1}. ${ev.periodLabel} (${ev.schoolYear}) — data oceny: ${ev.evaluationDate}`,
        ),
      );
      content.push({
        table: {
          dontBreakRows: true,
          widths: ['28%', '72%'],
          body: [
            [
              { text: 'Rodzaj i status oceny', style: 'metaLabel', fillColor: '#f8fafc' },
              {
                text: `${ev.type === 'WOPFU_AKTUALIZACJA' ? 'Aktualizacja WOPFU + ocena' : 'Okresowa ocena efektywności IPET / wsparcia'} · Status: ${ev.status === 'ZATWIERDZONA' ? 'Zatwierdzona' : 'Szkic roboczy'}`,
                style: 'bodyText',
              },
            ],
            [
              { text: 'Skład zespołu oceniającego', style: 'metaLabel', fillColor: '#f8fafc' },
              { text: safeText(ev.teamMembers), style: 'bodyText' },
            ],
            [
              { text: 'Ocena skuteczności wsparcia', style: 'metaLabel', fillColor: '#f8fafc' },
              {
                text: EFFECTIVENESS_RATING_LABELS[ev.effectivenessRating],
                style: 'tableCellBold',
              },
            ],
            [
              { text: 'Odniesienie do celów i obserwacji', style: 'metaLabel', fillColor: '#f8fafc' },
              { text: safeText(ev.goalsReferenceNotes), style: 'bodyText' },
            ],
            [
              { text: 'Podsumowanie postępów i wnioski', style: 'metaLabel', fillColor: '#f8fafc' },
              { text: safeText(ev.progressSummary), style: 'bodyText' },
            ],
            [
              { text: 'Decyzja zespołu / modyfikacje', style: 'metaLabel', fillColor: '#f8fafc' },
              {
                text:
                  ev.modificationDecision === 'WPROWADZONO_ANEKS'
                    ? `Wprowadzono modyfikację / aneks: ${safeText(ev.modificationsNeeded)}${linkedAnnex ? ` (Aneks v${linkedAnnex.versionNumber} z dn. ${linkedAnnex.annexDate})` : ''}`
                    : `Świadomy brak zmian w programie — uzasadnienie: ${safeText(ev.noChangeJustification)}`,
                style: 'bodyText',
              },
            ],
          ],
        },
        layout: TABLE_BORDER_LAYOUT,
      });
    });
  }

  content.push(buildSignaturesBlock(options, false));
  return content;
}

function buildVariant3JournalContent(options: PdfGenerationOptions): Content[] {
  const {
    student,
    journalEntries,
    annexes,
    evaluations,
    journalAreaFilter = 'ALL',
  } = options;
  const content: Content[] = [];

  content.push(
    ...buildOfficialHeader(
      'KARTA OBSERWACJI I PODSUMOWANIE DZIAŁAŃ',
      'Chronologiczny zapis obserwacji postępów, barier oraz zrealizowanych modyfikacji wsparcia',
      options,
    ),
  );

  const filteredEntries =
    journalAreaFilter === 'ALL'
      ? [...journalEntries].sort((a, b) => a.date.localeCompare(b.date))
      : journalEntries
          .filter((e) => e.relatedArea === journalAreaFilter)
          .sort((a, b) => a.date.localeCompare(b.date));

  const supportItems =
    student.documentType === 'ORZECZENIE'
      ? [
          ...student.ipetDraft.specialistSupportHours.map(
            (s) => `${s.type} (${s.hoursPerWeek} godz./tyg.)`,
          ),
          ...student.ipetDraft.rehabAndSpecialClasses.map(
            (r) => `${r.name} (${r.hoursPerWeek} godz./tyg.)`,
          ),
        ]
      : student.opinionSupportDraft.psychologicalPedagogicalSupport.map(
          (s) => `${s.type} (${s.hoursPerWeek} godz./tyg.)`,
        );

  content.push(sectionHeader('Podsumowanie zakresu działań i ciągłości wsparcia'));
  content.push({
    table: {
      dontBreakRows: true,
      widths: ['30%', '70%'],
      body: [
        [
          { text: 'Zakres wydruku obserwacji', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text:
              journalAreaFilter === 'ALL'
                ? `Wszystkie obszary funkcjonowania (${filteredEntries.length} wpisów)`
                : `Obszar: ${journalAreaFilter} (${filteredEntries.length} wpisów)`,
            style: 'bodyText',
          },
        ],
        [
          { text: 'Realizowane formy wsparcia', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text:
              supportItems.length > 0
                ? supportItems.join('; ')
                : 'Brak przypisanych godzin specjalistycznych',
            style: 'bodyText',
          },
        ],
        [
          { text: 'Liczba ocen okresowych i aneksów', style: 'metaLabel', fillColor: '#f8fafc' },
          {
            text: `Oceny okresowe: ${evaluations.length} · Zarejestrowane aneksy / decyzje o ciągłości: ${annexes.length}`,
            style: 'bodyText',
          },
        ],
      ],
    },
    layout: TABLE_BORDER_LAYOUT,
  });

  content.push(sectionHeader('Chronologiczny rejestr obserwacji i wniosków'));

  if (filteredEntries.length === 0) {
    content.push({
      text: 'Brak wpisów w dzienniku obserwacji spełniających wybrane kryteria.',
      style: 'bodyTextMuted',
    });
  } else {
    const body: TableCell[][] = [
      [
        { text: 'Data', style: 'tableHeader' },
        { text: 'Autor i rola', style: 'tableHeader' },
        { text: 'Obszar / kategoria', style: 'tableHeader' },
        { text: 'Przebieg obserwacji, bariery i wnioski', style: 'tableHeader' },
      ],
      ...filteredEntries.map((entry): TableCell[] => {
        const details: Content[] = [
          {
            text: safeText(entry.title),
            bold: true,
            fontSize: 8.5,
            color: '#0f172a',
            margin: [0, 0, 0, 2],
          },
        ];
        if (entry.content?.trim()) {
          details.push({
            text: entry.content.trim(),
            fontSize: 8,
            color: '#334155',
            margin: [0, 0, 0, 2],
          });
        }
        if (entry.whatWorked?.trim()) {
          details.push({
            text: `Co zadziałało: ${entry.whatWorked.trim()}`,
            fontSize: 8,
            color: '#115e59',
            margin: [0, 1, 0, 1],
          });
        }
        if (entry.barriersObserved?.trim()) {
          details.push({
            text: `Bariery: ${entry.barriersObserved.trim()}`,
            fontSize: 8,
            color: '#92400e',
            margin: [0, 1, 0, 1],
          });
        }
        if (entry.conclusions?.trim()) {
          details.push({
            text: `Wnioski: ${entry.conclusions.trim()}`,
            fontSize: 8,
            bold: true,
            color: '#1e293b',
            margin: [0, 1, 0, 0],
          });
        }

        return [
          { text: entry.date, style: 'tableCellBold' },
          {
            stack: [
              { text: safeText(entry.authorName), bold: true, fontSize: 8 },
              {
                text: safeText(entry.authorRole),
                fontSize: 7.5,
                color: '#475569',
              },
            ],
          },
          {
            stack: [
              {
                text: JOURNAL_CATEGORY_LABELS[entry.category],
                bold: true,
                fontSize: 7.5,
                color: '#1e3a8a',
              },
              {
                text: safeText(entry.relatedArea),
                fontSize: 7.5,
                color: '#475569',
                margin: [0, 2, 0, 0],
              },
            ],
          },
          { stack: details },
        ];
      }),
    ];

    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: ['11%', '17%', '20%', '52%'],
        body,
      },
      layout: TABLE_BORDER_LAYOUT,
    });
  }

  content.push(buildSignaturesBlock(options, false));
  return content;
}

export function buildPdfFileName(options: PdfGenerationOptions): string {
  const { variant, student, preparedDate } = options;
  const slug = `${student.lastName}_${student.firstName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const prefix =
    variant === 'IPET'
      ? student.documentType === 'ORZECZENIE'
        ? 'IPET_WOPFU'
        : 'Dostosowania_PPP'
      : variant === 'EVALUATION'
        ? 'Ocena_Okresowa'
        : 'Karta_Obserwacji';

  return `${prefix}_${slug}_${preparedDate}.pdf`;
}

export function buildPdfDocumentDefinition(
  options: PdfGenerationOptions,
): TDocumentDefinitions {
  const { variant, student } = options;

  let content: Content[];
  let docTitle: string;

  if (variant === 'IPET') {
    docTitle =
      student.documentType === 'ORZECZENIE'
        ? `IPET i WOPFU — ${student.firstName} ${student.lastName}`
        : `Karta dostosowań PPP — ${student.firstName} ${student.lastName}`;
    content = buildVariant1IpetContent(options);
  } else if (variant === 'EVALUATION') {
    docTitle = `Ocena okresowa — ${student.firstName} ${student.lastName}`;
    content = buildVariant2EvaluationContent(options);
  } else {
    docTitle = `Karta obserwacji — ${student.firstName} ${student.lastName}`;
    content = buildVariant3JournalContent(options);
  }

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [38, 36, 38, 46],
    info: {
      title: docTitle,
      author: options.settings.schoolName,
      subject: `Dokumentacja wsparcia ucznia (${APP_INFO.name} v${APP_INFO.version})`,
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      lineHeight: 1.28,
      color: '#0f172a',
    },
    styles: {
      docTitle: {
        fontSize: 13,
        bold: true,
        color: '#0f172a',
      },
      docSubtitle: {
        fontSize: 8.5,
        color: '#475569',
      },
      sectionHeading: {
        fontSize: 10,
        bold: true,
        color: '#1e3a8a',
      },
      metaLabel: {
        fontSize: 8,
        bold: true,
        color: '#334155',
      },
      metaValue: {
        fontSize: 8.5,
        color: '#0f172a',
      },
      metaValueBold: {
        fontSize: 8.5,
        bold: true,
        color: '#0f172a',
      },
      metaSmall: {
        fontSize: 7.5,
        color: '#334155',
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: '#0f172a',
        fillColor: '#f1f5f9',
      },
      tableCell: {
        fontSize: 8.5,
        color: '#1e293b',
      },
      tableCellBold: {
        fontSize: 8.5,
        bold: true,
        color: '#0f172a',
      },
      bodyText: {
        fontSize: 8.5,
        color: '#1e293b',
      },
      bodyTextMuted: {
        fontSize: 8.5,
        italics: true,
        color: '#64748b',
      },
    },
    footer: (currentPage, pageCount) => ({
      margin: [38, 6, 38, 0],
      stack: [
        {
          columns: [
            {
              text: `${options.settings.schoolName} · ${student.firstName} ${student.lastName} (kl. ${student.className})${student.isTestData ? ' · DANE TESTOWE' : ''}`,
              fontSize: 7.5,
              color: '#64748b',
            },
            {
              text: `Strona ${currentPage} z ${pageCount}`,
              fontSize: 7.5,
              color: '#64748b',
              alignment: 'right',
            },
          ],
        },
        {
          text: `Wzór pomocniczy (stan prawny na dzień ${LEGAL_FRAMEWORK_AS_OF_PL}) — nie zastępuje decyzji zespołu, dyrektora ani analizy przepisów.`,
          fontSize: 6.5,
          color: '#94a3b8',
          margin: [0, 1, 0, 0],
        },
      ],
    }),
    content,
  };
}

export async function generatePdfBuffer(
  options: PdfGenerationOptions,
): Promise<Uint8Array> {
  const pm = getPdfMakeInstance();
  const docDefinition = buildPdfDocumentDefinition(options);
  const pdfDoc = pm.createPdf(docDefinition) as unknown as {
    getBuffer: (() => Promise<Uint8Array>) & ((cb: (buf: Uint8Array) => void) => void);
  };
  const maybePromise = pdfDoc.getBuffer();
  if (maybePromise && typeof (maybePromise as Promise<Uint8Array>).then === 'function') {
    const buf = await (maybePromise as Promise<Uint8Array>);
    return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  }
  return await new Promise<Uint8Array>((resolve) => {
    pdfDoc.getBuffer((buf: Uint8Array) => {
      resolve(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
    });
  });
}

export async function generateAndDownloadPdf(
  options: PdfGenerationOptions,
): Promise<string> {
  const pm = getPdfMakeInstance();
  const docDefinition = buildPdfDocumentDefinition(options);
  const fileName = buildPdfFileName(options);
  const pdfDoc = pm.createPdf(docDefinition);
  await Promise.resolve(pdfDoc.download(fileName));
  return fileName;
}
