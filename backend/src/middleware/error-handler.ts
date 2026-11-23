import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors.ts';
import { env } from '../config/env.ts';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `O arquivo excede o limite de ${env.MAX_UPLOAD_MB} MB.`
        : 'Não foi possível enviar o arquivo. Verifique o formato e tente novamente.';

    res.status(400).json({
      error: { message, code: error.code },
    });
    return;
  }

  const code = (error as { code?: string }).code;

  if (code === 'P2002') {
    const target =
      (error as { meta?: { target?: string[] } }).meta?.target?.join(', ') ?? '';

    let message = 'Já existe um registro com estes dados.';

    if (target.includes('email')) {
      message = 'Este e-mail já está em uso.';
    } else if (target.includes('registrationNumber')) {
      message = 'Esta matrícula já está cadastrada.';
    } else if (target.includes('employeeNumber')) {
      message = 'Esta matrícula funcional já está cadastrada.';
    } else if (target.includes('code')) {
      message = 'Este código de disciplina já está em uso.';
    } else if (target.includes('name') && target.includes('year')) {
      message = 'Já existe uma turma com este nome neste ano.';
    }

    res.status(409).json({
      error: { message, code: 'CONFLICT' },
    });
    return;
  }

  if (code === 'P2025') {
    res.status(404).json({
      error: { message: 'Registro não encontrado.', code: 'NOT_FOUND' },
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: {
        message: 'JSON inválido no corpo da requisição.',
        code: 'INVALID_JSON',
      },
    });
    return;
  }

  console.error('[api] Erro não tratado:', error);

  res.status(500).json({
    error: {
      message: 'Ocorreu um erro interno. Tente novamente em instantes.',
      code: 'INTERNAL_ERROR',
      ...(env.NODE_ENV !== 'production' && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
  });
};
