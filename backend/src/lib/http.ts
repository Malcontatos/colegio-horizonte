import type { ZodType } from 'zod';
import { AppError } from './errors.ts';

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new AppError(
      400,
      firstIssue?.message ?? 'Dados inválidos.',
      'VALIDATION_ERROR',
      result.error.issues,
    );
  }

  return result.data;
}
