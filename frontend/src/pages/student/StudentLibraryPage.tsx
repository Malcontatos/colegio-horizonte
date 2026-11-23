import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  LibraryBig,
  SearchX,
} from 'lucide-react';
import { api, resourceDownloadUrl } from '../../lib/api';
import type {
  Resource,
  ResourceType,
  StudentSubjectsResponse,
} from '../../types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchField,
  Select,
  Skeleton,
} from '../../components/ui';
import {
  RESOURCE_TYPE_LABEL,
  formatBytes,
  formatDate,
  formatDownloads,
} from '../../lib/format';
import { cn } from '../../lib/utils';

const TYPE_ICON = {
  MATERIAL: BookOpen,
  ACTIVITY: ClipboardList,
  ASSESSMENT: FileCheck2,
} as const;

const TYPE_TONE = {
  MATERIAL: 'navy',
  ACTIVITY: 'gold',
  ASSESSMENT: 'teal',
} as const;

const TYPE_ICON_CLASS = {
  MATERIAL: 'bg-navy-100 text-navy-700',
  ACTIVITY: 'bg-gold-100 text-gold-600',
  ASSESSMENT: 'bg-teal-100 text-teal-700',
} as const;

export function StudentLibraryPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [subjectId, setSubjectId] = useState('ALL');
  const [type, setType] = useState<'ALL' | ResourceType>('ALL');

  const subjectsQuery = useQuery({
    queryKey: ['student', 'subjects'],
    queryFn: async () => {
      const response = await api.get<{ data: StudentSubjectsResponse }>(
        '/student/subjects',
      );
      return response.data;
    },
  });

  const resourcesQuery = useQuery({
    queryKey: ['student', 'resources', deferredSearch, subjectId, type],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
      if (subjectId !== 'ALL') params.set('subjectId', subjectId);
      if (type !== 'ALL') params.set('type', type);

      const suffix = params.toString();
      const response = await api.get<{ data: { resources: Resource[] } }>(
        `/student/resources${suffix ? `?${suffix}` : ''}`,
      );
      return response.data.resources;
    },
  });

  const resources = resourcesQuery.data ?? [];
  const subjects = subjectsQuery.data?.subjects ?? [];
  const hasFilters =
    deferredSearch.trim() !== '' || subjectId !== 'ALL' || type !== 'ALL';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Biblioteca digital"
        title="Materiais da turma"
        description="Baixe os materiais, atividades e avaliações publicados pelos professores para a sua turma."
      />

      <Card className="flex flex-col gap-4 bg-navy-900 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-400">
            <LibraryBig className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              Tudo o que você precisa para estudar
            </h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-navy-200">
              Os arquivos ficam disponíveis apenas para a sua turma. Se um
              material não abrir, baixe o arquivo e verifique se o seu leitor de
              PDF está atualizado.
            </p>
          </div>
        </div>
        <Badge tone="gold" className="shrink-0 self-start sm:self-center">
          {resources.length}{' '}
          {resources.length === 1 ? 'material' : 'materiais'}
        </Badge>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar material por título ou descrição..."
          className="w-full lg:max-w-sm"
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            aria-label="Filtrar por disciplina"
            className="sm:w-52"
          >
            <option value="ALL">Todas as disciplinas</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
          <Select
            value={type}
            onChange={(event) =>
              setType(event.target.value as 'ALL' | ResourceType)
            }
            aria-label="Filtrar por tipo"
            className="sm:w-44"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="MATERIAL">Materiais</option>
            <option value="ACTIVITY">Atividades</option>
            <option value="ASSESSMENT">Avaliações</option>
          </Select>
        </div>
      </div>

      {resourcesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </div>
      ) : resourcesQuery.isError ? (
        <ErrorState
          error={resourcesQuery.error}
          onRetry={() => resourcesQuery.refetch()}
        />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={
            hasFilters ? (
              <SearchX className="h-6 w-6" />
            ) : (
              <FileText className="h-6 w-6" />
            )
          }
          title={
            hasFilters
              ? 'Nenhum material encontrado'
              : 'Nenhum material disponível ainda'
          }
          description={
            hasFilters
              ? 'Tente outro termo ou remova os filtros para ver todos os materiais da turma.'
              : 'Assim que os professores publicarem materiais, eles aparecerão aqui.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSubjectId('ALL');
                  setType('ALL');
                }}
                className="inline-flex h-9 items-center rounded-lg border border-navy-200 bg-white px-3 text-[13px] font-semibold text-navy-700 transition hover:bg-navy-50"
              >
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => {
            const TypeIcon = TYPE_ICON[resource.type];

            return (
              <Card key={resource.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      TYPE_ICON_CLASS[resource.type],
                    )}
                  >
                    <TypeIcon className="h-5 w-5" />
                  </span>
                  <Badge tone={TYPE_TONE[resource.type]}>
                    {RESOURCE_TYPE_LABEL[resource.type]}
                  </Badge>
                </div>

                <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-navy-900">
                  {resource.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-navy-500">
                  {resource.description ?? 'Sem descrição.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone="outline">{resource.subject.code}</Badge>
                  <span className="text-[11px] text-navy-500">
                    {resource.subject.name}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-navy-400">
                  Publicado por {resource.uploadedBy ?? 'professor'} em{' '}
                  {formatDate(resource.createdAt)}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-cream-100 pt-3">
                  <span className="text-[10px] text-navy-400">
                    {formatBytes(resource.sizeBytes)} ·{' '}
                    {formatDownloads(resource.downloadCount)}
                  </span>
                  <a
                    href={resourceDownloadUrl(resource.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 text-[11px] font-semibold text-white transition hover:bg-navy-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
