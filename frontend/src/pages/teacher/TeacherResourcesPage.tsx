import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, resourceDownloadUrl } from '../../lib/api';
import type {
  Resource,
  ResourceType,
  TeacherAssignment,
} from '../../types';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SearchField,
  Select,
  Skeleton,
  Textarea,
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

const ACCEPTED_FILES =
  '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip';

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function assignmentKey(assignment: TeacherAssignment) {
  return `${assignment.subject.id}|${assignment.class.id}`;
}

type UploadFormState = {
  assignmentKey: string;
  title: string;
  description: string;
  type: ResourceType;
};

const emptyUpload: UploadFormState = {
  assignmentKey: '',
  title: '',
  description: '',
  type: 'MATERIAL',
};

export function TeacherResourcesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ResourceType>('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState<UploadFormState>(emptyUpload);
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: async () => {
      const response = await api.get<{
        data: { assignments: TeacherAssignment[] };
      }>('/teacher/assignments');
      return response.data.assignments;
    },
  });

  const resourcesQuery = useQuery({
    queryKey: ['teacher', 'resources'],
    queryFn: async () => {
      const response = await api.get<{ data: { resources: Resource[] } }>(
        '/teacher/resources',
      );
      return response.data.resources;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<{ data: { resource: Resource } }>(
        '/teacher/resources',
        formData,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher'] });
      toast.success('Material publicado na biblioteca.');
      resetUpload();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível enviar o material.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/resources/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher'] });
      toast.success('Material removido da biblioteca.');
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível remover o material.',
      );
    },
  });

  const assignments = assignmentsQuery.data ?? [];
  const resources = resourcesQuery.data ?? [];

  const filtered = resources.filter((resource) => {
    if (typeFilter !== 'ALL' && resource.type !== typeFilter) return false;
    if (!search.trim()) return true;

    const haystack = [
      resource.title,
      resource.description ?? '',
      resource.subject.name,
      resource.class?.name ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  function resetUpload() {
    setUploadOpen(false);
    setForm(emptyUpload);
    setFile(null);
    setFormError(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function closeUpload() {
    if (uploadMutation.isPending) return;
    resetUpload();
  }

  function openUpload() {
    setForm({
      ...emptyUpload,
      assignmentKey: assignments[0] ? assignmentKey(assignments[0]) : '',
    });
    setFile(null);
    setFormError(null);
    setUploadOpen(true);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setFormError('O arquivo excede o limite de 15 MB.');
      event.target.value = '';
      setFile(null);
      return;
    }

    setFormError(null);
    setFile(selected);
  }

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const assignment = assignments.find(
      (item) => assignmentKey(item) === form.assignmentKey,
    );

    if (!assignment) {
      setFormError('Selecione a turma e a disciplina do material.');
      return;
    }

    if (form.title.trim().length < 3) {
      setFormError('Informe um título com pelo menos 3 caracteres.');
      return;
    }

    if (!file) {
      setFormError('Selecione o arquivo que será enviado.');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('subjectId', assignment.subject.id);
    formData.append('classId', assignment.class.id);
    formData.append('type', form.type);
    formData.append('file', file);

    uploadMutation.mutate(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Biblioteca"
        title="Materiais de apoio"
        description="Publique listas, roteiros e avaliações para as turmas que você leciona. Os alunos acessam na hora."
        actions={
          <Button
            onClick={openUpload}
            disabled={assignments.length === 0}
            icon={<UploadCloud className="h-4 w-4" />}
          >
            Enviar material
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título, disciplina ou turma..."
          className="w-full sm:max-w-sm"
        />
        <Select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as 'ALL' | ResourceType)
          }
          className="sm:w-48"
          aria-label="Filtrar por tipo"
        >
          <option value="ALL">Todos os tipos</option>
          <option value="MATERIAL">Materiais</option>
          <option value="ACTIVITY">Atividades</option>
          <option value="ASSESSMENT">Avaliações</option>
        </Select>
        <p className="text-xs text-navy-400 sm:ml-auto">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'material encontrado' : 'materiais encontrados'}
        </p>
      </div>

      {resourcesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52" />
          ))}
        </div>
      ) : resourcesQuery.isError ? (
        <ErrorState
          error={resourcesQuery.error}
          onRetry={() => resourcesQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title={
            resources.length === 0
              ? 'Sua biblioteca está vazia'
              : 'Nenhum material encontrado'
          }
          description={
            resources.length === 0
              ? 'Envie o primeiro material para disponibilizar aos alunos.'
              : 'Tente outro termo de busca ou remova o filtro de tipo.'
          }
          action={
            assignments.length > 0 ? (
              <Button
                onClick={openUpload}
                icon={<UploadCloud className="h-4 w-4" />}
              >
                Enviar material
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((resource) => {
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
                  <div className="text-right">
                    <Badge tone={TYPE_TONE[resource.type]}>
                      {RESOURCE_TYPE_LABEL[resource.type]}
                    </Badge>
                    <p className="mt-1 text-[10px] text-navy-300">
                      {formatDate(resource.createdAt)}
                    </p>
                  </div>
                </div>

                <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-navy-900">
                  {resource.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-navy-500">
                  {resource.description ?? 'Sem descrição.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone="outline">{resource.subject.code}</Badge>
                  <span className="truncate text-[11px] text-navy-500">
                    {resource.subject.name}
                  </span>
                  {resource.class && (
                    <span className="ml-auto text-[11px] text-navy-400">
                      {resource.class.name}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-cream-100 pt-3">
                  <span className="flex items-center gap-2 text-[10px] text-navy-400">
                    <FileText className="h-3 w-3" />
                    {formatBytes(resource.sizeBytes)} ·{' '}
                    {formatDownloads(resource.downloadCount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={resourceDownloadUrl(resource.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-navy-600 transition hover:bg-navy-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </a>
                    <IconButton
                      label={`Excluir ${resource.title}`}
                      tone="danger"
                      onClick={() => setDeleteTarget(resource)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={uploadOpen}
        onClose={closeUpload}
        title="Enviar material"
        description="O arquivo ficará disponível apenas para a turma selecionada."
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeUpload}
              disabled={uploadMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="resource-form"
              loading={uploadMutation.isPending}
              icon={<UploadCloud className="h-4 w-4" />}
            >
              Publicar material
            </Button>
          </>
        }
      >
        <form id="resource-form" onSubmit={handleUpload} className="space-y-4">
          <FormError message={formError} />

          <Field label="Turma e disciplina" htmlFor="resource-assignment" required>
            <Select
              id="resource-assignment"
              value={form.assignmentKey}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  assignmentKey: event.target.value,
                }))
              }
            >
              <option value="">Selecione</option>
              {assignments.map((assignment) => (
                <option
                  key={assignment.id}
                  value={assignmentKey(assignment)}
                >
                  {assignment.class.name} · {assignment.subject.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Título" htmlFor="resource-title" required>
            <Input
              id="resource-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ex.: Lista de exercícios - Funções do 1º grau"
              maxLength={160}
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field
              label="Descrição"
              htmlFor="resource-description"
              hint="Opcional. Explique o conteúdo e as orientações de uso."
            >
              <Textarea
                id="resource-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Orientações para os alunos..."
                maxLength={1000}
              />
            </Field>

            <Field label="Tipo" htmlFor="resource-type" required>
              <Select
                id="resource-type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as ResourceType,
                  }))
                }
              >
                <option value="MATERIAL">Material</option>
                <option value="ACTIVITY">Atividade</option>
                <option value="ASSESSMENT">Avaliação</option>
              </Select>
            </Field>
          </div>

          <Field label="Arquivo" required>
            <label
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition',
                file
                  ? 'border-teal-300 bg-teal-100/40'
                  : 'border-navy-200 bg-cream-50 hover:border-gold-300 hover:bg-gold-100/30',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  file
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-white text-navy-400 shadow-sm',
                )}
              >
                <UploadCloud className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-navy-700">
                {file ? file.name : 'Clique para selecionar o arquivo'}
              </span>
              <span className="text-[11px] text-navy-400">
                {file
                  ? `${formatBytes(file.size)} · pronto para envio`
                  : 'PDF, DOCX, PPTX, XLSX, TXT, CSV, imagem ou ZIP · até 15 MB'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILES}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir material"
        description={
          deleteTarget
            ? `O material "${deleteTarget.title}" será removido da biblioteca e não poderá ser baixado pelos alunos. Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir material"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
