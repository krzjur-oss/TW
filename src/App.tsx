import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import {
  BookMarked,
  FileUp,
  Lock,
  Menu,
  Moon,
  Scale,
  Settings,
  Sun,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  DEFAULT_FACILITY_SETTINGS,
  deleteStudentAndRelated,
  getDatabaseStats,
  getFacilitySettings,
  hasTestOpinionStudent,
  hasTestStudent,
  listStudents,
  loadTestOpinionStudentBundle,
  loadTestStudentBundle,
  removeTestStudentBundle,
  saveFacilitySettings,
  saveStudent,
  type DatabaseStats,
} from './db/database';
import { AboutAndLegalView } from './components/AboutAndLegalView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SettingsView } from './components/SettingsView';
import { StudentDetailView } from './components/StudentDetailView';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentListView } from './components/StudentListView';
import { AppLockScreen } from './components/security/AppLockScreen';
import { StudentImportModal } from './components/security/StudentImportModal';
import { APP_INFO } from './config/appInfo';
import type { FacilitySettings, StudentProfile } from './types/domain';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentMatch = useMatch('/uczen/:studentId');

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [settings, setSettings] = useState<FacilitySettings>(
    DEFAULT_FACILITY_SETTINGS,
  );
  const [stats, setStats] = useState<DatabaseStats>({
    studentsCount: 0,
    testStudentsCount: 0,
    journalEntriesCount: 0,
    evaluationsCount: 0,
    annexesCount: 0,
  });
  const [hasTestStudentLoaded, setHasTestStudentLoaded] = useState(false);
  const [hasTestOpinionLoaded, setHasTestOpinionLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(
    null,
  );
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const initialLockCheckedRef = useRef(false);

  const selectedStudentId = studentMatch?.params.studentId
    ? decodeURIComponent(studentMatch.params.studentId)
    : null;

  const selectedStudent =
    selectedStudentId !== null
      ? students.find((s) => s.id === selectedStudentId) ?? null
      : null;

  const isSettingsRoute = location.pathname === '/ustawienia';
  const isAboutRoute = location.pathname === '/o-programie';
  const isStudentsSection = !isSettingsRoute && !isAboutRoute;
  const isStudentListRoute =
    location.pathname === '/' || location.pathname === '/uczniowie';

  const applyThemeClass = useCallback((theme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const refreshData = useCallback(async () => {
    const [
      loadedStudents,
      loadedSettings,
      dbStats,
      testExists,
      testOpinionExists,
    ] = await Promise.all([
      listStudents(),
      getFacilitySettings(),
      getDatabaseStats(),
      hasTestStudent(),
      hasTestOpinionStudent(),
    ]);
    setStudents(loadedStudents);
    setSettings(loadedSettings);
    setStats(dbStats);
    setHasTestStudentLoaded(testExists);
    setHasTestOpinionLoaded(testOpinionExists);
    applyThemeClass(loadedSettings.theme);

    if (!initialLockCheckedRef.current) {
      initialLockCheckedRef.current = true;
      setIsUnlocked(!loadedSettings.appLock?.enabled);
    }
  }, [applyThemeClass]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshData();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshData]);

  const handleSaveStudent = async (student: StudentProfile) => {
    await saveStudent(student);
    await refreshData();
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudentAndRelated(studentId);
    if (selectedStudentId === studentId) {
      navigate('/');
    }
    await refreshData();
  };

  const handleSaveSettings = async (
    patch: Partial<Omit<FacilitySettings, 'id'>>,
  ) => {
    const updated = await saveFacilitySettings(patch);
    setSettings(updated);
    applyThemeClass(updated.theme);
  };

  const handleToggleTheme = async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    await handleSaveSettings({ theme: nextTheme });
  };

  const handleToggleTestStudent = async () => {
    if (hasTestStudentLoaded) {
      await removeTestStudentBundle();
      if (
        selectedStudentId === 'test-student-jan-kowalski' ||
        selectedStudentId === 'test-student-zuzanna-wisniewska'
      ) {
        navigate('/');
      }
    } else {
      await loadTestStudentBundle();
    }
    await refreshData();
  };

  const handleLoadTestOpinionStudent = async () => {
    await loadTestOpinionStudentBundle();
    await refreshData();
  };

  const openNewStudentModal = () => {
    setEditingStudent(null);
    setFormModalOpen(true);
  };

  const openEditStudentModal = (student: StudentProfile) => {
    setEditingStudent(student);
    setFormModalOpen(true);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const pageTitle = isSettingsRoute
    ? 'Ustawienia placówki'
    : isAboutRoute
      ? 'O programie i przepisy prawa'
      : selectedStudent
        ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
        : 'Lista uczniów';

  const handleLockNow = () => {
    setMobileMenuOpen(false);
    setIsUnlocked(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300 text-sm">
        Wczytywanie lokalnej bazy danych...
      </div>
    );
  }

  if (settings.appLock?.enabled && !isUnlocked) {
    return (
      <>
        <AppLockScreen
          schoolName={settings.schoolName}
          lockConfig={settings.appLock}
          onUnlock={() => setIsUnlocked(true)}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Pasek boczny desktop */}
      <aside className="print:hidden hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-white shrink-0">
            <BookMarked className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Teczka Wsparcia
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Nawigacja główna">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isStudentsSection
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0" />
              <span>Uczniowie</span>
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('/ustawienia')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isSettingsRoute
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Ustawienia placówki</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('/o-programie')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isAboutRoute
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
            }`}
          >
            <Scale className="h-4 w-4 shrink-0" />
            <span>O programie i prawo</span>
          </button>
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3 dark:border-slate-800">
          <div className="text-xs leading-snug text-slate-500 dark:text-slate-400">
            <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
              {settings.schoolName}
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2 font-mono tabular-nums">
              <span>Rok {settings.defaultSchoolYear}</span>
              <button
                type="button"
                onClick={() => navigateTo('/o-programie')}
                title="Zobacz opis programu i przepisy prawa"
                className="text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
              >
                v{APP_INFO.version}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleTheme}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {settings.theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Tryb jasny dzienny</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Tryb ciemny</span>
              </>
            )}
          </button>

          {settings.appLock?.enabled && (
            <button
              type="button"
              onClick={handleLockNow}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50 whitespace-nowrap shrink-0"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Zablokuj aplikację</span>
            </button>
          )}

          <PWAInstallButton variant="sidebar" />
        </div>
      </aside>

      {/* Szuflada mobilna */}
      {mobileMenuOpen && (
        <div className="print:hidden fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-white">
                  <BookMarked className="h-4 w-4" />
                </div>
                <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Teczka Wsparcia
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Zamknij menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isStudentsSection
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4" />
                  <span>Uczniowie</span>
                </span>
                <span className="font-mono text-xs tabular-nums">
                  {students.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/ustawienia')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isSettingsRoute
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Ustawienia placówki</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/o-programie')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isAboutRoute
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>O programie i prawo</span>
              </button>
            </nav>

            <div className="border-t border-slate-200 p-4 space-y-3 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {settings.schoolName}
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('/o-programie')}
                  className="font-mono tabular-nums shrink-0 hover:text-blue-700 dark:hover:text-blue-400"
                >
                  v{APP_INFO.version}
                </button>
              </div>
              <button
                type="button"
                onClick={handleToggleTheme}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                {settings.theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Tryb jasny dzienny</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Tryb ciemny</span>
                  </>
                )}
              </button>
              {settings.appLock?.enabled && (
                <button
                  type="button"
                  onClick={handleLockNow}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Zablokuj aplikację</span>
                </button>
              )}
              <PWAInstallButton variant="sidebar" />
            </div>
          </aside>
        </div>
      )}

      {/* Główny obszar roboczy */}
      <div className="flex flex-1 flex-col lg:pl-64 print:pl-0 min-w-0">
        <header className="print:hidden sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Otwórz menu nawigacji"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => navigateTo('/')}
                  className="hover:text-slate-800 dark:hover:text-slate-200 truncate"
                >
                  Dokumentacja wsparcia
                </button>
                <span aria-hidden="true">/</span>
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {pageTitle}
                </span>
              </div>
              <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStudentListRoute && (
              <>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <FileUp className="h-3.5 w-3.5 shrink-0" />
                  <span>Importuj .ipet</span>
                </button>
                <button
                  type="button"
                  onClick={openNewStudentModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Dodaj ucznia</span>
                </button>
              </>
            )}
            {settings.appLock?.enabled && (
              <button
                type="button"
                onClick={handleLockNow}
                title="Zablokuj aplikację"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50 whitespace-nowrap shrink-0"
              >
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Zablokuj</span>
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0">
          <Routes>
            <Route
              path="/"
              element={
                <StudentListView
                  students={students}
                  loading={loading}
                  onSelectStudent={(id) =>
                    navigate(`/uczen/${encodeURIComponent(id)}`)
                  }
                  onAddStudent={openNewStudentModal}
                  onImportStudent={() => setImportModalOpen(true)}
                  onEditStudent={openEditStudentModal}
                  onGoToSettings={() => navigateTo('/ustawienia')}
                />
              }
            />
            <Route path="/uczniowie" element={<Navigate to="/" replace />} />
            <Route
              path="/uczen/:studentId"
              element={
                selectedStudent ? (
                  <StudentDetailView
                    student={selectedStudent}
                    facilitySettings={settings}
                    defaultTeamRole={settings.defaultTeamRole}
                    onBack={() => navigate('/')}
                    onEditStudent={openEditStudentModal}
                    onSaveStudent={handleSaveStudent}
                    onDeleteStudent={handleDeleteStudent}
                    onDataChanged={refreshData}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/ustawienia"
              element={
                <SettingsView
                  settings={settings}
                  stats={stats}
                  hasTestStudentLoaded={hasTestStudentLoaded}
                  hasTestOpinionLoaded={hasTestOpinionLoaded}
                  onSaveSettings={handleSaveSettings}
                  onToggleTestStudent={handleToggleTestStudent}
                  onLoadTestOpinionStudent={handleLoadTestOpinionStudent}
                  onDatabaseRestored={refreshData}
                  onLockNow={handleLockNow}
                />
              }
            />
            <Route path="/o-programie" element={<AboutAndLegalView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <StudentFormModal
        open={formModalOpen}
        initialStudent={editingStudent}
        defaultSchoolYear={settings.defaultSchoolYear}
        onSave={handleSaveStudent}
        onClose={() => {
          setFormModalOpen(false);
          setEditingStudent(null);
        }}
      />

      <StudentImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={async (studentId) => {
          await refreshData();
          navigate(`/uczen/${encodeURIComponent(studentId)}`);
        }}
      />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
