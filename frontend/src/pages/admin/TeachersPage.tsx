import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  Link2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import type { Teacher } from '../../types';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  TableShell,
  Td,
  Th,
} from '../../components/ui';
import { initials } from '../../lib/utils';

type TeacherFormState = {
  name: string;
  email: string;
  password: string;
  employeeNumber: string;
  department: string;
};

const emptyForm: TeacherFormState = {
  name: '',
  email: '',
  password: '',
  employeeNumber: '',
  department: '',
};

export function AdminTeachersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<TeacherFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const teachersQuery = useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: async () => {
      const response = await api.get<{ data: { teachers: Teacher[] } }>(
        '/admin/teachers',
      );
      return response.data.teachers;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/teachers', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Professor cadastrado com sucesso.');
      setCreateOpen(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível cadastrar o professor.',
      );
    },
  });

  function update<K extends keyof TeacherFormState>(
    key: K,
    value: TeacherFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.employeeNumber.trim()
    ) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      employeeNumber: form.employeeNumber.trim(),
      department: form.department.trim() || null,
    });
  }

  const teachers = teachersQuery.data ?? [];
  const departments = new Set(
    teachers.map((teacher) => teacher.department).filter(Boolean),
  ).size;
  const assignments = teachers.reduce(
    (total, teacher) => total + teacher.assignments,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Secretaria"
        title="Professores"
        description="Gerencie o corpo docente e acompanhe os vínculos de ensino de cada professor."
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormError(null);
              setCreateOpen(true);
            }}
            icon={<UserPlus className="h-4 w-4" />}
          >
            Novo professor
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-none text-navy-900">
              {teachers.length}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-navy-400">
              Professores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-none text-navy-900">
              {departments}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-navy-400">
              Departamentos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-none text-navy-900">
              {assignments}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-navy-400">
              Vínculos ativos
            </p>
          </div>
        </div>
      </div>

      {teachersQuery.isLoading ? (
        <div className="space-y-2 rounded-2xl border border-cream-200 bg-white p-4 shadow-card">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : teachersQuery.isError ? (
        <ErrorState
          error={teachersQuery.error}
          onRetry={() => teachersQuery.refetch()}
        />
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Nenhum professor cadastrado"
          description="Cadastre o primeiro professor e depois vincule-o às turmas e disciplinas."
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Cadastrar professor
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Professor</Th>
              <Th>Matrícula funcional</Th>
              <Th>Departamento</Th>
              <Th>Vínculos</Th>
              <Th>Situação</Th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr
                key={teacher.id}
                className="transition hover:bg-cream-50/60"
              >
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-[11px] font-semibold text-navy-700">
                      {initials(teacher.user.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-800">
                        {teacher.user.name}
                      </p>
                      <p className="truncate text-xs text-navy-400">
                        {teacher.user.email}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="font-mono text-xs">{teacher.employeeNumber}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-sm text-navy-600">
                    <Briefcase className="h-3.5 w-3.5 text-navy-300" />
                    {teacher.department ?? 'Não informado'}
                  </span>
                </Td>
                <Td>
                  <Badge tone={teacher.assignments > 0 ? 'teal' : 'neutral'}>
                    {teacher.assignments}{' '}
                    {teacher.assignments === 1 ? 'vínculo' : 'vínculos'}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={teacher.active ? 'green' : 'red'}>
                    {teacher.active ? 'Ativo' : 'Inativo'}
                  </Badge>
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
        title="Cadastrar professor"
        description="O professor recebe acesso imediato com a senha inicial informada."
        size="lg"
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
              form="teacher-form"
              loading={createMutation.isPending}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Cadastrar professor
            </Button>
          </>
        }
      >
        <form id="teacher-form" onSubmit={handleCreate} className="space-y-4">
          <FormError message={formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" htmlFor="teacher-name" required>
              <Input
                id="teacher-name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Ex.: Helena Martins"
                autoComplete="off"
              />
            </Field>

            <Field label="E-mail institucional" htmlFor="teacher-email" required>
              <Input
                id="teacher-email"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="nome.sobrenome@colegiohorizonte.edu.br"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Senha inicial"
              htmlFor="teacher-password"
              required
              hint="Mínimo de 8 caracteres, com letras e números."
            >
              <Input
                id="teacher-password"
                type="password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="Senha de primeiro acesso"
                autoComplete="new-password"
              />
            </Field>

            <Field
              label="Matrícula funcional"
              htmlFor="teacher-employee"
              required
            >
              <Input
                id="teacher-employee"
                value={form.employeeNumber}
                onChange={(event) =>
                  update('employeeNumber', event.target.value)
                }
                placeholder="Ex.: PROF-006"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Departamento"
              htmlFor="teacher-department"
              className="sm:col-span-2"
              hint="Opcional. Ajuda a organizar o corpo docente por área."
            >
              <Input
                id="teacher-department"
                value={form.department}
                onChange={(event) => update('department', event.target.value)}
                placeholder="Ex.: Ciências Exatas"
                autoComplete="off"
              />
            </Field>
          </div>

          <p className="text-xs leading-relaxed text-navy-400">
            Após o cadastro, acesse <strong>Vínculos de ensino</strong> para
            associar o professor às turmas e disciplinas que ele leciona.
          </p>
        </form>
      </Modal>
    </div>
  );
}
