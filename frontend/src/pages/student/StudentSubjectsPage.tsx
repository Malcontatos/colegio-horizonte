import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LibraryBig,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { StudentSubjectsResponse } from '../../types';
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Meter,
  PageHeader,
  Skeleton,
  StatCard,
} from '../../components/ui';
import {
  formatAverage,
  formatGrade,
  gradeStatus,
  gradeTone,
} from '../../lib/format';
import { cn } from '../../lib/utils';

const PERIODS = [1, 2, 3, 4];

const cellTone = {
  good: 'border-teal-100 bg-teal-100/50 text-teal-700',
  ok: 'border-gold-200 bg-gold-100/60 text-gold-600',
  risk: 'border-red-200 bg-red-50 text-red-700',
  muted: 'border-cream-200 bg-cream-50 text-navy-300',
} as const;

const badgeTone = {
  good: 'green',
  ok: 'gold',
  risk: 'red',
  muted: 'neutral',
} as const;

export function StudentSubjectsPage() {
  const subjectsQuery = useQuery({
    queryKey: ['student', 'subjects'],
    queryFn: async () => {
      const response = await api.get<{ data: StudentSubjectsResponse }>(
        '/student/subjects',
      );
      return response.data;
    },
  });

  if (subjectsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52" />
          ))}
        </div>
      </div>
    );
  }

  if (subjectsQuery.isError) {
    return (
      <ErrorState
        error={subjectsQuery.error}
        onRetry={() => subjectsQuery.refetch()}
      />
    );
  }

  const data = subjectsQuery.data!;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Boletim"
        title="Minhas disciplinas"
        description="Consulte as notas de cada período, a média por disciplina e os professores responsáveis."
        actions={
          <ButtonLink
            to="/aluno/biblioteca"
            variant="outline"
            icon={<LibraryBig className="h-4 w-4" />}
          >
            Ir para a biblioteca
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Média geral"
          value={formatAverage(data.summary.average)}
          hint="Média de todas as notas lançadas."
          icon={<TrendingUp className="h-5 w-5" />}
          tone="navy"
        />
        <StatCard
          label="Notas lançadas"
          value={data.summary.totalGrades}
          hint="Avaliações registradas até agora."
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Disciplinas com nota"
          value={`${data.summary.subjectsWithGrades}/${data.subjects.length}`}
          hint="Disciplinas que já possuem lançamentos."
          icon={<GraduationCap className="h-5 w-5" />}
          tone="teal"
        />
      </div>

      {data.subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Nenhuma disciplina disponível"
          description="Sua turma ainda não possui disciplinas vinculadas. Procure a secretaria."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.subjects.map((subject) => {
            const tone = gradeTone(subject.average);

            return (
              <Card
                key={subject.id}
                className={cn(
                  'flex flex-col',
                  tone === 'risk' && 'border-red-200',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 font-display text-[10px] font-semibold tracking-wider text-gold-300">
                      {subject.code}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-navy-900">
                        {subject.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-navy-400">
                        <UserRound className="h-3 w-3 shrink-0" />
                        {subject.teachers.length > 0
                          ? subject.teachers.map((teacher) => teacher.name).join(', ')
                          : 'Professor a definir'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                      Média
                    </p>
                    <p
                      className={cn(
                        'font-display text-2xl font-semibold leading-none',
                        tone === 'good' && 'text-teal-600',
                        tone === 'ok' && 'text-gold-600',
                        tone === 'risk' && 'text-red-600',
                        tone === 'muted' && 'text-navy-300',
                      )}
                    >
                      {formatAverage(subject.average)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {PERIODS.map((period) => {
                    const grade = subject.grades.find(
                      (item) => item.period === period,
                    );
                    const periodTone = gradeTone(grade?.value);

                    return (
                      <div
                        key={period}
                        className={cn(
                          'rounded-lg border px-2 py-2 text-center',
                          cellTone[periodTone],
                        )}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                          {period}º per.
                        </p>
                        <p className="mt-0.5 font-display text-sm font-semibold">
                          {grade ? formatGrade(grade.value) : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Meter value={subject.average} className="mt-4" />

                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-navy-400">
                  <span>
                    Carga horária: {subject.workload}h ·{' '}
                    {subject.grades.length}{' '}
                    {subject.grades.length === 1 ? 'nota' : 'notas'}
                  </span>
                  <Badge tone={badgeTone[tone]}>
                    {subject.average === null
                      ? 'Sem notas'
                      : gradeStatus(subject.average)}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 text-xs text-navy-500 shadow-card">
        <p>
          Precisa de um material específico? Consulte a{' '}
          <Link
            to="/aluno/biblioteca"
            className="font-semibold text-navy-700 underline decoration-gold-400 decoration-2 underline-offset-2"
          >
            biblioteca da turma
          </Link>
          .
        </p>
        <span className="flex items-center gap-1.5">
          <ArrowUpRight className="h-3.5 w-3.5 text-gold-500" />
          Notas atualizadas pelos professores em tempo real.
        </span>
      </div>
    </div>
  );
}
