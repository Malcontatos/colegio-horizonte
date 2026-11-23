import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  LibraryBig,
  TrendingUp,
} from 'lucide-react';
import { api, resourceDownloadUrl } from '../../lib/api';
import type { StudentOverview } from '../../types';
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
} from '../../components/ui';
import {
  RESOURCE_TYPE_LABEL,
  SHIFT_LABEL,
  formatAverage,
  formatDate,
  formatGrade,
  gradeStatus,
  gradeTone,
} from '../../lib/format';
import { firstName } from '../../lib/utils';

const gradeTextTone = {
  good: 'text-teal-600',
  ok: 'text-gold-600',
  risk: 'text-red-600',
  muted: 'text-navy-400',
} as const;

const gradeBadgeTone = {
  good: 'green',
  ok: 'gold',
  risk: 'red',
  muted: 'neutral',
} as const;

export function StudentDashboard() {
  const { user } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ['student', 'overview'],
    queryFn: async () => {
      const response = await api.get<{ data: StudentOverview }>(
        '/student/overview',
      );
      return response.data;
    },
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${overview.enrollment.class.name} · ${SHIFT_LABEL[overview.enrollment.class.shift]} · ${overview.enrollment.year}`}
        title={`Olá, ${firstName(user?.name ?? overview.student.name)}`}
        description="Acompanhe seu desempenho, consulte as notas por disciplina e acesse os materiais da sua turma."
        actions={
          <>
            <ButtonLink
              to="/aluno/disciplinas"
              icon={<GraduationCap className="h-4 w-4" />}
            >
              Ver boletim
            </ButtonLink>
            <ButtonLink
              to="/aluno/biblioteca"
              variant="outline"
              icon={<LibraryBig className="h-4 w-4" />}
            >
              Biblioteca
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Média geral"
          value={formatAverage(overview.summary.average)}
          hint="Média simples de todas as notas lançadas."
          icon={<TrendingUp className="h-5 w-5" />}
          tone="navy"
        />
        <StatCard
          label="Disciplinas"
          value={overview.summary.subjects}
          hint="Disciplinas na grade da sua turma."
          icon={<BookOpen className="h-5 w-5" />}
          tone="teal"
        />
        <StatCard
          label="Notas lançadas"
          value={overview.summary.grades}
          hint="Avaliações registradas pelos professores."
          icon={<GraduationCap className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Materiais disponíveis"
          value={overview.summary.resources}
          hint="Arquivos publicados para a sua turma."
          icon={<FileText className="h-5 w-5" />}
          tone="cream"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader
            title="Desempenho por disciplina"
            description="Média das notas já lançadas em cada disciplina."
            action={
              <Link
                to="/aluno/disciplinas"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 transition hover:text-navy-900"
              >
                Boletim completo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-5 space-y-4">
            {overview.performance.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-cream-100 text-[9px] font-bold text-navy-600">
                      {item.code}
                    </span>
                    <span className="truncate text-sm font-medium text-navy-700">
                      {item.name}
                    </span>
                  </span>
                  <span
                    className={`font-display text-sm font-semibold ${gradeTextTone[gradeTone(item.average)]}`}
                  >
                    {formatAverage(item.average)}
                  </span>
                </div>
                <Meter value={item.average} className="mt-1.5" />
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-cream-100 pt-3 text-[11px] text-navy-400">
            Média de aprovação: 6,0 · As médias consideram apenas as notas já
            lançadas.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Notas recentes"
            description="Últimos lançamentos dos professores."
          />
          {overview.recentGrades.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-navy-200 px-4 py-8 text-center text-sm text-navy-400">
              Nenhuma nota lançada até o momento.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-cream-100">
              {overview.recentGrades.map((grade) => {
                const tone = gradeTone(grade.value);

                return (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-[9px] font-bold text-navy-600">
                        {grade.subject.code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-navy-800">
                          {grade.subject.name}
                        </p>
                        <p className="text-[11px] text-navy-400">
                          {grade.period}º período · {formatDate(grade.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`font-display text-lg font-semibold leading-none ${gradeTextTone[tone]}`}
                      >
                        {formatGrade(grade.value)}
                      </span>
                      <Badge tone={gradeBadgeTone[tone]}>
                        {gradeStatus(grade.value)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Materiais da sua turma"
          description="Materiais, atividades e avaliações publicados recentemente."
          action={
            <Link
              to="/aluno/biblioteca"
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 transition hover:text-navy-900"
            >
              Ver biblioteca
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {overview.recentResources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-start gap-3 rounded-xl border border-cream-200 bg-cream-50/50 p-3.5"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-navy-500 shadow-sm">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-navy-800">
                  {resource.title}
                </p>
                <p className="mt-1 truncate text-[11px] text-navy-400">
                  {resource.subject.name} ·{' '}
                  {RESOURCE_TYPE_LABEL[resource.type]}
                </p>
              </div>
              <a
                href={resourceDownloadUrl(resource.id)}
                aria-label={`Baixar ${resource.title}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-500 transition hover:bg-white hover:text-navy-900"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
