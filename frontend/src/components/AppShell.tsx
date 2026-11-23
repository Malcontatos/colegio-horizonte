import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ClipboardPenLine,
  FolderOpen,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  Link2,
  LogOut,
  Menu,
  School,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, homeForRole } from '../context/auth';
import { ROLE_LABEL } from '../lib/format';
import { cn, todayLong, schoolYear } from '../lib/utils';
import { BrandLockup, BrandMark } from './Brand';
import { Avatar, IconButton } from './ui';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const NAV: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: '/admin/alunos', label: 'Alunos', icon: GraduationCap },
    { to: '/admin/professores', label: 'Professores', icon: Users },
    { to: '/admin/disciplinas', label: 'Disciplinas', icon: BookOpen },
    { to: '/admin/turmas', label: 'Turmas', icon: School },
    { to: '/admin/vinculos', label: 'Vínculos de ensino', icon: Link2 },
  ],
  TEACHER: [
    { to: '/professor', label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: '/professor/notas', label: 'Lançar notas', icon: ClipboardPenLine },
    { to: '/professor/materiais', label: 'Materiais', icon: FolderOpen },
  ],
  STUDENT: [
    { to: '/aluno', label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: '/aluno/disciplinas', label: 'Minhas disciplinas', icon: BookOpen },
    { to: '/aluno/biblioteca', label: 'Biblioteca', icon: LibraryBig },
  ],
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const items = NAV[user.role] ?? [];
  const home = homeForRole(user.role);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex items-center justify-between px-5 py-6">
        <Link to={home} onClick={onNavigate} aria-label="Ir para o início">
          <BrandLockup light />
        </Link>
        {onNavigate && (
          <IconButton label="Fechar menu" tone="light" onClick={onNavigate}>
            <X className="h-5 w-5" />
          </IconButton>
        )}
      </div>

      <div className="mx-5 h-px bg-white/10" />

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Menu principal">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy-300/70">
          {ROLE_LABEL[user.role]}
        </p>
        <div className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-navy-200 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition',
                      isActive ? 'text-gold-400' : 'text-navy-300',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-2 text-gold-300">
            <CalendarDays className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              Ano letivo {schoolYear()}
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-navy-300">
            Consulte o calendário acadêmico e os comunicados da secretaria.
          </p>
        </div>
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-xl bg-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={user.name}
              size="sm"
              tone="gold"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-navy-300">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              to="/conta/senha"
              onClick={onNavigate}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-navy-100 transition hover:bg-white/15"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Senha
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-navy-100 transition hover:bg-red-500/20 hover:text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-[280px] max-w-[85vw] shadow-lift animate-rise">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton
                label="Abrir menu"
                className="lg:hidden"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </IconButton>
              <Link to={homeForRole(user.role)} className="lg:hidden">
                <BrandMark className="h-8 w-8" />
              </Link>
              <div className="hidden sm:block">
                <p className="text-[11px] font-medium first-letter:uppercase tracking-wide text-navy-400">
                  {todayLong()}
                </p>
                <p className="text-[13px] font-semibold text-navy-800">
                  Ano letivo {schoolYear()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                to="/conta/senha"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-navy-600 transition hover:bg-navy-100 sm:inline-flex"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Alterar senha
              </Link>
              <span className="hidden h-6 w-px bg-cream-200 sm:block" />
              <div className="flex items-center gap-2 rounded-full border border-cream-200 bg-white py-1 pl-1 pr-3 shadow-sm">
                <Avatar name={user.name} size="sm" />
                <div className="hidden leading-tight md:block">
                  <p className="max-w-[180px] truncate text-[12px] font-semibold text-navy-800">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gold-600">
                    {ROLE_LABEL[user.role]}
                  </p>
                </div>
              </div>
              <IconButton label="Sair da conta" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
          <Outlet />
        </main>

        <footer className="border-t border-cream-200/70 px-4 py-5 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 text-[11px] text-navy-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {schoolYear()} Colégio Horizonte · Portal Escolar
            </p>
            <p>Educação que abre horizontes.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
