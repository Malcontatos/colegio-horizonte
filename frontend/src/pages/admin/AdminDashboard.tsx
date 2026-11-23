import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  School,
  UserPlus,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { AdminOverview } from '../../types';
import { useAuth } from '../../context/auth';
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  ErrorState,
  Meter,
  PageHeader,
  Skeleton,
  StatCard,
  TableShell,
  Td,
  Th,
} from '../../components/ui';
import {
  RESOURCE_TYPE_LABEL,
  SHIFT_LABEL,
  formatDate,
} from '../../lib/format';
import { firstName } from '../../lib/utils';

export function AdminDashboard() {
  const { user } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const response = await api.get<{ data: AdminOverview }>(
        '/admin/overview',
      );
      return response.data;
    },
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <ErrorState
        error={overviewQuery.error}
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data!;
  const { counts } = overview;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Painel administrativo"
        title={`Olá, ${firstName(user?.name ?? '')}`}
        description="Acompanhe a operação do colégio, gerencie acessos e mantenha a estrutura pedagógica em dia."
        actions={
          <>
            <ButtonLink
              to="/admin/alunos"
              icon={<UserPlus className="h-4 w-4" />}
            >
              Cadastrar aluno
            </ButtonLink>
            <ButtonLink
              to="/admin/vinculos"
              variant="outline"
              icon={<ArrowUpRight className="h-4 w-4" />}
            >
              Ver vínculos
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alunos matriculados"
          value={counts.students}
          hint="Matrículas ativas no ano letivo corrente."
          icon={<GraduationCap className="h-5 w-5" />}
          tone="navy"
        />
        <StatCard
          label="Corpo docente"
          value={counts.teachers}
          hint={`${counts.subjects} disciplinas na grade curricular.`}
          icon={<Users className="h-5 w-5" />}
          tone="teal"
        />
        <StatCard
          label="Turmas ativas"
          value={counts.classes}
          hint="Turmas com vínculos de ensino configurados."
          icon={<School className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Materiais publicados"
          value={counts.resources}
          hint={`${counts.grades} notas registradas pelos professores.`}
          icon={<FolderOpen className="h-5 w-5" />}
          tone="cream"
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader
            title="Turmas em operação"
            description="Distribuição de alunos e vínculos por turma."
            action={
              <Link
                to="/admin/turmas"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 transition hover:text-navy-900"
              >
                Gerenciar
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-4 divide-y divide-cream-100">
            {overview.classes.map((schoolClass) => (
              <div key={schoolClass.id} className="py-3.5 first:pt-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 font-display text-[11px] font-semibold text-navy-700">
                      {schoolClass.name.split(' ')[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-800">
                        {schoolClass.name}
                      </p>
                      <p className="text-[11px] text-navy-400">
                        {SHIFT_LABEL[schoolClass.shift]} ·{' '}
                        {schoolClass.assignments} vínculos de ensino
                      </p>
                    </div>
                  </div>
                  <Badge tone="navy">{schoolClass.students} alunos</Badge>
                </div>
                <Meter
                  value={Math.min(10, (schoolClass.students / 30) * 10)}
                  tone="gold"
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Últimos materiais"
            description="Publicações recentes na biblioteca digital."
            action={
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                <BookOpen className="h-4 w-4" />
              </span>
            }
          />
          <div className="mt-4 space-y-3">
            {overview.recentResources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-start gap-3 rounded-xl border border-cream-100 bg-cream-50/50 p-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-navy-500 shadow-sm">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-navy-800">
                    {resource.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-navy-400">
                    {resource.subject.name} · {resource.class?.name ?? 'Todas as turmas'}
                  </p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-navy-300">
                    {RESOURCE_TYPE_LABEL[resource.type]} ·{' '}
                    {formatDate(resource.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <CardHeader
            title="Matrículas recentes"
            description="Últimos alunos cadastrados no portal."
          />
          <Link
            to="/admin/alunos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 transition hover:text-navy-900"
          >
            Ver todos
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <TableShell className="rounded-none border-0 shadow-none">
          <thead>
            <tr>
              <Th>Aluno</Th>
              <Th>Matrícula</Th>
              <Th>Turma</Th>
              <Th>Situação</Th>
              <Th className="text-right">Ano letivo</Th>
            </tr>
          </thead>
          <tbody>
            {overview.recentStudents.map((student) => (
              <tr key={student.id} className="transition hover:bg-cream-50/60">
                <Td>
                  <p className="font-semibold text-navy-800">
                    {student.user.name}
                  </p>
                  <p className="text-xs text-navy-400">{student.user.email}</p>
                </Td>
                <Td className="font-mono text-xs">{student.registrationNumber}</Td>
                <Td>
                  {student.enrollment ? (
                    <Badge tone="outline">
                      {student.enrollment.class.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-navy-400">Sem turma</span>
                  )}
                </Td>
                <Td>
                  <Badge tone={student.active ? 'green' : 'red'}>
                    {student.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </Td>
                <Td className="text-right text-xs text-navy-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    {student.enrollment?.year ?? '—'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>
    </div>
  );
}
