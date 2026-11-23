import {
  useDeferredValue,
  useState,
  type FormEvent,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Power,
  UserPlus,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import type { SchoolClass, Student } from '../../types';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  Input,
  Modal,
  PageHeader,
  SearchField,
  Select,
  Skeleton,
  TableShell,
  Td,
  Th,
} from '../../components/ui';
import { SHIFT_LABEL, formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';

type StudentFormState = {
  name: string;
  email: string;
  password: string;
  registrationNumber: string;
  classId: string;
  birthDate: string;
  phone: string;
};

const emptyForm: StudentFormState = {
  name: '',
  email: '',
  password: '',
  registrationNumber: '',
  classId: '',
  birthDate: '',
  phone: '',
};

export function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Student | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['admin', 'students', deferredSearch],
    queryFn: async () => {
      const suffix = deferredSearch
        ? `?search=${encodeURIComponent(deferredSearch)}`
        : '';
      const response = await api.get<{ data: { students: Student[] } }>(
        `/admin/students${suffix}`,
      );
      return response.data.students;
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
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/students', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Aluno cadastrado com sucesso.');
      setCreateOpen(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível cadastrar o aluno.',
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/admin/students/${id}`, { active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success(
        toggleTarget?.active
          ? 'Acesso do aluno desativado.'
          : 'Acesso do aluno reativado.',
      );
      setToggleTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível atualizar o aluno.',
      );
    },
  });

  function openCreate() {
    setForm({
      ...emptyForm,
      classId: classesQuery.data?.[0]?.id ?? '',
    });
    setFormError(null);
    setCreateOpen(true);
  }

  function update<K extends keyof StudentFormState>(
    key: K,
    value: StudentFormState[K],
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
      !form.registrationNumber.trim() ||
      !form.classId
    ) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      registrationNumber: form.registrationNumber.trim(),
      classId: form.classId,
      birthDate: form.birthDate || null,
      phone: form.phone.trim() || null,
    });
  }

  const students = studentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Secretaria"
        title="Alunos"
        description="Cadastre novos estudantes, acompanhe matrículas e controle o acesso ao portal."
        actions={
          <Button
            onClick={openCreate}
            icon={<UserPlus className="h-4 w-4" />}
            disabled={classesQuery.isLoading}
          >
            Novo aluno
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, e-mail ou matrícula..."
          className="w-full sm:max-w-sm"
        />
        <p className="text-xs text-navy-400">
          {studentsQuery.isLoading
            ? 'Carregando alunos...'
            : `${students.length} ${students.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}`}
        </p>
      </div>

      {studentsQuery.isLoading ? (
        <div className="space-y-2 rounded-2xl border border-cream-200 bg-white p-4 shadow-card">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : studentsQuery.isError ? (
        <ErrorState
          error={studentsQuery.error}
          onRetry={() => studentsQuery.refetch()}
        />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title={search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          description={
            search
              ? 'Tente outro nome, e-mail ou número de matrícula.'
              : 'Cadastre o primeiro aluno para começar a montar a turma.'
          }
          action={
            <Button onClick={openCreate} icon={<UserPlus className="h-4 w-4" />}>
              Cadastrar aluno
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Aluno</Th>
              <Th>Matrícula</Th>
              <Th>Turma</Th>
              <Th>Nascimento</Th>
              <Th>Situação</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className={cn(
                  'transition hover:bg-cream-50/60',
                  !student.active && 'opacity-60',
                )}
              >
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-[11px] font-semibold text-navy-700">
                      {student.user.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-800">
                        {student.user.name}
                      </p>
                      <p className="truncate text-xs text-navy-400">
                        {student.user.email}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="font-mono text-xs">{student.registrationNumber}</Td>
                <Td>
                  {student.enrollment ? (
                    <div>
                      <p className="text-sm font-medium text-navy-700">
                        {student.enrollment.class.name}
                      </p>
                      <p className="text-[11px] text-navy-400">
                        {SHIFT_LABEL[student.enrollment.class.shift]}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-navy-400">Sem turma</span>
                  )}
                </Td>
                <Td className="text-xs text-navy-500">
                  {formatDate(student.birthDate)}
                </Td>
                <Td>
                  <Badge tone={student.active ? 'green' : 'red'}>
                    {student.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button
                    size="sm"
                    variant={student.active ? 'ghost' : 'outline'}
                    className={cn(
                      student.active && 'text-red-600 hover:bg-red-50',
                    )}
                    onClick={() => setToggleTarget(student)}
                    icon={
                      student.active ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {student.active ? 'Desativar' : 'Ativar'}
                  </Button>
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
        title="Cadastrar aluno"
        description="O aluno recebe acesso imediato com a senha inicial informada."
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
              form="student-form"
              loading={createMutation.isPending}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Cadastrar aluno
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleCreate} className="space-y-4">
          <FormError message={formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" htmlFor="student-name" required>
              <Input
                id="student-name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Ex.: Maria Eduarda Santos"
                autoComplete="off"
              />
            </Field>

            <Field label="E-mail institucional" htmlFor="student-email" required>
              <Input
                id="student-email"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="nome.sobrenome@aluno.colegiohorizonte.edu.br"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Senha inicial"
              htmlFor="student-password"
              required
              hint="Mínimo de 8 caracteres, com letras e números."
            >
              <Input
                id="student-password"
                type="password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="Senha de primeiro acesso"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Número de matrícula" htmlFor="student-registration" required>
              <Input
                id="student-registration"
                value={form.registrationNumber}
                onChange={(event) =>
                  update('registrationNumber', event.target.value)
                }
                placeholder="Ex.: 2026-9A-10"
                autoComplete="off"
              />
            </Field>

            <Field label="Turma" htmlFor="student-class" required>
              <Select
                id="student-class"
                value={form.classId}
                onChange={(event) => update('classId', event.target.value)}
              >
                <option value="">Selecione a turma</option>
                {(classesQuery.data ?? []).map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name} · {schoolClass.year} ·{' '}
                    {SHIFT_LABEL[schoolClass.shift]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Data de nascimento" htmlFor="student-birthdate">
              <Input
                id="student-birthdate"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.birthDate}
                onChange={(event) => update('birthDate', event.target.value)}
              />
            </Field>

            <Field
              label="Telefone de contato"
              htmlFor="student-phone"
              className="sm:col-span-2"
            >
              <Input
                id="student-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="(11) 90000-0000"
              />
            </Field>
          </div>

          <p className="text-xs leading-relaxed text-navy-400">
            A matrícula é criada automaticamente na turma selecionada, no ano
            letivo correspondente. O aluno pode alterar a senha no primeiro
            acesso.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={
          toggleTarget?.active ? 'Desativar acesso do aluno' : 'Reativar acesso'
        }
        description={
          toggleTarget?.active
            ? `Ao desativar, ${toggleTarget?.user.name} não conseguirá mais entrar no portal. Os dados acadêmicos são preservados.`
            : `O aluno ${toggleTarget?.user.name} voltará a ter acesso ao portal com a senha atual.`
        }
        confirmLabel={toggleTarget?.active ? 'Desativar acesso' : 'Reativar acesso'}
        danger={Boolean(toggleTarget?.active)}
        loading={toggleMutation.isPending}
        onConfirm={() => {
          if (!toggleTarget) return;
          toggleMutation.mutate({
            id: toggleTarget.id,
            active: !toggleTarget.active,
          });
        }}
        onClose={() => {
          if (!toggleMutation.isPending) setToggleTarget(null);
        }}
      />
    </div>
  );
}
