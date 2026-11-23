import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Info,
  Link2,
  Plus,
  School,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import type {
  SchoolClass,
  Subject,
  Teacher,
  TeachingAssignment,
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
  Modal,
  PageHeader,
  Select,
  Skeleton,
  TableShell,
  Td,
  Th,
} from '../../components/ui';
import { SHIFT_LABEL } from '../../lib/format';
import { initials } from '../../lib/utils';

type AssignmentFormState = {
  teacherId: string;
  subjectId: string;
  classId: string;
};

const emptyForm: AssignmentFormState = {
  teacherId: '',
  subjectId: '',
  classId: '',
};

export function AdminAssignmentsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<AssignmentFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<TeachingAssignment | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ['admin', 'assignments'],
    queryFn: async () => {
      const response = await api.get<{
        data: { assignments: TeachingAssignment[] };
      }>('/admin/assignments');
      return response.data.assignments;
    },
  });

  const teachersQuery = useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: async () => {
      const response = await api.get<{ data: { teachers: Teacher[] } }>(
        '/admin/teachers',
      );
      return response.data.teachers;
    },
  });

  const subjectsQuery = useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: async () => {
      const response = await api.get<{ data: { subjects: Subject[] } }>(
        '/admin/subjects',
      );
      return response.data.subjects;
    },
  });

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
    mutationFn: (payload: AssignmentFormState) =>
      api.post('/admin/assignments', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Vínculo de ensino criado com sucesso.');
      setCreateOpen(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível criar o vínculo.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/assignments/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Vínculo removido.');
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível remover o vínculo.',
      );
    },
  });

  const teachers = teachersQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const classes = classesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const canCreate =
    teachers.length > 0 && subjects.length > 0 && classes.length > 0;

  function openCreate() {
    setForm({
      teacherId: teachers[0]?.id ?? '',
      subjectId: subjects[0]?.id ?? '',
      classId: classes[0]?.id ?? '',
    });
    setFormError(null);
    setCreateOpen(true);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.teacherId || !form.subjectId || !form.classId) {
      setFormError('Selecione o professor, a disciplina e a turma.');
      return;
    }

    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estrutura pedagógica"
        title="Vínculos de ensino"
        description="Associe professores a disciplinas e turmas. Os vínculos definem quem pode lançar notas e publicar materiais."
        actions={
          <Button
            onClick={openCreate}
            icon={<Plus className="h-4 w-4" />}
            disabled={!canCreate}
          >
            Novo vínculo
          </Button>
        }
      />

      <Card className="flex items-start gap-3 border-gold-200 bg-gold-100/40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-200/70 text-gold-600">
          <Info className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-navy-800">
            Como os vínculos funcionam
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-navy-600">
            Um vínculo conecta um professor a uma disciplina em uma turma. Com
            ele, o professor passa a ver a turma no diário de notas e pode
            publicar materiais para esses alunos. Um mesmo professor pode ter
            vários vínculos.
          </p>
        </div>
      </Card>

      {!canCreate && !teachersQuery.isLoading && !subjectsQuery.isLoading && !classesQuery.isLoading && (
        <p className="rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm text-navy-500 shadow-card">
          Para criar vínculos, cadastre pelo menos um professor, uma disciplina
          e uma turma.
        </p>
      )}

      {assignmentsQuery.isLoading ? (
        <div className="space-y-2 rounded-2xl border border-cream-200 bg-white p-4 shadow-card">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : assignmentsQuery.isError ? (
        <ErrorState
          error={assignmentsQuery.error}
          onRetry={() => assignmentsQuery.refetch()}
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-6 w-6" />}
          title="Nenhum vínculo configurado"
          description="Crie vínculos para liberar o diário de notas e a publicação de materiais aos professores."
          action={
            <Button
              onClick={openCreate}
              disabled={!canCreate}
              icon={<Plus className="h-4 w-4" />}
            >
              Criar vínculo
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Professor</Th>
              <Th>Disciplina</Th>
              <Th>Turma</Th>
              <Th>Turno</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr
                key={assignment.id}
                className="transition hover:bg-cream-50/60"
              >
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 font-display text-[10px] font-semibold text-navy-700">
                      {initials(assignment.teacher.name)}
                    </span>
                    <div>
                      <p className="font-semibold text-navy-800">
                        {assignment.teacher.name}
                      </p>
                      <p className="text-[11px] text-navy-400">
                        {assignment.teacher.email}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-cream-100 text-[9px] font-bold text-navy-600">
                      {assignment.subject.code}
                    </span>
                    <span className="text-sm">{assignment.subject.name}</span>
                  </span>
                </Td>
                <Td>
                  <Badge tone="navy">{assignment.class.name}</Badge>
                </Td>
                <Td className="text-xs text-navy-500">
                  {SHIFT_LABEL[assignment.class.shift]} · {assignment.class.year}
                </Td>
                <Td className="text-right">
                  <IconButton
                    label={`Remover vínculo de ${assignment.teacher.name}`}
                    tone="danger"
                    onClick={() => setDeleteTarget(assignment)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          if (!createMutation.isPending) setCreateOpen(false);
        }}
        title="Novo vínculo de ensino"
        description="Selecione quem leciona a disciplina na turma."
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
              form="assignment-form"
              loading={createMutation.isPending}
              icon={<Link2 className="h-4 w-4" />}
            >
              Criar vínculo
            </Button>
          </>
        }
      >
        <form id="assignment-form" onSubmit={handleCreate} className="space-y-4">
          <FormError message={formError} />

          <Field label="Professor" htmlFor="assignment-teacher" required>
            <Select
              id="assignment-teacher"
              value={form.teacherId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  teacherId: event.target.value,
                }))
              }
            >
              <option value="">Selecione o professor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.name}
                  {teacher.department ? ` · ${teacher.department}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Disciplina" htmlFor="assignment-subject" required>
              <Select
                id="assignment-subject"
                value={form.subjectId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subjectId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione a disciplina</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Turma" htmlFor="assignment-class" required>
              <Select
                id="assignment-class"
                value={form.classId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    classId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione a turma</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name} · {schoolClass.year}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-2 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-3 text-xs text-navy-500 sm:grid-cols-3">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-navy-300" />
              {teachers.length} professores
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-navy-300" />
              {subjects.length} disciplinas
            </span>
            <span className="flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-navy-300" />
              {classes.length} turmas
            </span>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remover vínculo de ensino"
        description={
          deleteTarget
            ? `O professor ${deleteTarget.teacher.name} deixará de lecionar ${deleteTarget.subject.name} na turma ${deleteTarget.class.name}. As notas e materiais já registrados são preservados.`
            : ''
        }
        confirmLabel="Remover vínculo"
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
