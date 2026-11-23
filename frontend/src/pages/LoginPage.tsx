import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LibraryBig,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth, homeForRole } from '../context/auth';
import { BrandLockup, BrandMark } from '../components/Brand';
import { Button, Field, FormError, Input } from '../components/ui';
import { ApiError } from '../lib/api';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    label: 'Administração',
    email: 'admin@colegiohorizonte.edu.br',
    password: 'Admin@123',
    icon: ShieldCheck,
  },
  {
    label: 'Professor',
    email: 'helena.martins@colegiohorizonte.edu.br',
    password: 'Professor@123',
    icon: BookOpenCheck,
  },
  {
    label: 'Aluno',
    email: 'ana.lima@aluno.colegiohorizonte.edu.br',
    password: 'Aluno@123',
    icon: GraduationCap,
  },
];

const highlights = [
  {
    icon: BookOpenCheck,
    title: 'Notas e boletim',
    text: 'Acompanhe o desempenho por disciplina e período.',
  },
  {
    icon: LibraryBig,
    title: 'Biblioteca digital',
    text: 'Materiais, atividades e avaliações em um só lugar.',
  },
  {
    icon: Sparkles,
    title: 'Rotina conectada',
    text: 'Professores e coordenação alinhados com as famílias.',
  },
];

export function LoginPage() {
  const { user, login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const sessionUser = await login(values);
      const state = location.state as { from?: string } | null;
      const destination =
        state?.from && state.from.startsWith('/')
          ? state.from
          : homeForRole(sessionUser.role);

      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível entrar. Tente novamente.',
      );
    }
  });

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
    clearErrors();
    setServerError(null);
  }

  return (
    <div className="bg-paper min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="bg-horizon relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 top-10 h-52 w-52 rounded-full border border-gold-400/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-gold-400/5 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <BrandLockup light />
        </div>

        <div className="relative my-auto max-w-lg py-14">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Portal Escolar
          </p>
          <h1 className="text-balance font-display text-[40px] font-semibold leading-[1.08] tracking-tight xl:text-[46px]">
            Educação que abre
            <span className="block text-gold-400">novos horizontes.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-navy-200">
            Um só ambiente para notas, materiais e acompanhamento pedagógico.
            Entre com o acesso da sua escola e continue de onde parou.
          </p>

          <div className="mt-10 space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-gold-300">
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-navy-300">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-navy-300">
          <p>Colégio Horizonte · Desde 1998</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
            Ambiente protegido
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:px-14 lg:py-10">
        <div className="flex items-center justify-between lg:hidden">
          <BrandLockup />
          <BrandMark className="h-9 w-9 opacity-0" />
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <div className="animate-rise">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
              Acesso ao portal
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-900">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              Use o e-mail institucional e a senha fornecidos pela secretaria.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <FormError message={serverError} />

              <Field label="E-mail institucional" htmlFor="email" error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nome@colegiohorizonte.edu.br"
                  autoFocus
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </Field>

              <Field label="Senha" htmlFor="password" error={errors.password?.message}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Sua senha de acesso"
                    className="pr-11"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                size="lg"
                loading={isLoggingIn}
                className="mt-2 w-full justify-between pr-4"
              >
                <span>{isLoggingIn ? 'Entrando...' : 'Entrar no portal'}</span>
                {!isLoggingIn && <ArrowRight className="h-4 w-4 text-gold-400" />}
              </Button>
            </form>

            <div className="mt-8 rounded-2xl border border-cream-200 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">
                  Acesso de demonstração
                </p>
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-600">
                  Dados fictícios
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemo(account)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-2.5 py-2 text-left transition',
                      'hover:border-gold-300 hover:bg-gold-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                    )}
                  >
                    <account.icon className="h-4 w-4 shrink-0 text-navy-500" />
                    <span className="text-[11px] font-semibold leading-tight text-navy-700">
                      {account.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-navy-400">
                Clique em um perfil para preencher o formulário automaticamente.
              </p>
            </div>

            <p className="mt-8 text-center text-xs leading-relaxed text-navy-400">
              Problemas para entrar? Procure a secretaria do colégio ou envie um
              e-mail para{' '}
              <a
                href="mailto:secretaria@colegiohorizonte.edu.br"
                className="font-medium text-navy-600 underline decoration-gold-400 decoration-2 underline-offset-2 hover:text-navy-900"
              >
                secretaria@colegiohorizonte.edu.br
              </a>
              .
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-navy-300">
          © {new Date().getFullYear()} Colégio Horizonte · Portal Escolar
        </p>
      </main>
    </div>
  );
}
