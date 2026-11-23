import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarRange,
  GraduationCap,
  Link2,
  Plus,
  School,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import type { SchoolClass, Shift } from '../../types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  Input,
  Meter,
  Modal,
  PageHeader,
  Select,
  Skeleton,
} from '../../components/ui';
import { SHIFT_LABEL } from '../../lib/format';

type ClassFormState = {
  name: string;
  year: string;
  shift: Shift;
};

const emptyForm = (): ClassFormState => ({
  name: '',
  year: String(new Date().getFullYear()),
  shift: 'MORNING',
});

export function AdminClassesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ClassFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const classesQuery = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: async () => {
      const response = await api.get<{ data: { classes: SchoolClass[] } }>(
        '/admin/classes',
      );
      return response.data.classes;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/classes', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Turma criada com sucesso.');
      setCreateOpen(false);
      setForm(emptyForm());
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível criar a turma.',
      );
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.year) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    const year = Number(form.year);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setFormError('Informe um ano letivo válido.');
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      year,
      shift: form.shift,
    });
  }

  const classes = classesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estrutura pedagógica"
        title="Turmas"
        description="Organize as turmas do ano letivo. Os alunos são vinculados à turma no momento da matrícula."
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm());
              setFormError(null);
              setCreateOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Nova turma
          </Button>
        }
      />

      {classesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      ) : classesQuery.isError ? (
        <ErrorState
          error={classesQuery.error}
          onRetry={() => classesQuery.refetch()}
        />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<School className="h-6 w-6" />}
          title="Nenhuma turma criada"
          description="Crie a primeira turma para começar a matricular alunos e montar os vínculos de ensino."
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Criar turma
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((schoolClass) => (
            <Card key={schoolClass.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                    <School className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-navy-900">
                      {schoolClass.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-navy-400">
                      <CalendarRange className="h-3 w-3" />
                      Ano letivo {schoolClass.year}
                    </p>
                  </div>
                </div>
                <Badge tone="outline">{SHIFT_LABEL[schoolClass.shift]}</Badge>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-navy-600">
                  <Users className="h-4 w-4 text-navy-300" />
                  {schoolClass.students}{' '}
                  {schoolClass.students === 1 ? 'aluno' : 'alunos'}
                </span>
                <span className="flex items-center gap-1.5 text-navy-600">
                  <Link2 className="h-4 w-4 text-navy-300" />
                  {schoolClass.assignments}{' '}
                  {schoolClass.assignments === 1 ? 'vínculo' : 'vínculos'}
                </span>
              </div>

              <Meter
                value={Math.min(10, (schoolClass.students / 30) * 10)}
                tone="gold"
                className="mt-3"
              />
              <p className="mt-1.5 text-[10px] text-navy-400">
                Referência de ocupação: 30 alunos por turma.
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-cream-100 pt-3 text-[11px] text-navy-400">
                <GraduationCap className="h-3.5 w-3.5" />
                Matrículas ativas no ano letivo
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
        title="Nova turma"
        description="A turma será criada para o ano letivo informado."
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
              form="class-form"
              loading={createMutation.isPending}
              icon={<Plus className="h-4 w-4" />}
            >
              Criar turma
            </Button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleCreate} className="space-y-4">
          <FormError message={formError} />

          <Field
            label="Nome da turma"
            htmlFor="class-name"
            required
            hint="Ex.: 9º Ano A, 1ª Série EM B."
          >
            <Input
              id="class-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: 1ª Série EM A"
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ano letivo" htmlFor="class-year" required>
              <Input
                id="class-year"
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Turno" htmlFor="class-shift" required>
              <Select
                id="class-shift"
                value={form.shift}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shift: event.target.value as Shift,
                  }))
                }
              >
                <option value="MORNING">Manhã</option>
                <option value="AFTERNOON">Tarde</option>
                <option value="EVENING">Noite</option>
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
