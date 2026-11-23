import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardPenLine,
  Info,
  Save,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import type {
  Gradebook,
  TeacherAssignment,
} from '../../types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  TableShell,
  Td,
  Th,
} from '../../components/ui';
import { gradeStatus, gradeTone } from '../../lib/format';
import { cn } from '../../lib/utils';

const PERIODS = [1, 2, 3, 4];

const toneInputClass: Record<string, string> = {
  good: 'border-teal-200 bg-teal-50 text-teal-700 focus:border-teal-400 focus:ring-teal-100',
  ok: 'border-gold-300 bg-gold-100/60 text-gold-600 focus:border-gold-400 focus:ring-gold-100',
  risk: 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-100',
  muted: '',
};

const toneBadge = {
  good: 'green',
  ok: 'gold',
  risk: 'red',
  muted: 'neutral',
} as const;

function assignmentKey(assignment: TeacherAssignment) {
  return `${assignment.subject.id}|${assignment.class.id}`;
}

function parseGrade(raw: string): number | null | undefined {
  const normalized = raw.trim().replace(',', '.');

  if (!normalized) return null;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(normalized)) return undefined;

  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0 || value > 10) return undefined;

  return Math.round(value * 10) / 10;
}

export function GradebookPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selection, setSelection] = useState<string | null>(null);
  const [period, setPeriod] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const assignmentsQuery = useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: async () => {
      const response = await api.get<{
        data: { assignments: TeacherAssignment[] };
      }>('/teacher/assignments');
      return response.data.assignments;
    },
  });

  const requestedKey = useMemo(() => {
    const subjectId = searchParams.get('subjectId');
    const classId = searchParams.get('classId');

    return subjectId && classId ? `${subjectId}|${classId}` : null;
  }, [searchParams]);

  const assignments = assignmentsQuery.data ?? [];

  const activeAssignment = useMemo(() => {
    const desiredKey = selection ?? requestedKey;

    return (
      assignments.find(
        (assignment) => assignmentKey(assignment) === desiredKey,
      ) ??
      assignments[0] ??
      null
    );
  }, [assignments, selection, requestedKey]);

  const gradebookQuery = useQuery({
    queryKey: [
      'teacher',
      'gradebook',
      activeAssignment?.subject.id,
      activeAssignment?.class.id,
      period,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        subjectId: activeAssignment!.subject.id,
        classId: activeAssignment!.class.id,
        period: String(period),
      });
      const response = await api.get<{ data: Gradebook }>(
        `/teacher/gradebook?${params.toString()}`,
      );
      return response.data;
    },
    enabled: Boolean(activeAssignment),
  });

  const gradebook = gradebookQuery.data;

  useEffect(() => {
    if (!gradebook) return;

    const nextValues: Record<string, string> = {};

    for (const student of gradebook.students) {
      nextValues[student.studentId] = student.grade
        ? String(student.grade.value).replace('.', ',')
        : '';
    }

    setValues(nextValues);
    setDirty(false);
  }, [gradebook]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      subjectId: string;
      classId: string;
      period: number;
      grades: Array<{ studentId: string; value: number | null }>;
    }) => api.put<{ message: string; saved: number }>('/teacher/grades', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher'] });
      toast.success('Notas salvas com sucesso.');
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar as notas.',
      );
    },
  });

  function handleAssignmentChange(value: string) {
    setSelection(value);
    setValues({});
    setDirty(false);
  }

  function handlePeriodChange(value: string) {
    setPeriod(Number(value));
    setValues({});
    setDirty(false);
  }

  function handleSave() {
    if (!activeAssignment || !gradebook) return;

    const grades: Array<{ studentId: string; value: number | null }> = [];

    for (const student of gradebook.students) {
      const parsed = parseGrade(values[student.studentId] ?? '');

      if (parsed === undefined) {
        toast.error(
          `Nota inválida para ${student.name}. Informe um valor entre 0 e 10.`,
        );
        return;
      }

      grades.push({ studentId: student.studentId, value: parsed });
    }

    saveMutation.mutate({
      subjectId: activeAssignment.subject.id,
      classId: activeAssignment.class.id,
      period,
      grades,
    });
  }

  const filledCount = gradebook
    ? gradebook.students.filter(
        (student) => (values[student.studentId] ?? '').trim() !== '',
      ).length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diário de notas"
        title="Lançamento de notas"
        description="Registre o desempenho da turma por período. As notas ficam visíveis no boletim do aluno imediatamente após salvar."
      />

      {assignmentsQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
        </div>
      ) : assignmentsQuery.isError ? (
        <ErrorState
          error={assignmentsQuery.error}
          onRetry={() => assignmentsQuery.refetch()}
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardPenLine className="h-6 w-6" />}
          title="Nenhuma turma atribuída"
          description="Você ainda não possui vínculos de ensino. Procure a coordenação para ser associado às suas turmas e disciplinas."
        />
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto] lg:items-end">
              <Field label="Turma e disciplina" htmlFor="gradebook-assignment">
                <Select
                  id="gradebook-assignment"
                  value={activeAssignment ? assignmentKey(activeAssignment) : ''}
                  onChange={(event) => handleAssignmentChange(event.target.value)}
                >
                  {assignments.map((assignment) => (
                    <option
                      key={assignment.id}
                      value={assignmentKey(assignment)}
                    >
                      {assignment.class.name} · {assignment.subject.name} (
                      {assignment.subject.code})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Período" htmlFor="gradebook-period">
                <Select
                  id="gradebook-period"
                  value={period}
                  onChange={(event) => handlePeriodChange(event.target.value)}
                >
                  {PERIODS.map((item) => (
                    <option key={item} value={item}>
                      {item}º período
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {dirty && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gold-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                    Alterações não salvas
                  </span>
                )}
                <Button
                  onClick={handleSave}
                  loading={saveMutation.isPending}
                  disabled={!gradebook || gradebook.students.length === 0}
                  icon={<Save className="h-4 w-4" />}
                >
                  Salvar notas
                </Button>
              </div>
            </div>
          </Card>

          {gradebookQuery.isLoading ? (
            <div className="space-y-2 rounded-2xl border border-cream-200 bg-white p-4 shadow-card">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-11" />
              ))}
            </div>
          ) : gradebookQuery.isError ? (
            <ErrorState
              error={gradebookQuery.error}
              onRetry={() => gradebookQuery.refetch()}
            />
          ) : gradebook ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-card">
                <Badge tone="navy">{gradebook.subject.code}</Badge>
                <span className="text-sm font-semibold text-navy-800">
                  {gradebook.subject.name}
                </span>
                <span className="hidden h-4 w-px bg-cream-200 sm:block" />
                <span className="text-sm text-navy-500">
                  {gradebook.class.name} · {gradebook.class.year}
                </span>
                <Badge tone="gold">{gradebook.period}º período</Badge>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-navy-400">
                  <Users className="h-3.5 w-3.5" />
                  {gradebook.students.length} alunos · {filledCount} notas
                  preenchidas
                </span>
              </div>

              {gradebook.students.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="Nenhum aluno matriculado"
                  description="Esta turma ainda não possui alunos ativos. A secretaria pode realizar as matrículas."
                />
              ) : (
                <TableShell>
                  <thead>
                    <tr>
                      <Th className="w-12">#</Th>
                      <Th>Aluno</Th>
                      <Th>Matrícula</Th>
                      <Th className="w-32">Nota</Th>
                      <Th>Situação</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.students.map((student, index) => {
                      const raw = values[student.studentId] ?? '';
                      const parsed = parseGrade(raw);
                      const numeric =
                        parsed === null || parsed === undefined ? null : parsed;
                      const tone = gradeTone(numeric);

                      return (
                        <tr
                          key={student.studentId}
                          className="transition hover:bg-cream-50/60"
                        >
                          <Td className="text-xs text-navy-400">
                            {String(index + 1).padStart(2, '0')}
                          </Td>
                          <Td>
                            <p className="font-semibold text-navy-800">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-navy-400">
                              {student.email}
                            </p>
                          </Td>
                          <Td className="font-mono text-xs">
                            {student.registrationNumber}
                          </Td>
                          <Td>
                            <Input
                              value={raw}
                              onChange={(event) => {
                                setValues((current) => ({
                                  ...current,
                                  [student.studentId]: event.target.value.replace(
                                    /[^\d.,]/g,
                                    '',
                                  ),
                                }));
                                setDirty(true);
                              }}
                              inputMode="decimal"
                              placeholder="—"
                              aria-label={`Nota de ${student.name}`}
                              className={cn(
                                'h-9 w-20 text-center font-display font-semibold',
                                toneInputClass[tone],
                              )}
                            />
                          </Td>
                          <Td>
                            <Badge tone={toneBadge[tone]}>
                              {gradeStatus(numeric)}
                            </Badge>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableShell>
              )}

              <div className="flex items-start gap-2.5 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-xs leading-relaxed text-navy-500">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <p>
                  A média de aprovação do colégio é <strong>6,0</strong>. Notas
                  abaixo de 6,0 aparecem destacadas em vermelho para facilitar o
                  acompanhamento. Deixe o campo vazio para remover uma nota já
                  lançada.
                </p>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
