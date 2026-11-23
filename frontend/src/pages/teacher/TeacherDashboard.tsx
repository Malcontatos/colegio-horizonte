import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardPenLine,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  School,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { TeacherOverview } from '../../types';
import { useAuth } from '../../context/auth';
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from '../../components/ui';
import {
  RESOURCE_TYPE_LABEL,
  SHIFT_LABEL,
  formatDate,
} from '../../lib/format';
import { firstName } from '../../lib/utils';

export function TeacherDashboard() {
  const { user } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ['teacher', 'overview'],
    queryFn: async () => {
      const response = await api.get<{ data: TeacherOverview }>(
        '/teacher/overview',
      );
      return response.data;
    },
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72" />
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
        eyebrow="Área do professor"
        title={`Olá, ${firstName(user?.name ?? '')}`}
        description="Acesse rapidamente suas turmas, lance notas e compartilhe materiais com os alunos."
        actions={
          <ButtonLink
            to="/professor/notas"
            icon={<ClipboardPenLine className="h-4 w-4" />}
          >
            Lançar notas
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Turmas atendidas"
          value={overview.summary.classes}
          hint={`${overview.summary.assignments} vínculos de ensino.`}
          icon={<School className="h-5 w-5" />}
          tone="navy"
        />
        <StatCard
          label="Disciplinas"
          value={overview.summary.subjects}
          hint="Disciplinas sob sua responsabilidade."
          icon={<BookOpen className="h-5 w-5" />}
          tone="teal"
        />
        <StatCard
          label="Notas lançadas"
          value={overview.summary.grades}
          hint="Registros no histórico acadêmico."
          icon={<GraduationCap className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Materiais publicados"
          value={overview.summary.resources}
          hint="Arquivos disponíveis na biblioteca."
          icon={<FolderOpen className="h-5 w-5" />}
          tone="cream"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">
              Minhas turmas e disciplinas
            </h2>
            <p className="mt-0.5 text-sm text-navy-500">
              Abra o diário para lançar ou revisar as notas do período.
            </p>
          </div>
          <Badge tone="navy">{overview.assignments.length} vínculos</Badge>
        </div>

        {overview.assignments.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm font-medium text-navy-700">
              Nenhum vínculo de ensino atribuído.
            </p>
            <p className="mt-1 text-sm text-navy-500">
              Procure a coordenação para ser associado às suas turmas.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overview.assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="group flex flex-col transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 font-display text-[10px] font-semibold tracking-wider text-gold-300">
                    {assignment.subject.code}
                  </span>
                  <Badge tone="outline">
                    {SHIFT_LABEL[assignment.class.shift]}
                  </Badge>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-navy-900">
                  {assignment.subject.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-navy-500">
                  <Layers className="h-3.5 w-3.5 text-navy-300" />
                  {assignment.class.name} · {assignment.class.year}
                </p>
                <p className="mt-1 text-[11px] text-navy-400">
                  {assignment.subject.workload} horas anuais
                </p>
                <ButtonLink
                  to={`/professor/notas?subjectId=${assignment.subject.id}&classId=${assignment.class.id}`}
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  icon={<ClipboardPenLine className="h-3.5 w-3.5" />}
                >
                  Abrir diário
                </ButtonLink>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Publicações recentes"
            description="Últimos materiais que você enviou."
            action={
              <Link
                to="/professor/materiais"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 transition hover:text-navy-900"
              >
                Gerenciar
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {overview.recentResources.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-navy-200 px-4 py-8 text-center">
              <FileText className="mx-auto h-6 w-6 text-navy-300" />
              <p className="mt-2 text-sm font-medium text-navy-600">
                Nenhum material publicado ainda
              </p>
              <p className="mt-1 text-xs text-navy-400">
                Compartilhe listas, roteiros e atividades com suas turmas.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {overview.recentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-start gap-3 rounded-xl border border-cream-100 bg-cream-50/50 p-3"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-navy-500 shadow-sm">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-navy-800">
                      {resource.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-navy-400">
                      {resource.subject.name} ·{' '}
                      {resource.class?.name ?? 'Todas as turmas'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone="gold">
                      {RESOURCE_TYPE_LABEL[resource.type]}
                    </Badge>
                    <p className="mt-1 text-[10px] text-navy-300">
                      {formatDate(resource.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-navy-900 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
            Atalhos do professor
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold">
            Tudo o que você precisa em um só lugar
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-navy-200">
            Registre o desempenho da turma e mantenha os materiais organizados
            por disciplina e período.
          </p>
          <div className="mt-5 space-y-2">
            <Link
              to="/professor/notas"
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2.5">
                <ClipboardPenLine className="h-4 w-4 text-gold-400" />
                Diário de notas
              </span>
              <ArrowUpRight className="h-4 w-4 text-navy-300" />
            </Link>
            <Link
              to="/professor/materiais"
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2.5">
                <FolderOpen className="h-4 w-4 text-gold-400" />
                Biblioteca de materiais
              </span>
              <ArrowUpRight className="h-4 w-4 text-navy-300" />
            </Link>
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-navy-300">
            As notas ficam disponíveis imediatamente no boletim dos alunos.
          </p>
        </Card>
      </div>
    </div>
  );
}
