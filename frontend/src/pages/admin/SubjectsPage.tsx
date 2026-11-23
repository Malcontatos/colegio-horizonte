import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  FileText,
  Link2,
  Plus,
  School,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import type { Subject } from '../../types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  Input,
  Modal,
  PageHeader,
  Skeleton,
} from '../../components/ui';

type SubjectFormState = {
  name: string;
  code: string;
  workload: string;
};

const emptyForm: SubjectFormState = { name: '', code: '', workload: '80' };

export function AdminSubjectsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<SubjectFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: async () => {
      const response = await api.get<{ data: { subjects: Subject[] } }>(
        '/admin/subjects',
      );
      return response.data.subjects;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/subjects', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Disciplina criada com sucesso.');
      setCreateOpen(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível criar a disciplina.',
      );
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.code.trim() || !form.workload) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    const workload = Number(form.workload);

    if (!Number.isFinite(workload) || workload <= 0) {
      setFormError('Informe uma carga horária válida.');
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      workload,
    });
  }

  const subjects = subjectsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estrutura pedagógica"
        title="Disciplinas"
        description="Defina a grade curricular do colégio. Cada disciplina pode ser vinculada a várias turmas e professores."
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormError(null);
              setCreateOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Nova disciplina
          </Button>
        }
      />

      {subjectsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : subjectsQuery.isError ? (
        <ErrorState
          error={subjectsQuery.error}
          onRetry={() => subjectsQuery.refetch()}
        />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Nenhuma disciplina cadastrada"
          description="Comece criando as disciplinas que compõem a grade curricular."
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Criar disciplina
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 font-display text-[11px] font-semibold tracking-wider text-gold-300">
                    {subject.code}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-navy-900">
                      {subject.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-navy-400">
                      <Clock className="h-3 w-3" />
                      {subject.workload} horas anuais
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-cream-50 px-2 py-2 text-center">
                  <p className="font-display text-sm font-semibold text-navy-800">
                    {subject.assignments}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                    Vínculos
                  </p>
                </div>
                <div className="rounded-lg bg-cream-50 px-2 py-2 text-center">
                  <p className="font-display text-sm font-semibold text-navy-800">
                    {subject.resources}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                    Materiais
                  </p>
                </div>
                <div className="rounded-lg bg-cream-50 px-2 py-2 text-center">
                  <p className="font-display text-sm font-semibold text-navy-800">
                    {subject.grades}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                    Notas
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {subject.assignments === 0 ? (
                  <Badge tone="gold">Sem vínculos de ensino</Badge>
                ) : (
                  <Badge tone="teal">
                    <Link2 className="h-3 w-3" />
                    Ativa em {subject.assignments}{' '}
                    {subject.assignments === 1 ? 'turma' : 'turmas'}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          if (!createMutation.isPending) setCreateOpen(false);
        }}
        title="Nova disciplina"
        description="A disciplina fica disponível para vínculos com turmas e professores."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="subject-form"
              loading={createMutation.isPending}
              icon={<Plus className="h-4 w-4" />}
            >
              Criar disciplina
            </Button>
          </>
        }
      >
        <form id="subject-form" onSubmit={handleCreate} className="space-y-4">
          <FormError message={formError} />

          <Field label="Nome da disciplina" htmlFor="subject-name" required>
            <Input
              id="subject-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Educação Física"
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Código"
              htmlFor="subject-code"
              required
              hint="Até 10 caracteres, somente letras e números."
            >
              <Input
                id="subject-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="Ex.: EDF"
                maxLength={10}
                className="font-mono uppercase"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Carga horária anual"
              htmlFor="subject-workload"
              required
              hint="Em horas."
            >
              <Input
                id="subject-workload"
                type="number"
                min={1}
                max={2000}
                value={form.workload}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    workload: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-3 text-xs leading-relaxed text-navy-500">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
            <p>
              A carga horária é informativa e aparece no boletim do aluno. Ela
              não limita o número de aulas ou lançamentos de notas.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
