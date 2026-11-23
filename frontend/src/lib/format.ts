import type { ResourceType, Role, Shift } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administração',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
};

export const SHIFT_LABEL: Record<Shift, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
};

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  MATERIAL: 'Material',
  ACTIVITY: 'Atividade',
  ASSESSMENT: 'Avaliação',
};

export function formatGrade(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatAverage(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: value >= 10 || exponent === 0 ? 0 : 1,
  }).format(value)} ${units[exponent]}`;
}

export function formatDownloads(count: number) {
  return `${count} ${count === 1 ? 'download' : 'downloads'}`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(value: string | Date | null | undefined) {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function gradeTone(value: number | null | undefined) {
  if (value === null || value === undefined) return 'muted';
  if (value >= 7) return 'good';
  if (value >= 6) return 'ok';
  return 'risk';
}

export function gradeStatus(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Sem nota';
  if (value >= 7) return 'Consolidado';
  if (value >= 6) return 'Em dia';
  return 'Atenção';
}
